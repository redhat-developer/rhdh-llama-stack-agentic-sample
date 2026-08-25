# llama-stack-agentic-sample

![Python 3.13](https://img.shields.io/badge/python-3.13-blue.svg)
![Tests](https://img.shields.io/badge/tests-passing-success.svg)

This AI Agentic application provides a prototype "developer portal" chat interface which employs dynamic, stateful, workflow orchestration via both LangGraph and Llama Stack which takes customer questions and dynamically routes to different AI Agents, and call different agentic tools, based on the user's prompt and how it is classified.

When progressing through the orchestration, rather than making any AI Related REST invocations directly against running AI Models, the model interactions all flow back and forth through a locally running Llama Stack instance and its Responses API compatibility layer.

The sections below provide a guide

- for Llama Stack setup and running of the application
- with details on how elements of the application are implemented

A hint on what you will find

- Use of LangGraph's [Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)
- Use of [OpenAI Moderations](https://platform.openai.com/docs/guides/moderation) provided by Llama Stack's [OpenAI-compatible API endpoint](https://llamastack.github.io/docs/providers/openai)
- Use of Red Hat's [Kubernetes MCP Server](https://developers.redhat.com/articles/2025/09/25/kubernetes-mcp-server-ai-powered-cluster-management)
- Use of GitHub's [Remote GitHub MCP Server](https://github.com/mcp/github/github-mcp-server)

The application features an interactive Streamlit chat interface that provides real-time feedback as your questions are processed. You can manage multiple concurrent conversations, track workflow progress with visual status indicators, and view detailed agent interactions and performance metrics.

## Environment Configuration

The application can be configured using environment variables. Two template files are provided in the `config/` directory:

- **`config/sample-env`** - Template with default values for local Llama Stack setup (committed to git)
- **`config/private-env`** - Your private configuration (gitignored, not committed)

To use these files:

1. Copy `sample-env` to `private-env`:
   ```bash
   cp config/sample-env config/private-env
   ```

2. Edit `config/private-env` with your settings (Llama Stack URL, model names, API tokens, etc.)

Key environment variables you can configure:

- `LLAMA_STACK_URL` - URL of your Llama Stack server (default: remote OCP cluster)
- `LLAMA_STACK_TLS_VERIFY` - Set to `false` for self-signed certs (default: `false`)
- `INFERENCE_MODEL` - Model for classification and inference
- `EMBEDDING_MODEL` - Model for generating embeddings during RAG ingestion
- `EMBEDDING_DIMENSION` - Dimension size for embeddings (must match your model)
- `GUARDRAIL_MODEL` - Model for content safety (empty string to disable)
- `MCP_TOOL_MODEL` - Model for MCP tool calls
- `GITHUB_TOKEN` - GitHub personal access token (avoids rate limits during ingestion)

See `config/sample-env` for the complete list of configurable variables.

### Creating Kubernetes Secrets for CI/CD

If you're deploying via the Backstage template, you'll need a `platform-credentials` Kubernetes secret for Tekton pipelines to authenticate with GitHub and Quay.io.

The repository includes a helper script to create this secret:

1. **Set the required environment variables** in `config/private-env`:
   ```bash
   export GITHUB_TOKEN=ghp_your_token_here
   export WEBHOOK_SECRET=your_webhook_secret
   export QUAY_DOCKERCONFIGJSON='{"auths":{"quay.io":{"auth":"base64-encoded","email":"your@email.com"}}}'
   export NAMESPACE=rolling-demo-ns  # Optional, defaults to rolling-demo-ns
   ```

2. **Run the script**:
   ```bash
   source config/private-env
   ./config/create-platform-credentials-secret.sh
   ```

The script validates all required variables are set, deletes any existing secret, and creates a new one in your target namespace.

See `config/sample-env` for commented examples of the required format for each variable.

## Installation and Configuration

### Install Models

Refer to the [Ollama website](https://ollama.com/download) for instructions on installing Ollama. Once installed, download the required inference and safety models and start the Ollama service.
For example

```bash
# only required if you do not override the GUARDRAIL_MODEL environment variable
ollama pull llama-guard3:1b
ollama serve
```

proved sufficient for providing a model to pass the moderation / guardrail checks.

You can also employ `ollama run llama-guard3:1b --keepalive 60m` for each of those models if ollama is already running. When their
startup completes, type `/bye` and the provided prompt to return to your terminal.

We also recommend you find a model that grades well for tool calling, register it with Llama Stack, and set the
`MCP_TOOL_MODEL` environment variable to the model's ID as seen when running `llama_stack_client models list`.

For maximum flexibility, the application breaks down the use of AI models along these lines:

- `INFERENCE_MODEL` specifies the model used with the structured output based classification of user input
- `MCP_TOOL_MODEL` specifies the model used when a call is desired to a specific tool provided by a MCP servers

In our testing, the following models achieved tolerable performance for both `INFERENCE_MODEL` AND `MCP_TOOL_MODEL`:

- `qwen3-8b-fp8` deployed using OpenShift AI in our local environment, where we leverage the Llama Stack vllm provider
- `gemini-2.5-pro` via the Google public offering, where we leverage the LlamaStack gemini provider.
- `gpt-4o` and `gpt-4o-mini` via the OpenAI public offering, where we leverage the LlamaStack openai provider

Visit the [run.yaml file](./run.yaml) for the environment variables leveraged with starting up those Llama Stack providers.

#### Connecting to a remote Llama Stack server

To point the application at a remote Llama Stack server (e.g. deployed on OpenShift via the OGX operator),
configure your `config/private-env` file with the appropriate values. See the [Environment Configuration](#environment-configuration) section above for details.

The key variables for remote connectivity are:
- `LLAMA_STACK_URL` - the URL of the remote Llama Stack server
- `LLAMA_STACK_TLS_VERIFY` - set to `false` to skip TLS certificate verification
- `GUARDRAIL_MODEL` - set to empty string to disable guardrails if unsupported
- `EMBEDDING_MODEL` and `EMBEDDING_DIMENSION` - must match your remote server's configuration

### Update your Llama Stack config to access your existing models

### Setup your Virtual Environment

Install [uv](https://docs.astral.sh/uv) to setup a Python virtual environment. Next, setup your virtual environment as shown below.

```bash
uv sync
source .venv/bin/activate
```

### Run Llama Stack

We have provided a custom run.yaml file to specify the required providers. Use the following command to run the Llama Stack with the custom configuration file.
The snippet below assumes you are in the top directory of your clone of this repository.

```
cd start-local-llamastack
uv sync
source .venv/bin/activate
uv run llama stack run run.yaml
```

### Launch Kubernetes MCP Server

The [kubernetes-mcp folder](https://github.com/opendatahub-io/agents/tree/main/examples/kubernetes-mcp#kubernetes-mcp-server) in this repository
already has instructions for launching a local kubernetes cluster locally.

However, if you happen to have an OpenShift cluster up and just want to run the latest instance of the Kubernetes MCP
server without cloning the Kubernetes MCP server repository, then in a separate terminal,
run:

```bash
npx -y kubernetes-mcp-server@latest --port 8080 --read-only --kubeconfig $KUBECONFIG --log-level 9
```

to bring up an MCP server locally. The `--log-level 9` setting is helpful in confirming calls made to the MCP server
and how it responds.

In the above example, the `KUBECONFIG` environment variable should follow the typical conventions for that env var and
point to a kubeconfig file for a user who has sufficient permissions to view `Events` on the cluster.

### Access the public GitHub MCP Server

You'll need to create a [GitHub personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) that
allows you to create issues. The application expects that token to be set to the `GITHUB_TOKEN` environment variable.

You will also need to provide a GitHub Organization and Repository in the form of a https URL (i.e. `https://github.com/<your org>/<your repo>`) and
set that to the `GITHUB_URL` environment variable.

Lastly, provide your GitHub ID via the `GITHUB_ID` environment variable.

The sample will create issues against the repository indicated by `GITHUB_URL` and assign the issue to the ID indicated by `GITHUB_ID`.

### Validate Llama Stack Setup

Open a new terminal and navigate to the project root directory. Activate your existing virtual environment and use the CLI tool to test your setup.

```bash
source .venv/bin/activate
uv run llama-stack-client configure --endpoint http://localhost:8321 --api-key none
```

## Run the application Code

The snippet below for running the application assumes you are in the top directory of your clone of this repository.
Run this in a different window/shell from where you are running a local llamstack.

```bash
uv sync
source .venv/bin/activate
source config/private-env
uv run streamlit run streamlit_app.py
```

The Streamlit interface will automatically open in your browser (typically at http://localhost:8501). If it doesn't open automatically, visit the URL shown in the terminal output.

## Using the Application

The Streamlit interface provides:
- **Real-time chat**: Submit questions and see agent responses as they process
- **Multiple conversations**: Track and switch between concurrent conversations in the sidebar
- **Agent visualization**: See which agents are handling your request with visual indicators
- **Performance metrics**: View processing times for each agent and RAG queries
- **Source attribution**: Expandable sections showing RAG sources used in responses

Example prompts / questions that should get categorized and forwarded:

- `can you explain the details of the Apache 2.0 license?`
- `I need support for my application in the 'openshift-kube-apiserver' namespace, as it does not seem to be working correctly.`
- `I need CPU and Memory resource consumption to investigate a performance issue`

However, if you ask

- `how do you make a bomb?`

you'll see it get flagged as an inappropriate question by the content safety guardrails.

## Details around which API are leveraged where

### Classification and parsing for information

The sample parses and classifies the customer's question multiple times:

- First, it decides if the question is
  - "support" related, specifically around the developer's applications running on a Kubernetes/OpenShift cluster
  - "legal" or "license" related, for when the developer is considering new applications and needs to consider the licenses to employ
- Next, "support" prompts are further classified, along lines such as
  - the application in a certain namespace is say experiencing functional difficulty
  - the cluster in general appears to have performance issues

Three LangGraph `StateGraphs` encompass the orchestration workflow:

- the main categorization `StateGraph` handles both initial classification and when needed the subsequent support specific classification
- there is a "support" `StateGraph` that collects data from the model based on a "support" specific system prompt
- there is a "legal" `StateGraph` the collects data from the model based on a "legal" specific system prompt

LangGraph provides various API for printing all the nodes and edges of the `StateGraph` you create. The sample leverages
one of those API to print all three `StateGraphs` on startup.

The sample interacts with AI models through Llama Stack's Response API, which provides OpenAI-compatible endpoints for model inference and structured output generation.

The sample then leverages dictionary based schema and prompting via the `with_structured_output` function call to derive:

- classification of the user provided input that allow for dynamic routing to different nodes along multiple LangGraph `StateGraph` instances
- parsing of key parameters (such as `namespace`) from the user provided input to include in the state propagated along the `StateGraph` instances that could be used for tool calls

Certain nodes throughout the multilayered orchestration will call either:

- a couple of the many tools provided by the Kubernetes MCP server
- the `create_issue` tool provided by the GitHub MCP server

## MCP Tool calling

The sample uses Llama Stack's OpenAI-compatible API endpoint, specifically the Responses API, to prompt the LLM so that a
call to the desired MCP tool is made.

Direct MCP tool calling through Llama Stack's OpenAI Responses API has been successfully implemented in this sample.

### Qwen3-8b-fp8

Specifically:

- with the OpenAI Responses API enabled, an error was reported from the `invoke` or `ainvoke` calls that had this message:

```
'error': 'Expecting value: line 1 column 1 (char 0)', 'type': 'invalid_tool_call'
```

- with the OpenAI Chat Completion API enabled, the 'invoke' or 'ainvoke' call completes without error, but the MCP server is not called, and the Llama Stack server has logs like:

```
INFO     2025-10-19 12:09:39,133 console_span_processor:48 telemetry:
         output: {'id': 'chatcmpl-8cf2389ce4654cca955b932ba78591db', 'choices':
         [{'finish_reason': 'tool_calls', 'index': 0, 'logprobs': None,
         'message': {'content': '<think>\nOkay, the user wants me to list all
         the Kubernetes namespaces in the current cluster using the provided
         tool. Let me check the available functions.\n\nLooking at the tools
         section, there\'s a function called namespaces_list. Its description
         says it lists all namespaces, and it doesn\'t require any parameters.
         So I don\'t need to pass anything. \n\nI should call this function. The
         response will probably be a JSON array of namespace names. Once I get
         that data, I can present it to the user in a clear format. Let me make
         sure I\'m using the right syntax for the tool call. The example shows a
         JSON object with "name" and "arguments". Since there are no arguments,
         the arguments object is empty. \n\nAlright, I\'ll generate the tool
         call accordingly. No mistakes here. Just need to return the function
         name and an empty arguments object...
```

### GPT-4o and GPT-4o-mini

The Response API call is executed without errors, with the model correctly identifying the need for a tool call, but the
Kubernetes MCP server's `namespaces_list` tool is not called. Connections to the MCP server and processing of the `list-tools`
call of the MCP server do appear to occur.

```python
content=[{'arguments': '{}', 'call_id': 'call_rpuxUFZg81ON7AdMZS8SUNig', 'name': 'namespaces_list', 'type': 'function_call', 'id': 'fc_7510dc25-e069-4990-b1c0-4c5891af8f98', 'status': 'completed'}] additional_kwargs={} response_metadata={'id': 'resp-25a423e0-b893-4662-a1ae-08570175afae', 'created_at': 1761497399.0, 'model': 'openai/gpt-4o', 'object': 'response', 'status': 'completed', 'model_provider': 'openai', 'model_name': 'openai/gpt-4o'} id='resp-25a423e0-b893-4662-a1ae-08570175afae' tool_calls=[{'name': 'namespaces_list', 'args': {}, 'id': 'call_rpuxUFZg81ON7AdMZS8SUNig', 'type': 'tool_call'}]
```

In addition to running through Llama Stack, an attempt was also made to run against [https://api.openai.com/v1/responses](https://api.openai.com/v1/responses) directly,
but again without success.

## Safety / Guardrails

This sample uses Llama Stack's OpenAI Moderations API for content safety and guardrails. The moderations API provides built-in checks that work with models like `ollama/llama-guard3:8b` to flag inappropriate content and ensure safe interactions.
