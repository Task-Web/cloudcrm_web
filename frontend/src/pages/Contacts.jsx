import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useApp } from "../context/AppContext";
import { CreateModal } from "../components/CreateModal";

export const Contacts = ({ onShowToast }) => {
  const { state, applyCrmChange } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showCreateModal, setShowCreateModal] = useState(false);

  const totalPages = Math.ceil(state.contacts.length / itemsPerPage);
  const paginatedContacts = state.contacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const contactFields = [
    { name: "firstName", label: "First Name", type: "text", required: true },
    { name: "lastName", label: "Last Name", type: "text", required: true },
    {
      name: "accountId",
      label: "Account",
      type: "select",
      options: state.accounts.map((account) => account.name),
      required: true,
    },
    { name: "title", label: "Title", type: "text" },
    { name: "department", label: "Department", type: "text" },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "phone", label: "Phone", type: "text" },
    { name: "mobile", label: "Mobile", type: "text" },
    { name: "mailingStreet", label: "Mailing Street", type: "text" },
    { name: "mailingCity", label: "Mailing City", type: "text" },
    { name: "mailingState", label: "Mailing State", type: "text" },
    { name: "mailingZip", label: "Mailing Zip", type: "text" },
    { name: "mailingCountry", label: "Mailing Country", type: "text" },
  ];

  const handleCreateContact = async (data) => {
    const account = state.accounts.find((item) => item.name === data.accountId);
    const newContact = {
      contactId: `contact_${Date.now()}`,
      accountId: account ? account.accountId : state.accounts[0].accountId,
      firstName: data.firstName,
      lastName: data.lastName,
      title: data.title || "",
      department: data.department || "",
      email: data.email,
      phone: data.phone || "",
      mobile: data.mobile || "",
      mailingStreet: data.mailingStreet || "",
      mailingCity: data.mailingCity || "",
      mailingState: data.mailingState || "",
      mailingZip: data.mailingZip || "",
      mailingCountry: data.mailingCountry || "",
      ownerId: state.user.userId,
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
    };

    try {
      await applyCrmChange({ contacts: [...state.contacts, newContact] });
      onShowToast("Contact created successfully.", "success");
    } catch (err) {
      onShowToast(err.message || "Failed to create contact.", "error");
    }
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
        <h1 style={{ fontSize: "28px", fontWeight: 600 }}>Contacts</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          New Contact
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Account Name</th>
              <th>Title</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Owner</th>
            </tr>
          </thead>
          <tbody>
            {paginatedContacts.map((contact) => {
              const account = state.accounts.find((item) => item.accountId === contact.accountId);
              const owner = state.users.find((user) => user.userId === contact.ownerId);
              return (
                <tr key={contact.contactId}>
                  <td>
                    <Link to={`/contacts/${contact.contactId}`}>
                      {contact.firstName} {contact.lastName}
                    </Link>
                  </td>
                  <td>{account?.name}</td>
                  <td>{contact.title}</td>
                  <td>{contact.email}</td>
                  <td>{contact.phone}</td>
                  <td>
                    {owner?.firstName} {owner?.lastName}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="pagination">
            <button onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={currentPage === page ? "active" : ""}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <CreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Contact"
        fields={contactFields}
        onSubmit={handleCreateContact}
      />
    </div>
  );
};
