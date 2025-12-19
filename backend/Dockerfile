FROM python:3.12-slim

# Install system dependencies for OCR and OpenCV
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install poetry
RUN pip install poetry

WORKDIR /app

# Copy configuration files
COPY pyproject.toml poetry.lock README.md ./

# Configure poetry to not create a virtual environment
RUN poetry config virtualenvs.create false

# Install dependencies
RUN poetry install --no-interaction --no-ansi --no-root

# Copy source code
COPY . .

# Install the project itself
RUN poetry install --no-interaction --no-ansi

# Create a non-root user for security
RUN addgroup --system --gid 1001 python && \
    adduser --system --uid 1001 --gid 1001 python

# Change ownership of the app directory
RUN chown -R python:python /app

# Switch to non-root user
USER python

# Expose port
EXPOSE 8000

# Run the application
CMD ["python", "-m", "src.api.entrypoint"]
