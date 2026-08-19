#!/usr/bin/env bash
#
# Drop images the cluster can no longer roll back to.
#
# Every pipeline run pushes another SHA-tagged image (~138MB) into the local
# registry. That registry lives on the DinD disk, which is the same disk that
# backs the k3s node - once it fills, kubelet taints the node with
# disk-pressure and nothing schedules at all.
#
# A tag is worth keeping only if some ReplicaSet still references it, because
# those are exactly the revisions `kubectl rollout undo` can reach. Deployment
# revisionHistoryLimit bounds how many that is.
#
# Usage: ./scripts/cleanup-registry.sh
#
set -euo pipefail

REGISTRY="${REGISTRY:-localhost:5000}"
REPO="${REPO:-hello-world-app}"
NAMESPACE="${NAMESPACE:-hello-world}"
REGISTRY_CONTAINER="${REGISTRY_CONTAINER:-local-registry}"

# Tags still reachable via rollout undo.
keep="$(kubectl -n "$NAMESPACE" get rs \
  -o jsonpath='{range .items[*]}{.spec.template.spec.containers[0].image}{"\n"}{end}' \
  2>/dev/null | sed 's|.*:||' | grep -v '^$' | sort -u || true)"

if [ -z "$keep" ]; then
  echo "No ReplicaSets found in namespace/$NAMESPACE; refusing to prune blind." >&2
  exit 0
fi

# Parse {"name":...,"tags":["a","b"]} without depending on jq.
all="$(curl -fsS "http://$REGISTRY/v2/$REPO/tags/list" \
  | grep -o '"tags":\[[^]]*\]' \
  | grep -o '"[^"]*"' | tr -d '"' | grep -v '^tags$' | sort -u || true)"

digest_of() {
  curl -fsS -o /dev/null -D - \
    -H 'Accept: application/vnd.docker.distribution.manifest.v2+json' \
    -H 'Accept: application/vnd.oci.image.index.v1+json' \
    -H 'Accept: application/vnd.oci.image.manifest.v1+json' \
    "http://$REGISTRY/v2/$REPO/manifests/$1" 2>/dev/null \
    | tr -d '\r' | sed -n 's/^[Dd]ocker-[Cc]ontent-[Dd]igest: //p' | tail -1
}

echo "Keeping $(echo "$keep" | wc -l | tr -d ' ') tag(s) still referenced by ReplicaSets."

# Deletion is by digest, and a digest unlinks EVERY tag pointing at it.
# Two tags share a digest whenever the build is bit-identical, so collect the
# protected digests up front rather than deleting a kept image by accident.
keep_digests=""
for tag in $keep; do
  # Non-fatal: curl -f exits 22 on a 404, and one stale tag must not abort
  # the whole cleanup under set -e.
  d="$(digest_of "$tag" || true)"
  if [ -n "$d" ]; then
    keep_digests="$keep_digests $d"
  fi
done

deleted=0
for tag in $all; do
  if echo "$keep" | grep -qx "$tag"; then
    continue
  fi

  digest="$(digest_of "$tag" || true)"

  if [ -z "$digest" ]; then
    echo "  ! could not resolve digest for $tag, skipping" >&2
    continue
  fi

  case " $keep_digests " in
    *" $digest "*)
      echo "  = $tag shares a digest with a kept image, leaving it"
      continue
      ;;
  esac

  if curl -fsS -X DELETE "http://$REGISTRY/v2/$REPO/manifests/$digest" >/dev/null 2>&1; then
    echo "  - deleted $tag"
    deleted=$((deleted + 1))
  else
    echo "  ! delete failed for $tag (is REGISTRY_STORAGE_DELETE_ENABLED set?)" >&2
  fi

  # Drop the local daemon's copy too; it is a second full copy of the layers.
  docker rmi "$REGISTRY/$REPO:$tag" >/dev/null 2>&1 || true
done

if [ "$deleted" -gt 0 ]; then
  # Blobs survive manifest deletion until garbage collection reclaims them.
  #
  # GC MUST NOT run against a live registry: it assumes read-only storage, and
  # a concurrent push leaves tags pointing at manifests it has already removed
  # - the repo then lists tags that 404, and re-pushing does not repair them.
  # So stop the container, collect, start it again.
  echo "  stopping registry for garbage collection"
  docker stop "$REGISTRY_CONTAINER" >/dev/null 2>&1 || true
  docker run --rm \
    --volumes-from "$REGISTRY_CONTAINER" \
    registry:2 bin/registry garbage-collect --delete-untagged \
    /etc/docker/registry/config.yml >/dev/null 2>&1 \
    || echo "  ! garbage-collect failed; blobs remain on disk" >&2
  docker start "$REGISTRY_CONTAINER" >/dev/null 2>&1 || true

  # Wait for it to accept connections again so a later push does not race.
  for _ in $(seq 1 20); do
    curl -fsS "http://$REGISTRY/v2/" >/dev/null 2>&1 && break
    sleep 0.5
  done
fi

# Dangling layers from superseded builds, then build cache older than
# BUILD_CACHE_MAX_AGE. Cache is regenerable, and on this host it was the
# single biggest consumer - 47GB when disk-pressure first hit.
docker image prune -f >/dev/null 2>&1 || true
docker builder prune -f --filter "until=${BUILD_CACHE_MAX_AGE:-168h}" >/dev/null 2>&1 || true

echo "Removed $deleted image(s); $(echo "$all" | wc -l | tr -d ' ') tag(s) were present."
echo "Disk now: $(df -h /var/lib/docker 2>/dev/null | awk 'NR==2 {print $4" free ("$5" used)"}')"
