FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Download spaCy model (with fallback)
RUN python -m spacy download en_core_web_sm || \
    echo "Warning: Could not download spaCy model, will use fallback processing"

# Copy source code
COPY . .

# Create a simple startup script
RUN echo '#!/bin/bash\ncd /app\npython -m app.main' > /app/start.sh && \
    chmod +x /app/start.sh

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8001/health || exit 1

# Start the application
CMD ["/app/start.sh"]
