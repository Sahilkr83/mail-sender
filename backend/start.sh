#!/bin/bash
# Install Linux system dependencies
apt-get update && apt-get install -y tesseract-ocr

# Start Flask with Gunicorn
exec gunicorn app:app --bind 0.0.0.0:$PORT
