# **OGX Agentic AI Workflow - Software Template Overview**

This Software Template deploys a sophisticated **AI Agentic Workflow** application that provides an intelligent chat interface for dynamic, stateful workflow orchestration using both **LangGraph** and **OGX**.

## **What This Application Does**

The OGX Agentic application serves as a prototype chat interface that:

1. **Classifies User Questions** - Takes incoming questions and dynamically routes them to specialized AI Agents based on the content and intent of the prompt
2. **Multi-Agent Orchestration** - Employs multiple specialized agents for different domains:
   - **Legal Agent** - Handles license and legal compliance questions
   - **HR Agent** - Processes human resources related queries
   - **Sales Agent** - Addresses sales and business development questions
   - **Procurement Agent** - Manages procurement and vendor queries
   - **Tech Support Agent** - Handles technical support issues with OpenShift/Kubernetes integration
3. **RAG-Powered Responses** - Uses Retrieval-Augmented Generation (RAG) with vector stores to provide accurate, context-aware responses
4. **Content Safety** - Implements guardrails using Llama Guard for content moderation
5. **OpenShift/Kubernetes Integration** - Tech Support agent uses MCP tools to list pods and monitor resource consumption
6. **GitHub Issue Tracking** - Tech Support agent creates GitHub issues with LLM responses, RAG sources, MCP tool invocations and classification details for follow-up

## **Architecture Components**

This template deploys four interconnected services:

| Component | Port | Description |
|-----------|------|-------------|
| **Streamlit UI** | 8501 | Interactive chat interface |
| **OGX Server** | 8321 | AI inference orchestration |
| **Ollama** | 11434 | Local LLM inference engine |
| **Kubernetes MCP Server** | 8080 | Cluster introspection tools |


## **Key Features**

- **Real-time Chat Interface** - Built with Streamlit for immediate feedback during processing
- **Concurrent Conversations** - Track and manage multiple concurrent conversations
- **Visual Workflow Tracking** - See which agents handle your requests with visual indicators
- **Performance Metrics** - View processing times for each agent and RAG queries
- **Source Attribution** - Expandable sections showing RAG document sources
- **GitHub Issue Links** - Direct links to created GitHub issues when Tech Support agent uses the GitHub MCP tool

## **Model Server Options**

The template supports multiple inference providers through OGX:

- **vLLM** - High-throughput GPU-accelerated inference (requires NVIDIA GPUs)
- **Ollama** - Local model inference for development
- **OpenAI** - Cloud-based inference using OpenAI's API

## **Additional Resources**

- [The Deployable Application](./application.md)
- [Using the OGX Agentic Template](./usage.md)
- [Template Prerequisites](./template-prerequisites.md)

