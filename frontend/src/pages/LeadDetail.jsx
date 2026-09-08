import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Copy, Edit, Mail, Phone, RefreshCw, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useApp } from "../context/AppContext";
import { Modal } from "../components/Modal";

export const LeadDetail = ({ onShowToast }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, applyCrmChange, convertLead } = useApp();
  const [activeTab, setActiveTab] = useState("details");
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [convertData, setConvertData] = useState({
    createAccount: true,
    accountName: "",
    createContact: true,
    createOpportunity: true,
    opportunityName: "",
    amount: "",
    closeDate: "",
    stage: "Prospecting",
  });
  const [editData, setEditData] = useState({
    firstName: "",
    lastName: "",
    company: "",
    title: "",
    email: "",
    phone: "",
    status: "",
    rating: "",
  });

  const lead = state.leads.find((item) => item.leadId === id);
  const owner = state.users.find((user) => user.userId === lead?.ownerId);

  if (!lead) {
    return <div>Lead not found</div>;
  }

  const isConverted = lead.isConverted === true || lead.status === "Converted" || Boolean(
    lead.convertedAccountId || lead.convertedContactId || lead.convertedOpportunityId || lead.convertedDate
  );
  const hasConversionSelection = convertData.createAccount || convertData.createContact || convertData.createOpportunity;

  const handleConvert = async () => {
    if (isConverted || isConverting || !hasConversionSelection) return;
    setIsConverting(true);
    try {
      const nextState = await convertLead(lead.leadId, {
        ...convertData,
        amount: parseFloat(convertData.amount) || 0,
        closeDate: convertData.closeDate
          ? new Date(convertData.closeDate).toISOString()
          : null,
      });
      setShowConvertModal(false);
      onShowToast("Lead converted successfully.", "success");
      if (convertData.createAccount) {
        const previousAccountIds = new Set(state.accounts.map((account) => account.accountId));
        const createdAccount = nextState.accounts.find(
          (account) => !previousAccountIds.has(account.accountId)
        );
        if (createdAccount) navigate(`/accounts/${createdAccount.accountId}`);
      }
    } catch (err) {
      onShowToast(err.message || "Failed to convert lead.", "error");
    } finally {
      setIsConverting(false);
    }
  };

  const handleClone = async () => {
    const newLeadId = `lead-${Date.now()}`;
    const clonedLead = {
      ...lead,
      leadId: newLeadId,
      firstName: `${lead.firstName} (Clone)`,
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
    };
    try {
      const nextState = await applyCrmChange({ leads: [...state.leads, clonedLead] });
      onShowToast("Lead cloned successfully.", "success");
      const previousLeadIds = new Set(state.leads.map((item) => item.leadId));
      const createdLead = nextState.leads.find((item) => !previousLeadIds.has(item.leadId));
      if (createdLead) navigate(`/leads/${createdLead.leadId}`);
    } catch (err) {
      onShowToast(err.message || "Failed to clone lead.", "error");
    }
  };

  const handleEdit = () => {
    setEditData({
      firstName: lead.firstName,
      lastName: lead.lastName,
      company: lead.company,
      title: lead.title,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      rating: lead.rating,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    const errors = [];

    if (!editData.firstName || !editData.firstName.trim()) {
      errors.push("First name is required");
    }

    if (!editData.lastName || !editData.lastName.trim()) {
      errors.push("Last name is required");
    }

    if (!editData.company || !editData.company.trim()) {
      errors.push("Company is required");
    }

    if (editData.email && editData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editData.email)) {
        errors.push("Invalid email format");
      }
    }

    if (errors.length > 0) {
      onShowToast(errors.join(", "), "error");
      return;
    }

    const updatedLeads = state.leads.map((item) =>
      item.leadId === id ? { ...item, ...editData, modifiedDate: new Date().toISOString() } : item
    );
    try {
      await applyCrmChange({ leads: updatedLeads });
      setShowEditModal(false);
      onShowToast("Lead updated successfully.", "success");
    } catch (err) {
      onShowToast(err.message || "Failed to update lead.", "error");
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    const updatedLeads = state.leads.filter((item) => item.leadId !== id);
    try {
      await applyCrmChange({ leads: updatedLeads });
      onShowToast("Lead deleted successfully.", "success");
      navigate("/leads");
    } catch (err) {
      onShowToast(err.message || "Failed to delete lead.", "error");
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
              {lead.firstName} {lead.lastName}
            </h1>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span className={`badge badge-${lead.status.toLowerCase()}`}>{lead.status}</span>
              <span className={`badge badge-${lead.rating.toLowerCase()}`}>{lead.rating}</span>
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
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button className="btn btn-secondary" onClick={handleEdit}>
              <Edit size={18} />
              Edit
            </button>
            <button className="btn btn-secondary" onClick={() => window.location.assign(`mailto:${lead.email}`)}>
              <Mail size={18} />
              Email
            </button>
            <button className="btn btn-secondary" onClick={() => window.location.assign(`tel:${lead.phone}`)}>
              <Phone size={18} />
              Call
            </button>
            <button
              className="btn btn-success"
              disabled={isConverted || isConverting}
              onClick={() => setShowConvertModal(true)}
            >
              <RefreshCw size={18} />
              {isConverted ? "Converted" : "Convert"}
            </button>
            <button className="btn btn-secondary" onClick={handleClone}>
              <Copy size={18} />
              Clone
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              <Trash2 size={18} />
              Delete
            </button>
          </div>
        </div>

        <div style={{ borderBottom: "1px solid var(--border)", marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "24px" }}>
            {["details", "activity", "chatter", "related"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "12px 0",
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === tab ? "3px solid var(--primary)" : "3px solid transparent",
                  color: activeTab === tab ? "var(--primary)" : "var(--text-secondary)",
                  fontWeight: activeTab === tab ? 600 : 400,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === "details" && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
          <div>
            <div className="card" style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
                Lead Information
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
                    Name
                  </label>
                  <div>
                    {lead.firstName} {lead.lastName}
                  </div>
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
                    Company
                  </label>
                  <div>{lead.company}</div>
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
                    Title
                  </label>
                  <div>{lead.title}</div>
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
                    Email
                  </label>
                  <div>{lead.email}</div>
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
                    Phone
                  </label>
                  <div>{lead.phone}</div>
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
                    Mobile
                  </label>
                  <div>{lead.mobile}</div>
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
                    Lead Status
                  </label>
                  <div>{lead.status}</div>
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
                  <div>{lead.source}</div>
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
                    Rating
                  </label>
                  <div>{lead.rating}</div>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
                Address Information
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
                    Street
                  </label>
                  <div>{lead.street}</div>
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
                    City
                  </label>
                  <div>{lead.city}</div>
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
                    State
                  </label>
                  <div>{lead.state}</div>
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
                    Zip Code
                  </label>
                  <div>{lead.zip}</div>
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
                    Country
                  </label>
                  <div>{lead.country}</div>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
                Additional Information
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
                    Industry
                  </label>
                  <div>{lead.industry}</div>
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
                    Employees
                  </label>
                  <div>{lead.employees}</div>
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
                    Annual Revenue
                  </label>
                  <div>${(lead.revenue / 1000000).toFixed(1)}M</div>
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
                    Website
                  </label>
                  <div>{lead.website}</div>
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
                <div>{lead.description}</div>
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
                  <div>{format(new Date(lead.createdDate), "MMM d, yyyy h:mm a")}</div>
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
                  <div>{format(new Date(lead.modifiedDate), "MMM d, yyyy h:mm a")}</div>
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
      )}

      {activeTab === "activity" && (
        <div className="card">
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
            Activity Timeline
          </h2>
          <p style={{ color: "var(--text-secondary)" }}>No activities yet</p>
        </div>
      )}

      {activeTab === "chatter" && (
        <div className="card">
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>Chatter</h2>
          <p style={{ color: "var(--text-secondary)" }}>No posts yet</p>
        </div>
      )}

      {activeTab === "related" && (
        <div className="card">
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
            Related Lists
          </h2>
          <p style={{ color: "var(--text-secondary)" }}>No related records</p>
        </div>
      )}

      <Modal
        isOpen={showConvertModal}
        onClose={() => { if (!isConverting) setShowConvertModal(false); }}
        title="Convert Lead"
        size="large"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <input
                type="checkbox"
                checked={convertData.createAccount}
                onChange={(event) =>
                  setConvertData({ ...convertData, createAccount: event.target.checked })
                }
              />
              <span style={{ fontWeight: 600 }}>Create Account</span>
            </label>
            {convertData.createAccount && (
              <div className="form-group">
                <label className="form-label">Account Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={convertData.accountName}
                  onChange={(event) =>
                    setConvertData({ ...convertData, accountName: event.target.value })
                  }
                  placeholder={lead.company}
                />
              </div>
            )}
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <input
                type="checkbox"
                checked={convertData.createContact}
                onChange={(event) =>
                  setConvertData({ ...convertData, createContact: event.target.checked })
                }
              />
              <span style={{ fontWeight: 600 }}>Create Contact</span>
            </label>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginLeft: "28px" }}>
              Contact will be created with lead information
            </p>
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <input
                type="checkbox"
                checked={convertData.createOpportunity}
                onChange={(event) =>
                  setConvertData({ ...convertData, createOpportunity: event.target.checked })
                }
              />
              <span style={{ fontWeight: 600 }}>Create Opportunity</span>
            </label>
            {convertData.createOpportunity && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Opportunity Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={convertData.opportunityName}
                    onChange={(event) =>
                      setConvertData({ ...convertData, opportunityName: event.target.value })
                    }
                    placeholder={`${lead.company} - Opportunity`}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    className="form-input"
                    value={convertData.amount}
                    onChange={(event) => setConvertData({ ...convertData, amount: event.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Close Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={convertData.closeDate}
                    onChange={(event) =>
                      setConvertData({ ...convertData, closeDate: event.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stage</label>
                  <select
                    className="form-select"
                    value={convertData.stage}
                    onChange={(event) => setConvertData({ ...convertData, stage: event.target.value })}
                  >
                    <option value="Prospecting">Prospecting</option>
                    <option value="Qualification">Qualification</option>
                    <option value="Needs Analysis">Needs Analysis</option>
                    <option value="Value Proposition">Value Proposition</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Negotiation">Negotiation</option>
                  </select>
                </div>
              </div>
            )}
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
            <button className="btn btn-secondary" disabled={isConverting} onClick={() => setShowConvertModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={isConverting || !hasConversionSelection} onClick={handleConvert}>
              {isConverting ? "Converting..." : "Convert Lead"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Lead">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-group">
            <label className="form-label">First Name *</label>
            <input
              type="text"
              className="form-input"
              value={editData.firstName}
              onChange={(event) => setEditData({ ...editData, firstName: event.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name *</label>
            <input
              type="text"
              className="form-input"
              value={editData.lastName}
              onChange={(event) => setEditData({ ...editData, lastName: event.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Company *</label>
            <input
              type="text"
              className="form-input"
              value={editData.company}
              onChange={(event) => setEditData({ ...editData, company: event.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              className="form-input"
              value={editData.title}
              onChange={(event) => setEditData({ ...editData, title: event.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={editData.email}
              onChange={(event) => setEditData({ ...editData, email: event.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              type="tel"
              className="form-input"
              value={editData.phone}
              onChange={(event) => setEditData({ ...editData, phone: event.target.value })}
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
              <option value="Qualified">Qualified</option>
              <option value="Unqualified">Unqualified</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Rating</label>
            <select
              className="form-select"
              value={editData.rating}
              onChange={(event) => setEditData({ ...editData, rating: event.target.value })}
            >
              <option value="Hot">Hot</option>
              <option value="Warm">Warm</option>
              <option value="Cold">Cold</option>
            </select>
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

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Lead">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p>Are you sure you want to delete this lead? This action cannot be undone.</p>
          <div
            style={{
              padding: "12px",
              backgroundColor: "var(--danger-bg)",
              border: "1px solid var(--danger)",
              borderRadius: "4px",
            }}
          >
            <strong>
              {lead.firstName} {lead.lastName}
            </strong>{" "}
            from <strong>{lead.company}</strong>
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
              Delete Lead
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
