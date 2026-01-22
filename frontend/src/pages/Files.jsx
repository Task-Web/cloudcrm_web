import { useRef, useState } from "react";
import { Download, Share2, Trash2, Upload } from "lucide-react";
import { format } from "date-fns";
import { useApp } from "../context/AppContext";
import { Modal } from "../components/Modal";
import { api } from "../apiClient";

export const Files = ({ onShowToast }) => {
  const { state, updateState } = useApp();
  const fileInputRef = useRef(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [uploading, setUploading] = useState(false);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploaded = await api.uploadFiles(Array.from(files));
      const newFiles = uploaded.map((file) => ({
        fileId: file.id,
        name: file.name,
        type: file.type,
        size: file.size,
        url: file.url,
        ownerId: state.user.userId,
        uploadDate: new Date().toISOString(),
      }));

      await updateState({ files: [...state.files, ...newFiles] });
      onShowToast(`${newFiles.length} file(s) uploaded successfully.`, "success");
    } catch (err) {
      onShowToast(err.message || "Failed to upload files.", "error");
    } finally {
      setUploading(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownload = (file) => {
    const resolved = api.resolveUrl(file.url);
    if (!resolved) return;
    window.open(resolved, "_blank", "noopener");
    onShowToast(`Downloading ${file.name}`, "info");
  };

  const handleShare = (file) => {
    const resolved = api.resolveUrl(file.url);
    setShareLink(resolved);
    setSelectedFileName(file.name);
    setShowShareModal(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    onShowToast("Link copied to clipboard.", "success");
  };

  const handleDeleteClick = (fileId, fileName) => {
    setSelectedFileId(fileId);
    setSelectedFileName(fileName);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    const updatedFiles = state.files.filter((file) => file.fileId !== selectedFileId);
    try {
      await updateState({ files: updatedFiles });
      onShowToast("File deleted successfully.", "success");
      setShowDeleteModal(false);
      setSelectedFileId("");
      setSelectedFileName("");
    } catch (err) {
      onShowToast(err.message || "Failed to delete file.", "error");
    }
  };

  const renderPreview = (file) => {
    const isImage = file.type?.startsWith("image/");
    const previewUrl = api.resolveUrl(file.url);
    if (isImage && previewUrl) {
      return (
        <img
          src={previewUrl}
          alt={file.name}
          style={{
            width: "100%",
            height: "120px",
            objectFit: "cover",
            borderRadius: "4px",
            marginBottom: "12px",
          }}
        />
      );
    }

    const extension = file.name?.split(".").pop()?.toUpperCase() || "FILE";
    return (
      <div
        style={{
          width: "100%",
          height: "120px",
          borderRadius: "4px",
          marginBottom: "12px",
          background: "var(--bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 600,
          color: "var(--text-secondary)",
        }}
      >
        {extension}
      </div>
    );
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h1 style={{ fontSize: "28px", fontWeight: 600 }}>Files</h1>
        <button className="btn btn-primary" onClick={handleUploadClick} disabled={uploading}>
          <Upload size={18} />
          {uploading ? "Uploading..." : "Upload Files"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />
      </div>

      <div className="card">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          {state.files.map((file) => {
            const owner = state.users.find((user) => user.userId === file.ownerId);
            return (
              <div
                key={file.fileId}
                className="card"
                style={{
                  padding: "16px",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {renderPreview(file)}
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "14px",
                    marginBottom: "4px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {file.name}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                  {formatFileSize(file.size)}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                  {owner?.firstName} {owner?.lastName}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                  {format(new Date(file.uploadDate), "MMM d, yyyy")}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: "6px", fontSize: "12px" }}
                    onClick={() => handleDownload(file)}
                    title="Download"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: "6px", fontSize: "12px" }}
                    onClick={() => handleShare(file)}
                    title="Share"
                  >
                    <Share2 size={14} />
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ flex: 1, padding: "6px", fontSize: "12px" }}
                    onClick={() => handleDeleteClick(file.fileId, file.name)}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="Share File">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p>
            Share this link with others to give them access to <strong>{selectedFileName}</strong>
          </p>
          <div
            style={{
              display: "flex",
              gap: "8px",
              padding: "12px",
              background: "var(--bg)",
              borderRadius: "4px",
              border: "1px solid var(--border)",
            }}
          >
            <input
              type="text"
              value={shareLink}
              readOnly
              className="form-input"
              style={{ flex: 1, background: "transparent", border: "none" }}
            />
            <button className="btn btn-primary" onClick={handleCopyLink}>
              Copy Link
            </button>
          </div>
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
              paddingTop: "20px",
              borderTop: "1px solid var(--border)",
            }}
          >
            <button className="btn btn-secondary" onClick={() => setShowShareModal(false)}>
              Close
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete File">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p>Are you sure you want to delete this file? This action cannot be undone.</p>
          <div
            style={{
              padding: "12px",
              backgroundColor: "var(--danger-bg)",
              border: "1px solid var(--danger)",
              borderRadius: "4px",
            }}
          >
            <strong>{selectedFileName}</strong>
          </div>
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
              paddingTop: "20px",
              borderTop: "1px solid var(--border)",
            }}
          >
            <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={confirmDelete}>
              Delete File
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
