import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useApp } from "../context/AppContext";
import { Modal } from "../components/Modal";

export const CaseDetail = ({ onShowToast }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, updateState } = useApp();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editData, setEditData] = useState({
    subject: "",
    status: "",
    priority: "",
    origin: "",
    description: "",
  });

  const caseItem = state.cases.find((item) => item.caseId === id);
  const account = state.accounts.find((item) => item.accountId === caseItem?.accountId);
  const contact = state.contacts.find((item) => item.contactId === caseItem?.contactId);
  const owner = state.users.find((user) => user.userId === caseItem?.ownerId);

  if (!caseItem) {
    return <div>Case not found</div>;
  }

  const handleEdit = () => {
    setEditData({
      subject: caseItem.subject,
      status: caseItem.status,
      priority: caseItem.priority,
      origin: caseItem.origin,
      description: caseItem.description,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    const updatedCases = state.cases.map((item) =>
      item.caseId === id
        ? {
            ...item,
            ...editData,
            modifiedDate: new Date().toISOString(),
            closedDate: editData.status === "Closed" ? new Date().toISOString() : item.closedDate,
          }
        : item
    );
    try {
      await updateState({ cases: updatedCases });
      setShowEditModal(false);
      onShowToast("Case updated successfully.", "success");
    } catch (err) {
      onShowToast(err.message || "Failed to update case.", "error");
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    const updatedCases = state.cases.filter((item) => item.caseId !== id);
    try {
      await updateState({ cases: updatedCases });
      onShowToast("Case deleted successfully.", "success");
      navigate("/cases");
    } catch (err) {
      onShowToast(err.message || "Failed to delete case.", "error");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "16px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 600, marginBottom: "8px" }}>
              {caseItem.subject}
            </h1>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span className="badge badge-working">{caseItem.status}</span>
              <span className="badge badge-warm">{caseItem.priority}</span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                }}
              >
                <img
                  src={owner?.avatar}
                  alt={owner?.firstName}
                  style={{ width: "24px", height: "24px", borderRadius: "50%" }}
                />
                {owner?.firstName} {owner?.lastName}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-secondary" onClick={handleEdit}>
              <Edit size={18} />
              Edit
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              <Trash2 size={18} />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        <div>
          <div className="card" style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
              Case Information
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Case Number
                </label>
                <div>{caseItem.caseNumber}</div>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Subject
                </label>
                <div>{caseItem.subject}</div>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Status
                </label>
                <div>{caseItem.status}</div>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Priority
                </label>
                <div>{caseItem.priority}</div>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Case Origin
                </label>
                <div>{caseItem.origin}</div>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Account Name
                </label>
                <div>{account?.name}</div>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Contact Name
                </label>
                <div>
                  {contact?.firstName} {contact?.lastName}
                </div>
              </div>
            </div>
            <div style={{ marginTop: "16px" }}>
              <label
                style={{
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Description
              </label>
              <div>{caseItem.description}</div>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
              System Information
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Created Date
                </label>
                <div>{format(new Date(caseItem.createdDate), "MMM d, yyyy h:mm a")}</div>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Last Modified
                </label>
                <div>{format(new Date(caseItem.modifiedDate), "MMM d, yyyy h:mm a")}</div>
              </div>
              {caseItem.closedDate && (
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Closed Date
                  </label>
                  <div>{format(new Date(caseItem.closedDate), "MMM d, yyyy h:mm a")}</div>
                </div>
              )}
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Owner
                </label>
                <div>
                  {owner?.firstName} {owner?.lastName}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Case">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-group">
            <label className="form-label">Subject *</label>
            <input
              type="text"
              className="form-input"
              value={editData.subject}
              onChange={(event) => setEditData({ ...editData, subject: event.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={editData.status}
              onChange={(event) => setEditData({ ...editData, status: event.target.value })}
            >
              <option value="New">New</option>
              <option value="Working">Working</option>
              <option value="Escalated">Escalated</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select
              className="form-select"
              value={editData.priority}
              onChange={(event) => setEditData({ ...editData, priority: event.target.value })}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Case Origin</label>
            <input
              type="text"
              className="form-input"
              value={editData.origin}
              onChange={(event) => setEditData({ ...editData, origin: event.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={editData.description}
              onChange={(event) => setEditData({ ...editData, description: event.target.value })}
              rows={4}
            />
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
            <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveEdit}>
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Case">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p>Are you sure you want to delete this case? This action cannot be undone.</p>
          <div
            style={{
              padding: "12px",
              backgroundColor: "var(--danger-bg)",
              border: "1px solid var(--danger)",
              borderRadius: "4px",
            }}
          >
            <strong>{caseItem.subject}</strong>
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
              Delete Case
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
