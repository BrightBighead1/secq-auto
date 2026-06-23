# ============================================
# SecQ-Auto Northflank Container
# Includes: OmniRoute + 9Router + Qdrant
# ============================================

FROM ubuntu:24.04

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    ca-certificates \
    build-essential \
    git \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20.x
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Qdrant binary
RUN curl -L -o /tmp/qdrant.tar.gz \
    https://github.com/qdrant/qdrant/releases/download/v1.11.4/qdrant-x86_64-unknown-linux-gnu.tar.gz \
    && tar -xzf /tmp/qdrant.tar.gz -C /usr/local/bin/ \
    && rm /tmp/qdrant.tar.gz

# Create app user
RUN useradd -m -s /bin/bash appuser && \
    mkdir -p /app /data/qdrant && \
    chown -R appuser:appuser /app /data

USER appuser
WORKDIR /app

# Copy source code
COPY --chown=appuser:appuser omniroute /app/omniroute
COPY --chown=appuser:appuser router9 /app/router9
COPY --chown=appuser:appuser entrypoint.sh /app/entrypoint.sh
COPY --chown=appuser:appuser omniroute-config.yaml /app/omniroute-config.yaml
COPY --chown=appuser:appuser router9-config.yaml /app/router9-config.yaml
COPY --chown=appuser:appuser qdrant-config.yaml /app/qdrant-config.yaml

# Build OmniRoute
WORKDIR /app/omniroute
RUN npm ci --production && npm run build

# Build 9Router
WORKDIR /app/router9
RUN npm ci --production && npm run build

# Make entrypoint executable
RUN chmod +x /app/entrypoint.sh

# Expose ports
EXPOSE 3000 4000 6333

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start services
CMD ["/app/entrypoint.sh"]