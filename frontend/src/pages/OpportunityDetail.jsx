import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useApp } from "../context/AppContext";
import { Modal } from "../components/Modal";

export const OpportunityDetail = ({ onShowToast }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, updateState } = useApp();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    amount: 0,
    closeDate: "",
    stage: "",
    probability: 0,
    type: "",
    leadSource: "",
    nextStep: "",
    description: "",
  });

  const opportunity = state.opportunities.find((item) => item.opportunityId === id);
  const account = state.accounts.find((item) => item.accountId === opportunity?.accountId);
  const owner = state.users.find((user) => user.userId === opportunity?.ownerId);

  if (!opportunity) {
    return <div>Opportunity not found</div>;
  }

  const handleEdit = () => {
    setEditData({
      name: opportunity.name,
      amount: opportunity.amount,
      closeDate: opportunity.closeDate.split("T")[0],
      stage: opportunity.stage,
      probability: opportunity.probability,
      type: opportunity.type,
      leadSource: opportunity.leadSource,
      nextStep: opportunity.nextStep,
      description: opportunity.description,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    const updatedOpportunities = state.opportunities.map((item) =>
      item.opportunityId === id
        ? {
            ...item,
            ...editData,
            closeDate: editData.closeDate
              ? new Date(editData.closeDate).toISOString()
              : item.closeDate,
            modifiedDate: new Date().toISOString(),
          }
        : item
    );
    try {
      await updateState({ opportunities: updatedOpportunities });
      setShowEditModal(false);
      onShowToast("Opportunity updated successfully.", "success");
    } catch (err) {
      onShowToast(err.message || "Failed to update opportunity.", "error");
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    const updatedOpportunities = state.opportunities.filter((item) => item.opportunityId !== id);
    try {
      await updateState({ opportunities: updatedOpportunities });
      onShowToast("Opportunity deleted successfully.", "success");
      navigate("/opportunities");
    } catch (err) {
      onShowToast(err.message || "Failed to delete opportunity.", "error");
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
              {opportunity.name}
            </h1>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span className="badge badge-working">{opportunity.stage}</span>
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
              Opportunity Information
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
                  Opportunity Name
                </label>
                <div>{opportunity.name}</div>
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
                  Amount
                </label>
                <div>${(opportunity.amount / 1000).toFixed(0)}K</div>
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
                  Close Date
                </label>
                <div>{format(new Date(opportunity.closeDate), "MMM d, yyyy")}</div>
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
                  Stage
                </label>
                <div>{opportunity.stage}</div>
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
                  Probability
                </label>
                <div>{opportunity.probability}%</div>
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
                  Type
                </label>
                <div>{opportunity.type}</div>
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
                  Lead Source
                </label>
                <div>{opportunity.leadSource}</div>
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
                Next Step
              </label>
              <div>{opportunity.nextStep}</div>
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
              <div>{opportunity.description}</div>
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
                <div>{format(new Date(opportunity.createdDate), "MMM d, yyyy h:mm a")}</div>
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
                <div>{format(new Date(opportunity.modifiedDate), "MMM d, yyyy h:mm a")}</div>
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

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Opportunity">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-group">
            <label className="form-label">Opportunity Name *</label>
            <input
              type="text"
              className="form-input"
              value={editData.name}
              onChange={(event) => setEditData({ ...editData, name: event.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Amount</label>
            <input
              type="number"
              className="form-input"
              value={editData.amount}
              onChange={(event) => setEditData({ ...editData, amount: parseFloat(event.target.value) || 0 })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Close Date</label>
            <input
              type="date"
              className="form-input"
              value={editData.closeDate}
              onChange={(event) => setEditData({ ...editData, closeDate: event.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Stage</label>
            <select
              className="form-select"
              value={editData.stage}
              onChange={(event) => setEditData({ ...editData, stage: event.target.value })}
            >
              <option value="Prospecting">Prospecting</option>
              <option value="Qualification">Qualification</option>
              <option value="Needs Analysis">Needs Analysis</option>
              <option value="Value Proposition">Value Proposition</option>
              <option value="Proposal">Proposal</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Closed Won">Closed Won</option>
              <option value="Closed Lost">Closed Lost</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Probability</label>
            <input
              type="number"
              className="form-input"
              value={editData.probability}
              onChange={(event) =>
                setEditData({ ...editData, probability: parseInt(event.target.value, 10) || 0 })
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <input
              type="text"
              className="form-input"
              value={editData.type}
              onChange={(event) => setEditData({ ...editData, type: event.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Lead Source</label>
            <input
              type="text"
              className="form-input"
              value={editData.leadSource}
              onChange={(event) => setEditData({ ...editData, leadSource: event.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Next Step</label>
            <input
              type="text"
              className="form-input"
              value={editData.nextStep}
              onChange={(event) => setEditData({ ...editData, nextStep: event.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={editData.description}
              onChange={(event) => setEditData({ ...editData, description: event.target.value })}
              rows={3}
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

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Opportunity">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p>Are you sure you want to delete this opportunity? This action cannot be undone.</p>
          <div
            style={{
              padding: "12px",
              backgroundColor: "var(--danger-bg)",
              border: "1px solid var(--danger)",
              borderRadius: "4px",
            }}
          >
            <strong>{opportunity.name}</strong>
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
              Delete Opportunity
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
