# Use a lightweight Python image
FROM python:3.10-slim

# Install Tesseract OCR and required libraries
RUN apt-get update && apt-get install -y tesseract-ocr libtesseract-dev

# Set work directory
WORKDIR /app

# Copy project files
COPY . /app

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose port
EXPOSE 5000

# Run the Flask app
CMD ["python", "app.py"]
