FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Set work directory
WORKDIR /app

# Install system dependencies needed for psycopg2 and other packages
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        gcc \
        libpq-dev \
        postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy poetry files
COPY pyproject.toml poetry.lock* /app/

# Install poetry and dependencies
RUN pip install "poetry==1.7.1" && poetry export -o requirements.txt -f requirements.txt --without-hashes
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy project
COPY . /app/

# Make migration script executable
COPY run_migrations.sh /app/run_migrations.sh
RUN chmod +x /app/run_migrations.sh

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser &&\
    chown -R appuser /app
USER appuser

# Expose port (Hugging Face Spaces uses dynamic ports)
EXPOSE 7860

# Command to run migrations and then start the application
CMD ["sh", "-c", "./run_migrations.sh uvicorn main:app --host 0.0.0.0 --port 7860"]