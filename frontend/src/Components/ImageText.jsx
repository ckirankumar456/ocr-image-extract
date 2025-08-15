import React, { useEffect, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";

function ImageText() {
  const [files, setFiles] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditable, setIsEditable] = useState(false);

  useEffect(() => {
    const savedText = localStorage.getItem("ocrText");
    if (savedText) {
      setText(savedText);
    }
  }, []);
  useEffect(() => {
    if (text) {
      localStorage.setItem("ocrText", text);
    }
  }, [text]);
  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
    setText("");
    setIsEditable(false);
  };
  const handleUpload = async () => {
    if (files.length === 0) return alert("Please select one or more images!");
    const formData = new FormData();
    files.forEach((file) => formData.append("fileUpload[]", file));
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/uploads",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setText(response.data.text || "");
    } catch (err) {
      console.error("Upload failed", err);
      alert("OCR failed");
    } finally {
      setLoading(false);
    }
  };
  const handleDownload = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
    let y = 20;
    lines.forEach((line) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 8;
    });
    doc.save("handwriting.pdf");
  };
  return (
    <div className="container">
      <h2>Text Extract From Image*</h2>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        id="ChooseFile"
      />
      <br />
      <br />
      {files.map((file, idx) => (
        <img
          key={idx}
          src={URL.createObjectURL(file)}
          alt={`preview-${idx}`}
          style={{ width: 200, marginRight: 10, marginBottom: 10 }}
          id="images"
        />
      ))}
      <br />
      <button onClick={handleUpload} disabled={loading} className="Extract">
        {loading ? "Processing..." : "Extract Handwriting"}
      </button>
      <button
        onClick={() => setIsEditable(true)}
        style={{ marginLeft: 10 }}
        className="Edit"
      >
        Edit
      </button>
      {text && (
        <>
          <h3>Extracted Text</h3>
          <textarea
            value={text}
            onChange={(e) => isEditable && setText(e.target.value)}
            readOnly={!isEditable}
            rows={10}
            className={`Textbox ${isEditable ? "edit-mode" : ""}`}
            spellCheck={true}
            autoCorrect="on"
            autoCapitalize="sentences"
          />
          <br />
          <button onClick={handleDownload} className="Download">
            Download PDF
          </button>
        </>
      )}
    </div>
  );
}

export default ImageText;
