FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Create a non-root user
RUN useradd -m nexus
RUN chown -R nexus:nexus /app
USER nexus

# Expose ports
EXPOSE 8000 8080

# Set the entrypoint
ENTRYPOINT ["python", "-m", "src.nexus.main"]

# Default command
CMD ["--config", "config/nexus.json"]
