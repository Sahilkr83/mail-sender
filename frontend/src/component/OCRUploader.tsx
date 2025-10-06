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

  // Email preview modal states
  const [previewEmail, setPreviewEmail] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState<string>("");
  const [previewText, setPreviewText] = useState<string>("");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [sending, setSending] = useState(false);

  // Handle file selection
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

  // Extract emails from OCR text
  const extractEmails = (text: string) => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g;
    return text.match(emailRegex) || [];
  };

  // Upload & OCR
  const handleUpload = async (index: number) => {
    const fileObj = files[index];
    if (!fileObj) return;

    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, loading: true, text: "", emails: [] } : f))
    );

    const formData = new FormData();
    formData.append("image", fileObj.file);

    try {
      const res = await fetch("http://127.0.0.1:5000/upload", { method: "POST", body: formData });
      const data = await res.json();
      console.log(data)
      const ocrText = data.text || data.error;

      const detectedEmails = extractEmails(ocrText);
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, text: ocrText, emails: detectedEmails, loading: false } : f
        )
      );
    } catch (error) {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, text: "Error: Could not connect to backend", loading: false } : f
        )
      );
    }
  };

  // Open modal + request AI draft
  const previewEmailContent = async (email: string, text: string, index: number) => {
    setPreviewEmail(email);
    setPreviewIndex(index);
    setLoadingDraft(true);

    try {
      const res = await fetch("/api/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, text }),
      });

      const data = await res.json();

      if (data.success) {
        setPreviewSubject(data.subject);
        setPreviewText(data.body);
      } else {
        alert("❌ Failed to generate email draft: " + data.error);
        setPreviewEmail(null);
      }
    } catch (err) {
      alert("❌ Error generating draft: " + err);
      setPreviewEmail(null);
    } finally {
      setLoadingDraft(false);
    }
  };

  // Send final (edited) email
  const confirmSendEmail = async () => {
    if (!previewEmail || previewIndex === null) return;

    setSending(true);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: previewEmail,
          subject: previewSubject,
          body: previewText,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setFiles((prev) => prev.filter((_, i) => i !== previewIndex));
      } else {
        alert("❌ Failed to send email: " + data.error);
      }
    } catch (err) {
      alert("❌ Error sending email: " + err);
    } finally {
      setSending(false);
      setPreviewEmail(null);
      setPreviewSubject("");
      setPreviewText("");
      setPreviewIndex(null);
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

            {/* Emails only (removed extracted text) */}
            {fileObj.emails.length > 0 && (
              <div>
                <p className="font-semibold mb-1">Detected Emails:</p>
                {fileObj.emails.map((email) => (
                  <div
                    key={email}
                    className="flex justify-between items-center mb-1 bg-gray-700 p-2 rounded border border-gray-600"
                  >
                    <span>{email}</span>
                    <button
                      onClick={() => previewEmailContent(email, fileObj.text, index)}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Preview & Send
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Email Preview Modal */}
      {previewEmail && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 p-4 ">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-3xl border border-gray-600">
            <h3 className="text-2xl font-bold mb-6">✉️ Edit & Send Email</h3>

            {loadingDraft ? (
              <p className="text-gray-300">Generating draft...</p>
            ) : (
              <>
                <label className="block mb-2 text-sm">Subject:</label>
                <input
                  type="text"
                  value={previewSubject}
                  onChange={(e) => setPreviewSubject(e.target.value)}
                  className="w-full p-3 mb-6 rounded bg-gray-700 border border-gray-600 text-lg"
                />

                <label className="block mb-2 text-sm">Body:</label>
                <textarea
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  className="w-full h-[450px] p-3 mb-6 rounded bg-gray-700 border border-gray-600 text-lg"
                />
              </>
            )}

            <div className="flex justify-end mt-4 gap-3">
              <button
                onClick={() => {
                  setPreviewEmail(null);
                  setPreviewSubject("");
                  setPreviewText("");
                  setPreviewIndex(null);
                }}
                className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
                disabled={sending || loadingDraft}
              >
                Cancel
              </button>
              <button
                onClick={confirmSendEmail}
                className="px-5 py-2 bg-green-600 rounded hover:bg-green-700 disabled:bg-gray-500 text-lg"
                disabled={sending || loadingDraft}
              >
                {sending ? "Sending..." : "Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
