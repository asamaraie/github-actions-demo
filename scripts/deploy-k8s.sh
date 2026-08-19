#!/usr/bin/env bash
#
# Render k8s/*.yaml and apply them to the local k3d cluster.
#
# Usage:
#   IMAGE=localhost:5000/hello-world-app:<tag> \
#   REPLICAS=2 \
#   INGRESS_HOST=hello.localhost \
#     ./scripts/deploy-k8s.sh
#
set -euo pipefail

IMAGE="${IMAGE:?IMAGE is required (e.g. localhost:5000/hello-world-app:abc123)}"
REPLICAS="${REPLICAS:-2}"
INGRESS_HOST="${INGRESS_HOST:-hello.localhost}"
NAMESPACE=hello-world

export IMAGE REPLICAS INGRESS_HOST

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
manifests_dir="$repo_root/k8s"

# envsubst (gettext) isn't guaranteed to be installed; fall back to sed.
render() {
  if command -v envsubst >/dev/null 2>&1; then
    envsubst '${IMAGE} ${REPLICAS} ${INGRESS_HOST}' <"$1"
  else
    sed -e "s|\${IMAGE}|${IMAGE}|g" \
        -e "s|\${REPLICAS}|${REPLICAS}|g" \
        -e "s|\${INGRESS_HOST}|${INGRESS_HOST}|g" "$1"
  fi
}

dump_diagnostics() {
  echo "--- deploy failed; cluster state follows ---" >&2
  kubectl -n "$NAMESPACE" get pods -o wide >&2 || true
  kubectl -n "$NAMESPACE" get events --sort-by=.lastTimestamp >&2 | tail -n 25 || true
}

echo "Deploying $IMAGE to namespace/$NAMESPACE ($REPLICAS replicas, host $INGRESS_HOST)"

# Namespace first; the rest reference it.
for manifest in namespace deployment service ingress; do
  render "$manifests_dir/$manifest.yaml" | kubectl apply -f -
done

if ! kubectl -n "$NAMESPACE" rollout status deploy/hello-world --timeout=120s; then
  dump_diagnostics
  exit 1
fi

kubectl -n "$NAMESPACE" get deploy,pods,svc,ingress
