import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useApp } from "../context/AppContext";
import { Modal } from "../components/Modal";

export const AccountDetail = ({ onShowToast }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, updateState } = useApp();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    phone: "",
    website: "",
    type: "",
    industry: "",
    revenue: 0,
    employees: 0,
  });

  const account = state.accounts.find((item) => item.accountId === id);
  const owner = state.users.find((user) => user.userId === account?.ownerId);
  const contacts = state.contacts.filter((contact) => contact.accountId === id);
  const opportunities = state.opportunities.filter((opp) => opp.accountId === id);

  if (!account) {
    return <div>Account not found</div>;
  }

  const handleEdit = () => {
    setEditData({
      name: account.name,
      phone: account.phone,
      website: account.website,
      type: account.type,
      industry: account.industry,
      revenue: account.revenue,
      employees: account.employees,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    const updatedAccounts = state.accounts.map((item) =>
      item.accountId === id ? { ...item, ...editData, modifiedDate: new Date().toISOString() } : item
    );
    try {
      await updateState({ accounts: updatedAccounts });
      setShowEditModal(false);
      onShowToast("Account updated successfully.", "success");
    } catch (err) {
      onShowToast(err.message || "Failed to update account.", "error");
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    const updatedAccounts = state.accounts.filter((item) => item.accountId !== id);
    try {
      await updateState({ accounts: updatedAccounts });
      onShowToast("Account deleted successfully.", "success");
      navigate("/accounts");
    } catch (err) {
      onShowToast(err.message || "Failed to delete account.", "error");
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
              {account.name}
            </h1>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span className="badge badge-working">{account.type}</span>
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
              Account Information
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
                  Account Name
                </label>
                <div>{account.name}</div>
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
                <div>{account.phone}</div>
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
                <div>{account.website}</div>
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
                <div>{account.type}</div>
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
                  Industry
                </label>
                <div>{account.industry}</div>
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
                <div>${(account.revenue / 1000000).toFixed(1)}M</div>
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
                <div>{account.employees}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
              Contacts ({contacts.length})
            </h2>
            {contacts.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Title</th>
                    <th>Email</th>
                    <th>Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr key={contact.contactId}>
                      <td>
                        {contact.firstName} {contact.lastName}
                      </td>
                      <td>{contact.title}</td>
                      <td>{contact.email}</td>
                      <td>{contact.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: "var(--text-secondary)" }}>No contacts found</p>
            )}
          </div>

          <div className="card">
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
              Opportunities ({opportunities.length})
            </h2>
            {opportunities.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Amount</th>
                    <th>Stage</th>
                    <th>Close Date</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((opp) => (
                    <tr key={opp.opportunityId}>
                      <td>{opp.name}</td>
                      <td>${(opp.amount / 1000).toFixed(0)}K</td>
                      <td>
                        <span className="badge badge-working">{opp.stage}</span>
                      </td>
                      <td>{format(new Date(opp.closeDate), "MMM d, yyyy")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: "var(--text-secondary)" }}>No opportunities found</p>
            )}
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
                <div>{format(new Date(account.createdDate), "MMM d, yyyy h:mm a")}</div>
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
                <div>{format(new Date(account.modifiedDate), "MMM d, yyyy h:mm a")}</div>
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

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Account">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-group">
            <label className="form-label">Account Name *</label>
            <input
              type="text"
              className="form-input"
              value={editData.name}
              onChange={(event) => setEditData({ ...editData, name: event.target.value })}
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
            <label className="form-label">Website</label>
            <input
              type="url"
              className="form-input"
              value={editData.website}
              onChange={(event) => setEditData({ ...editData, website: event.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select
              className="form-select"
              value={editData.type}
              onChange={(event) => setEditData({ ...editData, type: event.target.value })}
            >
              <option value="Prospect">Prospect</option>
              <option value="Customer">Customer</option>
              <option value="Partner">Partner</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Industry</label>
            <input
              type="text"
              className="form-input"
              value={editData.industry}
              onChange={(event) => setEditData({ ...editData, industry: event.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Annual Revenue</label>
            <input
              type="number"
              className="form-input"
              value={editData.revenue}
              onChange={(event) =>
                setEditData({ ...editData, revenue: parseFloat(event.target.value) || 0 })
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label">Employees</label>
            <input
              type="number"
              className="form-input"
              value={editData.employees}
              onChange={(event) =>
                setEditData({ ...editData, employees: parseInt(event.target.value, 10) || 0 })
              }
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

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Account">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p>Are you sure you want to delete this account? This action cannot be undone.</p>
          <div
            style={{
              padding: "12px",
              backgroundColor: "var(--danger-bg)",
              border: "1px solid var(--danger)",
              borderRadius: "4px",
            }}
          >
            <strong>{account.name}</strong>
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
              Delete Account
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
