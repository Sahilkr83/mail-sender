import os
import io
import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS
import pytesseract
from PIL import Image

app = Flask(__name__)

# Allow frontend running at localhost:3000
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# If Tesseract is not in PATH, set path manually (example for Windows)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


@app.route("/upload", methods=["POST"])
def upload():
    file = request.files.get("image") or request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    try:
        # Open image
        img = Image.open(io.BytesIO(file.read()))

        # Downscale very large images to avoid memory/time issues
        max_size = (2000, 2000)  # keep text readable
        img.thumbnail(max_size, Image.LANCZOS)

        # OCR with pytesseract
        text = pytesseract.image_to_string(img)
        return jsonify({"text": text}), 200

    except Exception as e:
        app.logger.error(f"Upload error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/check", methods=["GET"])
def check_tesseract():
    """Check if Tesseract is installed and working"""
    try:
        version = subprocess.check_output(
            ["tesseract", "--version"], stderr=subprocess.STDOUT
        ).decode("utf-8")
        return jsonify({"tesseract_version": version})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # Run locally on port 5000
    app.run(host="0.0.0.0", port=5000, debug=True)
