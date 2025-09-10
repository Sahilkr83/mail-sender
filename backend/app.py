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

# Uncomment if Render needs a custom Tesseract path
# pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"

@app.route("/upload", methods=["POST"])
def upload():
    file = request.files.get("image") or request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    try:
        img = Image.open(io.BytesIO(file.read()))
        text = pytesseract.image_to_string(img)
        return jsonify({"text": text}), 200
    except Exception as e:
        app.logger.error(f"Upload error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/check", methods=["GET"])
def check_tesseract():
    try:
        version = subprocess.check_output(["tesseract", "--version"]).decode("utf-8")
        return jsonify({"tesseract_version": version})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
