# **OGX Agentic AI Workflow - Deployable Application**

This AI Software Template creates a comprehensive agentic workflow system that uses multiple AI agents to intelligently route and respond to user queries. The application leverages OGX for AI model interactions and LangGraph for workflow orchestration.

## **Application Overview**

The deployed application consists of four interconnected services:

### **1. Streamlit UI Application**

The main user interface provides:

- **Interactive Chat** - Submit questions and receive real-time responses
- **Conversation Management** - Sidebar showing all active conversations with status indicators
- **Agent Visualization** - Visual feedback showing which agent is handling your request
- **Workflow Graph Display** - View the LangGraph workflow structure
- **Performance Metrics** - Processing time breakdown by agent
- **Model Configuration Display** - View which models are configured for inference, guardrails, and MCP tools

### **2. OGX Server**

The OGX server provides:

- **Unified AI API** - OpenAI-compatible endpoints for inference
- **Vector Store Management** - FAISS-based vector databases for RAG
- **Safety/Guardrails** - Content moderation using Llama Guard
- **Tool Runtime** - MCP tool integration for external capabilities
- **Agent Framework** - State management for multi-turn conversations

### **3. Ollama**

The local LLM inference engine provides:

- **Safety Model Hosting** - Runs Llama Guard for content moderation
- **Persistent Model Storage** - Models stored on PVC to avoid re-downloading
- **Auto Model Pull** - Safety model automatically pulled on startup via init container

### **4. Kubernetes MCP Server**

The Model Context Protocol server enables AI agents to:

- **List Namespaces** - Query all namespaces in the cluster
- **Get Events** - Retrieve Kubernetes events for troubleshooting
- **View Pod Status** - Check pod health and status
- **Inspect Deployments** - Examine deployment configurations
- **Read Logs** - Access pod logs for debugging
- **Pod Performance Metrics** - Access pod CPU and Memory statistics

## **Example Use Cases**

### Technical Support Query

```
User: "I need support for my application in the 'openshift-kube-apiserver' 
      namespace, as it does not seem to be working correctly."

Response: The Tech Support agent will:
1. Query the MCP server for pod status in that namespace
2. Retrieve relevant troubleshooting documentation via RAG
3. Provide a diagnosis with suggested remediation steps
4. Optionally create a GitHub issue for tracking if correct credentials and repository information are provided
```

### Legal/License Question

```
User: "Can you explain the details of the Apache 2.0 license?"

Response: The Legal agent will:
1. Query the legal document vector database
2. Retrieve Apache 2.0 license documentation
3. Provide a comprehensive explanation with source citations
```

### Performance Investigation

```
User: "I need CPU and Memory resource consumption to investigate 
      a performance issue"

Response: The Performance agent will:
1. Query the MCP server for pod metrics
2. Analyze resource consumption patterns
3. Provide recommendations based on the data
```

## **Content Safety**

The application includes guardrails that flag inappropriate content:

```
User: "how do you make a bomb?"

Response: ❌ Content Safety Issue - This request has been blocked 
         by the content moderation guardrails.
```


