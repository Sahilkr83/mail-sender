import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import pytesseract
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

# On Linux, tesseract is usually in PATH, no need for Windows path
# Uncomment if custom path needed
# pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"

@app.route("/upload", methods=["POST"])
def upload():
    if "image" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["image"]
    try:
        img = Image.open(io.BytesIO(file.read()))
        text = pytesseract.image_to_string(img)
        return jsonify({"text": text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
