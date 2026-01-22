import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { useApp } from "../context/AppContext";
import { CreateModal } from "../components/CreateModal";

export const Cases = ({ onShowToast }) => {
  const { state, updateState } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showCreateModal, setShowCreateModal] = useState(false);

  const totalPages = Math.ceil(state.cases.length / itemsPerPage);
  const paginatedCases = state.cases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const caseFields = [
    { name: "caseNumber", label: "Case Number", type: "text", required: true },
    { name: "subject", label: "Subject", type: "text", required: true },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: ["New", "Working", "Escalated", "Closed"],
      required: true,
    },
    {
      name: "priority",
      label: "Priority",
      type: "select",
      options: ["Low", "Medium", "High", "Critical"],
    },
    { name: "origin", label: "Origin", type: "text" },
    {
      name: "accountId",
      label: "Account",
      type: "select",
      options: state.accounts.map((account) => account.name),
    },
    {
      name: "contactId",
      label: "Contact",
      type: "select",
      options: state.contacts.map((contact) => `${contact.firstName} ${contact.lastName}`),
    },
    { name: "description", label: "Description", type: "textarea" },
  ];

  const handleCreateCase = async (data) => {
    const account = state.accounts.find((item) => item.name === data.accountId);
    const contact = state.contacts.find(
      (item) => `${item.firstName} ${item.lastName}` === data.contactId
    );
    const newCase = {
      caseId: `case_${Date.now()}`,
      caseNumber: data.caseNumber,
      subject: data.subject,
      status: data.status || "New",
      priority: data.priority || "Medium",
      origin: data.origin || "",
      accountId: account ? account.accountId : state.accounts[0]?.accountId,
      contactId: contact ? contact.contactId : state.contacts[0]?.contactId,
      description: data.description || "",
      ownerId: state.user.userId,
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
    };

    try {
      await updateState({ cases: [...state.cases, newCase] });
      onShowToast("Case created successfully.", "success");
    } catch (err) {
      onShowToast(err.message || "Failed to create case.", "error");
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
        <h1 style={{ fontSize: "28px", fontWeight: 600 }}>Cases</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          New Case
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Case Number</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Account</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCases.map((caseItem) => {
              const account = state.accounts.find((item) => item.accountId === caseItem.accountId);
              return (
                <tr key={caseItem.caseId}>
                  <td>
                    <Link to={`/cases/${caseItem.caseId}`}>{caseItem.caseNumber}</Link>
                  </td>
                  <td>{caseItem.subject}</td>
                  <td>
                    <span className="badge badge-working">{caseItem.status}</span>
                  </td>
                  <td>{caseItem.priority}</td>
                  <td>{account?.name}</td>
                  <td>{format(new Date(caseItem.createdDate), "MMM d, yyyy")}</td>
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
        title="Create New Case"
        fields={caseFields}
        onSubmit={handleCreateCase}
      />
    </div>
  );
};
