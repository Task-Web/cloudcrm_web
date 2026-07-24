import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { CreateModal } from "../components/CreateModal";

export const Accounts = ({ onShowToast }) => {
  const { state, applyCrmChange } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showCreateModal, setShowCreateModal] = useState(false);

  const totalPages = Math.ceil(state.accounts.length / itemsPerPage);
  const paginatedAccounts = state.accounts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const accountFields = [
    { name: "name", label: "Account Name", type: "text", required: true },
    { name: "phone", label: "Phone", type: "text" },
    { name: "website", label: "Website", type: "text" },
    {
      name: "type",
      label: "Type",
      type: "select",
      options: ["Customer", "Prospect", "Partner", "Reseller"],
    },
    { name: "industry", label: "Industry", type: "text" },
    { name: "revenue", label: "Annual Revenue", type: "number" },
    { name: "employees", label: "Employees", type: "number" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "billingStreet", label: "Billing Street", type: "text" },
    { name: "billingCity", label: "Billing City", type: "text" },
    { name: "billingState", label: "Billing State", type: "text" },
    { name: "billingZip", label: "Billing Zip", type: "text" },
    { name: "billingCountry", label: "Billing Country", type: "text" },
  ];

  const handleCreateAccount = async (data) => {
    const newAccount = {
      accountId: `account_${Date.now()}`,
      name: data.name,
      phone: data.phone || "",
      website: data.website || "",
      type: data.type || "Customer",
      industry: data.industry || "",
      revenue: data.revenue || 0,
      employees: data.employees || 0,
      description: data.description || "",
      ownerId: state.user.userId,
      billingStreet: data.billingStreet || "",
      billingCity: data.billingCity || "",
      billingState: data.billingState || "",
      billingZip: data.billingZip || "",
      billingCountry: data.billingCountry || "",
      shippingStreet: data.billingStreet || "",
      shippingCity: data.billingCity || "",
      shippingState: data.billingState || "",
      shippingZip: data.billingZip || "",
      shippingCountry: data.billingCountry || "",
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
    };

    try {
      await applyCrmChange({ accounts: [...state.accounts, newAccount] });
      onShowToast("Account created successfully.", "success");
    } catch (err) {
      onShowToast(err.message || "Failed to create account.", "error");
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
        <h1 style={{ fontSize: "28px", fontWeight: 600 }}>Accounts</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          New Account
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Account Name</th>
              <th>Phone</th>
              <th>Website</th>
              <th>Type</th>
              <th>Industry</th>
              <th>Annual Revenue</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAccounts.map((account) => (
              <tr key={account.accountId}>
                <td>
                  <Link to={`/accounts/${account.accountId}`}>{account.name}</Link>
                </td>
                <td>{account.phone}</td>
                <td>{account.website}</td>
                <td>{account.type}</td>
                <td>{account.industry}</td>
                <td>${(account.revenue / 1000000).toFixed(1)}M</td>
                <td>{format(new Date(account.createdDate), "MMM d, yyyy")}</td>
              </tr>
            ))}
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
        title="Create New Account"
        fields={accountFields}
        onSubmit={handleCreateAccount}
      />
    </div>
  );
};
