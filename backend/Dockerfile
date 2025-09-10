# Start with a lightweight Python base
FROM python:3.13-slim

# Install system dependencies (tesseract + image libs)
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libtesseract-dev \
    libleptonica-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Install Python dependencies (using requirements.txt if you have it)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Expose port
EXPOSE 5000

# Start with Gunicorn (better than flask dev server in production)
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app", "--workers=2", "--timeout=60"]
