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

# Expose port
EXPOSE 8000

# Run the application
CMD ["python", "-m", "src.api.entrypoint"]
