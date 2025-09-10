"use client";
import { useState, useRef } from "react";

interface UploadedFile {
  file: File;
  preview: string;
  text: string;
  emails: string[];
  loading: boolean;
}

export default function OCRUploader() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Handle single or multiple file selection
  const handleFilesChange = (selectedFiles: FileList) => {
    const newFiles: UploadedFile[] = Array.from(selectedFiles).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      text: "",
      emails: [],
      loading: false,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  // Drag & drop handlers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesChange(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const extractEmails = (text: string) => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g;
    return text.match(emailRegex) || [];
  };

  // Upload & OCR for a single file
  const handleUpload = async (index: number) => {
    const fileObj = files[index];
    if (!fileObj) return;

    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, loading: true, text: "", emails: [] } : f))
    );

    const formData = new FormData();
    formData.append("image", fileObj.file);

    try {
      const res = await fetch("https://mail-sender-1-n7b8.onrender.com/upload", { method: "POST", body: formData });
      const data = await res.json();
      const ocrText = data.text || data.error;

      const detectedEmails = extractEmails(ocrText);
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, text: ocrText, emails: detectedEmails, loading: false } : f
        )
      );
    } catch (error) {
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, text: "Error: Could not connect to backend", loading: false } : f))
      );
    }
  };

  // Send personalized email
  const sendPersonalizedEmail = async (email: string, text: string, index: number) => {
  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, text }),
    });
    const data = await res.json();

    if (data.success) {
      alert(`Email sent to ${email}:\n${data.message}`);
      // Remove the file section after successful email
      setFiles((prev) => prev.filter((_, i) => i !== index));
    } else {
      alert("Failed to send email: " + data.error);
    }
  } catch (err) {
    alert("Error sending email: " + err);
  }
};


  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-900 p-4 text-gray-200">
      <h2 className="text-3xl font-bold mb-6">OCR Email Scanner (Multiple Files)</h2>

      {/* Drag & Drop Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`mb-6 w-full max-w-3xl h-40 flex items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          dragOver ? "border-blue-400 bg-blue-900" : "border-gray-600 bg-gray-800"
        }`}
      >
        <p className="text-gray-300 text-center">
          Drag & drop images here or click to select (multiple allowed)
        </p>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFilesChange(e.target.files)}
      />

      {/* Uploaded Files */}
      <div className="w-full max-w-3xl space-y-6">
        {files.map((fileObj, index) => (
          <div key={fileObj.file.name} className="bg-gray-800 rounded-2xl p-4 border border-gray-600">
            <div className="flex justify-between items-center mb-2">
              <p className="font-semibold">{fileObj.file.name}</p>
              <button
                onClick={() => handleUpload(index)}
                className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-500"
                disabled={fileObj.loading}
              >
                {fileObj.loading ? "Extracting..." : "Extract Text"}
              </button>
            </div>

            {/* Image Preview */}
            <img
              src={fileObj.preview}
              alt="Preview"
              className="w-full h-48 object-contain mb-2 rounded-lg border border-gray-600"
            />

            {/* OCR Text */}
            {fileObj.text && (
              <div className="mb-2 p-2 bg-gray-700 rounded border border-gray-600 whitespace-pre-wrap text-gray-200 text-sm">
                <p className="font-semibold mb-1">Extracted Text:</p>
                {fileObj.text}
              </div>
            )}

            {/* Emails */}
            {fileObj.emails.length > 0 && (
              <div>
                <p className="font-semibold mb-1">Detected Emails:</p>
                {fileObj.emails.map((email) => (
                  <div key={email} className="flex justify-between items-center mb-1 bg-gray-700 p-2 rounded border border-gray-600">
                    <span>{email}</span>
                    <button
                      onClick={() => sendPersonalizedEmail(email, fileObj.text, index)}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Send Email
                    </button>

                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
