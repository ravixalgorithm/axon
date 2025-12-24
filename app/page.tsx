"use client";

import { useState, useRef, useCallback } from "react";

// Type definitions
interface ColorToken {
  name: string;
  hex: string;
}

interface TypographyToken {
  headings: string;
  body: string;
  weights: string[];
}

interface DesignTokens {
  colors: ColorToken[];
  typography: TypographyToken;
  spacing: string[];
  animations: string[];
  elevation: string[];
  radius: string[];
}

interface AnalysisResult {
  tokens: DesignTokens;
  prompt: string;
}

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const supportedFormats = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!supportedFormats.includes(file.type)) {
      setError("Please upload a supported image file (PNG, JPG, WEBP, GIF)");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("Image must be less than 50MB");
      return;
    }

    setFileName(file.name);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImage(base64);
    };
    reader.onerror = () => {
      setError("Failed to read the image file");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const analyzeDesign = async () => {
    if (!image) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: image }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze design");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const copyPrompt = async () => {
    if (!result?.prompt) return;
    try {
      await navigator.clipboard.writeText(result.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  };

  const downloadJSON = () => {
    if (!result) return;
    const dataStr = JSON.stringify(result, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `design-tokens-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetUpload = () => {
    setImage(null);
    setFileName("");
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        .container {
          min-height: 100vh;
          background-color: #FFFBF0;
          color: #1F2121;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 24px;
        }

        .header {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo {
          font-size: 32px;
          font-weight: 700;
          color: #2BA8B8;
          margin-bottom: 8px;
        }

        .tagline {
          font-size: 16px;
          color: #666;
        }

        .main-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        @media (min-width: 1024px) {
          .main-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .card-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #1F2121;
        }

        .upload-zone {
          border: 2px dashed #ccc;
          border-radius: 12px;
          padding: 48px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #fafafa;
        }

        .upload-zone:hover {
          border-color: #2BA8B8;
          background: rgba(43, 168, 184, 0.05);
        }

        .upload-zone.dragging {
          border-color: #2BA8B8;
          background: rgba(43, 168, 184, 0.1);
          transform: scale(1.02);
        }

        .upload-zone.has-image {
          padding: 16px;
        }

        .upload-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .upload-text {
          font-size: 16px;
          color: #666;
          margin-bottom: 8px;
        }

        .upload-subtext {
          font-size: 14px;
          color: #999;
        }

        .preview-image {
          max-width: 100%;
          max-height: 300px;
          border-radius: 8px;
          object-fit: contain;
        }

        .file-name {
          margin-top: 12px;
          font-size: 14px;
          color: #666;
          word-break: break-all;
        }

        .button-row {
          display: flex;
          gap: 12px;
          margin-top: 16px;
          flex-wrap: wrap;
        }

        .btn {
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-primary {
          background: #2BA8B8;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #239AA9;
          transform: translateY(-1px);
        }

        .btn-primary:disabled {
          background: #b0d5da;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f0f0f0;
          color: #1F2121;
        }

        .btn-secondary:hover {
          background: #e0e0e0;
        }

        .btn-success {
          background: #10b981;
          color: white;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          margin-top: 16px;
          font-size: 14px;
        }

        .loading-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 48px 24px;
          color: #999;
        }

        .empty-state-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .colors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .color-swatch {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.15s ease;
        }

        .color-swatch:hover {
          transform: scale(1.05);
        }

        .color-preview {
          height: 60px;
          width: 100%;
        }

        .color-info {
          padding: 8px;
          background: white;
          font-size: 12px;
        }

        .color-name {
          font-weight: 600;
          margin-bottom: 2px;
        }

        .color-hex {
          color: #666;
          font-family: monospace;
        }

        .section {
          margin-bottom: 24px;
        }

        .section:last-child {
          margin-bottom: 0;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #2BA8B8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }

        .info-box {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 12px;
          font-size: 14px;
          line-height: 1.6;
        }

        .tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tag {
          background: #e8f4f5;
          color: #1F2121;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-family: monospace;
        }

        .prompt-textarea {
          width: 100%;
          min-height: 200px;
          padding: 16px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.6;
          resize: vertical;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          background: #fafafa;
          color: #1F2121;
        }

        .prompt-textarea:focus {
          outline: none;
          border-color: #2BA8B8;
          box-shadow: 0 0 0 3px rgba(43, 168, 184, 0.1);
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        .results-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .list-item {
          padding: 8px 12px;
          background: #f8f9fa;
          border-radius: 6px;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .list-item:last-child {
          margin-bottom: 0;
        }

        .hidden-input {
          display: none;
        }
      `}</style>

      <div className="container">
        <header className="header">
          <h1 className="logo">Axon</h1>
          <p className="tagline">Upload UI screenshots → Extract design tokens → Generate AI prompts</p>
        </header>

        <div className="main-grid">
          {/* Left Column - Upload Section */}
          <div className="card">
            <h2 className="card-title">📤 Upload Design</h2>

            <div
              className={`upload-zone ${isDragging ? "dragging" : ""} ${image ? "has-image" : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden-input"
              />

              {image ? (
                <>
                  <img src={image} alt="Uploaded design" className="preview-image" />
                  <p className="file-name">{fileName}</p>
                </>
              ) : (
                <>
                  <div className="upload-icon">🎨</div>
                  <p className="upload-text">Drag and drop your design here</p>
                  <p className="upload-subtext">or click to browse (PNG, JPG, WEBP, GIF up to 50MB)</p>
                </>
              )}
            </div>

            {image && (
              <div className="button-row">
                <button className="btn btn-primary" onClick={analyzeDesign} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Analyzing...
                    </>
                  ) : (
                    <>✨ Analyze Design</>
                  )}
                </button>
                <button className="btn btn-secondary" onClick={resetUpload}>
                  🗑️ Clear
                </button>
              </div>
            )}

            {error && <div className="error-message">⚠️ {error}</div>}
          </div>

          {/* Right Column - Results Section */}
          <div className="results-container">
            {!result ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">🔍</div>
                  <p>Upload a design screenshot to extract tokens and generate prompts</p>
                </div>
              </div>
            ) : (
              <>
                {/* Design Tokens Card */}
                <div className="card">
                  <h2 className="card-title">🎨 Design Tokens</h2>

                  {/* Colors */}
                  <div className="section">
                    <h3 className="section-title">Colors</h3>
                    <div className="colors-grid">
                      {result.tokens.colors.map((color, index) => (
                        <div key={index} className="color-swatch">
                          <div className="color-preview" style={{ backgroundColor: color.hex }}></div>
                          <div className="color-info">
                            <div className="color-name">{color.name}</div>
                            <div className="color-hex">{color.hex}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Typography */}
                  <div className="section">
                    <h3 className="section-title">Typography</h3>
                    <div className="info-box">
                      <p>
                        <strong>Headings:</strong> {result.tokens.typography.headings}
                      </p>
                      <p>
                        <strong>Body:</strong> {result.tokens.typography.body}
                      </p>
                      <p>
                        <strong>Weights:</strong> {result.tokens.typography.weights.join(", ")}
                      </p>
                    </div>
                  </div>

                  {/* Spacing */}
                  <div className="section">
                    <h3 className="section-title">Spacing Scale</h3>
                    <div className="tag-list">
                      {result.tokens.spacing.map((space, index) => (
                        <span key={index} className="tag">
                          {space}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Border Radius */}
                  <div className="section">
                    <h3 className="section-title">Border Radius</h3>
                    <div className="tag-list">
                      {result.tokens.radius.map((rad, index) => (
                        <span key={index} className="tag">
                          {rad}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Animations */}
                  <div className="section">
                    <h3 className="section-title">Animations</h3>
                    {result.tokens.animations.map((anim, index) => (
                      <div key={index} className="list-item">
                        {anim}
                      </div>
                    ))}
                  </div>

                  {/* Elevation */}
                  <div className="section">
                    <h3 className="section-title">Elevation / Shadows</h3>
                    {result.tokens.elevation.map((elev, index) => (
                      <div key={index} className="list-item">
                        {elev}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Generated Prompt Card */}
                <div className="card">
                  <h2 className="card-title">📝 Generated Prompt</h2>
                  <textarea className="prompt-textarea" value={result.prompt} readOnly />
                  <div className="action-buttons">
                    <button className={`btn ${copied ? "btn-success" : "btn-primary"}`} onClick={copyPrompt}>
                      {copied ? "✓ Copied!" : "📋 Copy Prompt"}
                    </button>
                    <button className="btn btn-secondary" onClick={downloadJSON}>
                      ⬇️ Download JSON
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
