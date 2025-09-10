import os
import io
import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS
import pytesseract
from PIL import Image

app = Flask(__name__)

# Allow only your Netlify frontend
CORS(app, resources={r"/*": {"origins": "https://mail-sender-1.netlify.app"}})

# Uncomment if Render needs custom Tesseract path
# pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"

@app.route("/upload", methods=["POST"])
def upload():
    file = request.files.get("image") or request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    try:
        # Open image
        img = Image.open(io.BytesIO(file.read()))

        # Downscale very large images (helps prevent Render timeout/memory crash)
        max_size = (100, 100)  # adjust if needed
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
    port = int(os.environ.get("PORT", 5000))
    # Gunicorn in Render will override this, but works locally too
    app.run(host="0.0.0.0", port=port, debug=False)
