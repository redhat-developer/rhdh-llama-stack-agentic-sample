# OGX Agentic Application Container
# Multi-stage build for smaller, more secure image

# =============================================================================
# BUILDER STAGE
# =============================================================================
FROM registry.access.redhat.com/ubi9/python-312:9.8-1785140801@sha256:ebd0347a0422ad0d24db801972b4c1efa6f3352e5c2553b034e6b70e91235854 AS builder

USER root

# Allow uv to download Python 3.13 (required by pyproject.toml)
ENV UV_COMPILE_BYTECODE=0 \
    UV_LINK_MODE=copy

WORKDIR /app-root

# Install build dependencies (including mesa-libGL for RapidOCR/OpenCV model pre-download)
RUN dnf install -y gcc python3-devel make mesa-libGL && \
    dnf clean all && \
    pip3.12 install uv

# Copy dependency specification
COPY ./pyproject.toml ./uv.lock ./

# Install Python dependencies (uv will download Python 3.13 automatically)
RUN uv sync --frozen --no-dev

# Pre-download RapidOCR models during build (required for OpenShift where site-packages is read-only)
# Use torch engine for all components (Det, Cls, Rec) since onnxruntime is not in dependencies
RUN .venv/bin/python -c "from rapidocr import RapidOCR, EngineType; RapidOCR(params={'Det.engine_type': EngineType.TORCH, 'Cls.engine_type': EngineType.TORCH, 'Rec.engine_type': EngineType.TORCH})"

# =============================================================================
# RUNTIME STAGE
# =============================================================================
FROM registry.access.redhat.com/ubi9/python-312-minimal:9.8-1784732125@sha256:fb32c8ad908b78f1595282639a7870028d436579eb73890635b6b867e65faf63

ARG APP_ROOT=/app-root
WORKDIR /app-root

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONCOERCECLOCALE=0 \
    PYTHONUTF8=1 \
    PYTHONIOENCODING=UTF-8 \
    LANG=en_US.UTF-8 \
    PATH="/app-root/.venv/bin:$PATH"

# Copy virtual environment from builder
COPY --from=builder --chown=1001:1001 /app-root/.venv ./.venv

# Copy application source code
COPY --chown=1001:1001 ./src/ ./src/
COPY --chown=1001:1001 ./streamlit_app.py ./

# Copy configuration (baked in - single source of truth)
COPY --chown=1001:1001 ./config/ ./config/

# Install runtime dependencies for docling/opencv (libGL for PDF processing)
USER root
RUN microdnf install -y mesa-libGL && \
    microdnf clean all

# Create directories for runtime data (don't chmod -R the whole app-root, it doubles image size!)
RUN mkdir -p /app-root/.llama && \
    chgrp -R 0 /app-root/.llama && \
    chmod -R g=u /app-root/.llama

# License
RUN mkdir -p /licenses
COPY LICENSE /licenses/

# Expose Streamlit port
EXPOSE 8501

USER 1001

# Default entrypoint runs the Streamlit app
CMD ["streamlit", "run", "streamlit_app.py", "--server.address=0.0.0.0"]

# Labels
LABEL com.redhat.component=ogx-agentic-app \
      description="OGX Agentic AI Workflow Application" \
      io.k8s.description="OGX Agentic AI Workflow Application" \
      io.k8s.display-name="OGX Agentic App" \
      io.openshift.tags="ai,ogx,streamlit,agents,rag" \
      name=ogx-agentic-app \
      summary="Streamlit application for agentic AI workflows"