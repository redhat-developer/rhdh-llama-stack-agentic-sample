# **OGX Agentic Template Prerequisites**

Before using this Software Template, ensure your environment meets the following requirements.

## **Cluster Requirements**

### **OpenShift/Kubernetes Version**

- Tested on OpenShift 4.18 (Kubernetes v1.31)
- ArgoCD must have cluster admin permissions to create ClusterRole/ClusterRoleBinding resources for the MCP Server's cluster introspection capabilities

### **Required Operators**

| Operator | Purpose | Required |
|----------|---------|----------|
| **OpenShift GitOps (ArgoCD)** | GitOps deployment | Yes |
| **Red Hat OpenShift Pipelines** | CI/CD pipelines | Yes |
| **Node Feature Discovery (NFD)** | Detects hardware features on nodes | For self-hosted vLLM with GPU |
| **NVIDIA GPU Operator** | Enables GPU access for containers | For self-hosted vLLM with GPU |

### **Resource Requirements**

The template deploys four services with the following requirements:

| Component | CPU Request | Memory Request | CPU Limit | Memory Limit |
|-----------|-------------|----------------|-----------|--------------|
| Streamlit UI | 500m | 2Gi | 2000m | 6Gi |
| OGX | 500m | 2Gi | 2000m | 8Gi |
| Ollama | 1000m | 4Gi | 4000m | 16Gi |
| MCP Server | 100m | 128Mi | 500m | 512Mi |

**Total Minimum**: 2100m CPU (~2.1 cores), ~8.1Gi Memory

### **Storage Requirements**

- **20Gi PersistentVolumeClaim** for Ollama models (e.g., llama-guard3:8b ~5GB)
- Storage class with `ReadWriteOnce` access mode
- OGX uses ephemeral storage (emptyDir) - data is lost on pod restart

## **External Dependencies**

### **OpenAI API Key** (Required)

An OpenAI API key is required for text embeddings (`text-embedding-3-small` model). Additionally, OpenAI models can be configured as the inference model or MCP tool model if you prefer cloud-based inference over self-hosted options like Ollama or vLLM.

An API key can be obtained from [platform.openai.com](https://platform.openai.com).

!!! warning "API Costs"
    
    OpenAI models incur costs per token for embeddings and inference. Monitor your usage through 
    the OpenAI dashboard.

### **Inference Model Provider** (Choose One)

#### Option 1: vLLM (Recommended for Production)

- Requires NVIDIA GPU nodes (compute capability 7.0+)
- Deploy vLLM serving a model like `Qwen/Qwen3-8B`
- Requires model endpoint URL and API key

#### Option 2: Ollama (Development)

- Deploy Ollama in-cluster or on a connected machine
- Pull required models: `ollama pull llama-guard3:1b`
- No GPU required for smaller models

#### Option 3: OpenAI API

- Use your existing OpenAI API key
- Models like `gpt-4o` or `gpt-4o-mini` work well
- Higher latency due to network calls

### **GitHub/GitLab Access**

For the Git Agent functionality:

- **GitHub Personal Access Token** with `repo` scope (includes issue creation and comments)
- A target repository where the Git Agent will create issues

## **Red Hat Developer Hub Configuration**

!!! info "Platform Administrator Configuration"

    The following configurations are typically pre-configured by the RHDH platform administrator. If you're using an existing RHDH instance, these should already be in place.

### **ArgoCD Configuration**

Ensure your RHDH instance has ArgoCD integration configured:

```yaml
argocd:
  instances:
    - name: default
      url: https://argocd.example.com
      appLocatorMethods:
        - type: config
```

### **GitHub/GitLab Integration**

Configure your SCM integration in RHDH:

```yaml
integrations:
  github:
    - host: github.com
      token: ${GITHUB_TOKEN}
  gitlab:
    - host: gitlab.com
      token: ${GITLAB_TOKEN}
```

## **Network Requirements**

### **Outbound Access**

The following external endpoints must be accessible:

| Endpoint | Purpose |
|----------|---------|
| `api.openai.com` | Text embeddings and inference (if using OpenAI models) |
| `github.com` or `gitlab.com` | Document ingestion, issue creation |
| Your vLLM endpoint | Inference (if using self-hosted vLLM) |

### **Internal Communication**

Services communicate internally:

```
Streamlit UI (8501) → OGX (8321)
OGX (8321) → Ollama (11434)
OGX (8321) → MCP Server (8080)
MCP Server (8080) → Kubernetes API (443)
```

## **GPU Considerations**

If using self-hosted vLLM for inference:

- Node pools with NVIDIA GPUs (tested on AWS `g5.4xlarge` with A10G - 24GB GPU memory)
- Node Feature Discovery (NFD) and NVIDIA GPU Operator installed (see [Required Operators](#required-operators))
- At least 16GB GPU memory recommended for 8B parameter models

