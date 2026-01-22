import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { useApp } from "../context/AppContext";
import { CreateModal } from "../components/CreateModal";

export const Opportunities = ({ onShowToast }) => {
  const { state, updateState } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showCreateModal, setShowCreateModal] = useState(false);

  const totalPages = Math.ceil(state.opportunities.length / itemsPerPage);
  const paginatedOpportunities = state.opportunities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const opportunityFields = [
    { name: "name", label: "Opportunity Name", type: "text", required: true },
    {
      name: "accountId",
      label: "Account",
      type: "select",
      options: state.accounts.map((account) => account.name),
      required: true,
    },
    { name: "amount", label: "Amount", type: "number" },
    { name: "closeDate", label: "Close Date", type: "text" },
    {
      name: "stage",
      label: "Stage",
      type: "select",
      options: [
        "Prospecting",
        "Qualification",
        "Needs Analysis",
        "Value Proposition",
        "Proposal",
        "Negotiation",
        "Closed Won",
        "Closed Lost",
      ],
    },
    { name: "probability", label: "Probability", type: "number" },
    { name: "type", label: "Type", type: "text" },
    { name: "leadSource", label: "Lead Source", type: "text" },
    { name: "nextStep", label: "Next Step", type: "text" },
    { name: "description", label: "Description", type: "textarea" },
  ];

  const handleCreateOpportunity = async (data) => {
    const account = state.accounts.find((item) => item.name === data.accountId);
    const newOpportunity = {
      opportunityId: `opp_${Date.now()}`,
      name: data.name,
      accountId: account ? account.accountId : state.accounts[0].accountId,
      amount: data.amount || 0,
      closeDate: data.closeDate
        ? new Date(data.closeDate).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      stage: data.stage || "Prospecting",
      probability: data.probability || 10,
      type: data.type || "New Business",
      leadSource: data.leadSource || "",
      nextStep: data.nextStep || "",
      description: data.description || "",
      ownerId: state.user.userId,
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
    };

    try {
      await updateState({ opportunities: [...state.opportunities, newOpportunity] });
      onShowToast("Opportunity created successfully.", "success");
    } catch (err) {
      onShowToast(err.message || "Failed to create opportunity.", "error");
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
        <h1 style={{ fontSize: "28px", fontWeight: 600 }}>Opportunities</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          New Opportunity
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Opportunity Name</th>
              <th>Account</th>
              <th>Amount</th>
              <th>Stage</th>
              <th>Close Date</th>
              <th>Owner</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOpportunities.map((opp) => {
              const account = state.accounts.find((item) => item.accountId === opp.accountId);
              const owner = state.users.find((user) => user.userId === opp.ownerId);
              return (
                <tr key={opp.opportunityId}>
                  <td>
                    <Link to={`/opportunities/${opp.opportunityId}`}>{opp.name}</Link>
                  </td>
                  <td>{account?.name}</td>
                  <td>${(opp.amount / 1000).toFixed(0)}K</td>
                  <td>
                    <span className="badge badge-working">{opp.stage}</span>
                  </td>
                  <td>{format(new Date(opp.closeDate), "MMM d, yyyy")}</td>
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
        title="Create New Opportunity"
        fields={opportunityFields}
        onSubmit={handleCreateOpportunity}
      />
    </div>
  );
};
