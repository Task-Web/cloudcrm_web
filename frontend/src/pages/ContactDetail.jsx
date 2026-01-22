import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useApp } from "../context/AppContext";
import { Modal } from "../components/Modal";

export const ContactDetail = ({ onShowToast }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, updateState } = useApp();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editData, setEditData] = useState({
    firstName: "",
    lastName: "",
    title: "",
    department: "",
    email: "",
    phone: "",
    mobile: "",
  });

  const contact = state.contacts.find((item) => item.contactId === id);
  const account = state.accounts.find((item) => item.accountId === contact?.accountId);
  const owner = state.users.find((user) => user.userId === contact?.ownerId);

  if (!contact) {
    return <div>Contact not found</div>;
  }

  const handleEdit = () => {
    setEditData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      title: contact.title,
      department: contact.department,
      email: contact.email,
      phone: contact.phone,
      mobile: contact.mobile,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    const updatedContacts = state.contacts.map((item) =>
      item.contactId === id ? { ...item, ...editData, modifiedDate: new Date().toISOString() } : item
    );
    try {
      await updateState({ contacts: updatedContacts });
      setShowEditModal(false);
      onShowToast("Contact updated successfully.", "success");
    } catch (err) {
      onShowToast(err.message || "Failed to update contact.", "error");
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    const updatedContacts = state.contacts.filter((item) => item.contactId !== id);
    try {
      await updateState({ contacts: updatedContacts });
      onShowToast("Contact deleted successfully.", "success");
      navigate("/contacts");
    } catch (err) {
      onShowToast(err.message || "Failed to delete contact.", "error");
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
              {contact.firstName} {contact.lastName}
            </h1>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span className="badge badge-working">{account?.name}</span>
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
              Contact Information
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
                  {contact.firstName} {contact.lastName}
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
                  Title
                </label>
                <div>{contact.title}</div>
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
                  Department
                </label>
                <div>{contact.department}</div>
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
                <div>{contact.email}</div>
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
                <div>{contact.phone}</div>
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
                <div>{contact.mobile}</div>
              </div>
            </div>
          </div>

          <div className="card">
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
                  Mailing Street
                </label>
                <div>{contact.mailingStreet}</div>
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
                  Mailing City
                </label>
                <div>{contact.mailingCity}</div>
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
                  Mailing State
                </label>
                <div>{contact.mailingState}</div>
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
                  Mailing Zip
                </label>
                <div>{contact.mailingZip}</div>
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
                  Mailing Country
                </label>
                <div>{contact.mailingCountry}</div>
              </div>
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
                <div>{format(new Date(contact.createdDate), "MMM d, yyyy h:mm a")}</div>
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
                <div>{format(new Date(contact.modifiedDate), "MMM d, yyyy h:mm a")}</div>
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

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Contact">
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
            <label className="form-label">Title</label>
            <input
              type="text"
              className="form-input"
              value={editData.title}
              onChange={(event) => setEditData({ ...editData, title: event.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <input
              type="text"
              className="form-input"
              value={editData.department}
              onChange={(event) => setEditData({ ...editData, department: event.target.value })}
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
            <label className="form-label">Mobile</label>
            <input
              type="tel"
              className="form-input"
              value={editData.mobile}
              onChange={(event) => setEditData({ ...editData, mobile: event.target.value })}
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

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Contact">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p>Are you sure you want to delete this contact? This action cannot be undone.</p>
          <div
            style={{
              padding: "12px",
              backgroundColor: "var(--danger-bg)",
              border: "1px solid var(--danger)",
              borderRadius: "4px",
            }}
          >
            <strong>
              {contact.firstName} {contact.lastName}
            </strong>
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
              Delete Contact
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
