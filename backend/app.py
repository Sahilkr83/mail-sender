from flask import Flask, request, jsonify
from flask_cors import CORS
import pytesseract
from PIL import Image
import io

app = Flask(__name__)
CORS(app)  # allow requests from frontend

# If Windows, set the tesseract path:
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

@app.route("/upload", methods=["POST"])
def upload():
    if "image" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["image"]
    img = Image.open(io.BytesIO(file.read()))
    text = pytesseract.image_to_string(img)  # Extract text
    return jsonify({"text": text})

if __name__ == "__main__":
    app.run(debug=True)
