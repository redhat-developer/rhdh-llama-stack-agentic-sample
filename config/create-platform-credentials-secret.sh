#!/bin/bash
# Create platform-credentials Kubernetes secret for Tekton pipelines
# Source config/private-env before running this script

set -e

# Check required environment variables
REQUIRED_VARS=(
  "GITHUB_TOKEN"
  "WEBHOOK_SECRET"
  "QUAY_DOCKERCONFIGJSON"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo "❌ Error: Missing required environment variables:"
  for var in "${MISSING_VARS[@]}"; do
    echo "   - $var"
  done
  echo ""
  echo "Please source config/private-env first:"
  echo "  source config/private-env"
  echo "  $0"
  exit 1
fi

# Default namespace if not specified
NAMESPACE="${NAMESPACE:-rolling-demo-ns}"
SECRET_NAME="${SECRET_NAME:-platform-credentials}"

echo "Creating secret '$SECRET_NAME' in namespace '$NAMESPACE'..."

# Delete existing secret if it exists (optional - comment out to fail if exists)
kubectl delete secret "$SECRET_NAME" -n "$NAMESPACE" --ignore-not-found=true

# Create the secret
kubectl create secret generic "$SECRET_NAME" \
  --from-literal=GITHUB_TOKEN="$GITHUB_TOKEN" \
  --from-literal=GITLAB_TOKEN="${GITLAB_TOKEN:-}" \
  --from-literal=WEBHOOK_SECRET="$WEBHOOK_SECRET" \
  --from-literal=QUAY_DOCKERCONFIGJSON="$QUAY_DOCKERCONFIGJSON" \
  -n "$NAMESPACE"

echo "✅ Secret '$SECRET_NAME' created successfully in namespace '$NAMESPACE'"
echo ""
echo "Verify with:"
echo "  kubectl get secret $SECRET_NAME -n $NAMESPACE"