#!/usr/bin/env bash
#
# Restore the two things a devcontainer rebuild destroys.
#
# ~/.kube/config and the Actions runner process both live in the home
# directory, which is not a volume. There is no systemd in this container
# either, so `svc.sh install` does not work and the runner has to be a
# plain background process.
#
# Wired up as postStartCommand in .devcontainer/devcontainer.json. Every
# step is best-effort: a missing cluster or unregistered runner must never
# stop the container from starting.
#
set -u

CLUSTER="${CLUSTER:-my-cluster}"
RUNNER_DIR="${RUNNER_DIR:-$HOME/actions-runner}"

# 1. kubeconfig
if command -v k3d >/dev/null 2>&1 && k3d cluster list 2>/dev/null | grep -q "^$CLUSTER "; then
  k3d kubeconfig merge "$CLUSTER" \
    --kubeconfig-merge-default --kubeconfig-switch-context >/dev/null 2>&1 \
    && echo "kubeconfig restored for $CLUSTER" \
    || echo "could not restore kubeconfig for $CLUSTER" >&2
fi

# 2. self-hosted Actions runner
if [ -f "$RUNNER_DIR/.runner" ]; then
  if pgrep -f Runner.Listener >/dev/null 2>&1; then
    echo "actions runner already running"
  else
    (cd "$RUNNER_DIR" && nohup ./run.sh >runner.log 2>&1 &)
    echo "actions runner started (log: $RUNNER_DIR/runner.log)"
  fi
else
  echo "actions runner not registered; skipping" >&2
fi

exit 0
