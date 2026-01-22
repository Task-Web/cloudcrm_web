import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Download, Filter, Plus } from "lucide-react";
import { format } from "date-fns";
import { CreateModal } from "../components/CreateModal";

export const Leads = ({ onShowToast }) => {
  const { state, updateState, loading } = useApp();
  const [selectedView, setSelectedView] = useState("all");
  const [sortField, setSortField] = useState("createdDate");
  const [sortDirection, setSortDirection] = useState("desc");
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    rating: "",
    source: "",
    owner: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredLeads = useMemo(
    () =>
      state.leads.filter((lead) => {
        if (selectedView === "my") return lead.ownerId === state.user.userId;
        if (selectedView === "today") {
          const today = new Date().toDateString();
          return new Date(lead.createdDate).toDateString() === today;
        }

        if (filters.status && lead.status !== filters.status) return false;
        if (filters.rating && lead.rating !== filters.rating) return false;
        if (filters.source && lead.source !== filters.source) return false;
        if (filters.owner && lead.ownerId !== filters.owner) return false;

        return true;
      }),
    [filters, selectedView, state.leads, state.user.userId]
  );

  const sortedLeads = useMemo(() => {
    const next = [...filteredLeads];
    next.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return next;
  }, [filteredLeads, sortDirection, sortField]);

  const totalPages = Math.ceil(sortedLeads.length / itemsPerPage);
  const paginatedLeads = sortedLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleLeadSelection = (leadId) => {
    setSelectedLeads((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    );
  };

  const toggleAllLeads = () => {
    if (selectedLeads.length === paginatedLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(paginatedLeads.map((lead) => lead.leadId));
    }
  };

  const leadFields = [
    { name: "firstName", label: "First Name", type: "text", required: true },
    { name: "lastName", label: "Last Name", type: "text", required: true },
    { name: "company", label: "Company", type: "text", required: true },
    { name: "title", label: "Title", type: "text" },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "phone", label: "Phone", type: "text" },
    { name: "mobile", label: "Mobile", type: "text" },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: ["New", "Working", "Qualified", "Unqualified"],
      required: true,
    },
    {
      name: "source",
      label: "Lead Source",
      type: "select",
      options: ["Website", "Referral", "Trade Show", "Cold Call", "LinkedIn"],
    },
    { name: "rating", label: "Rating", type: "select", options: ["Hot", "Warm", "Cold"] },
    { name: "industry", label: "Industry", type: "text" },
    { name: "employees", label: "Employees", type: "number" },
    { name: "revenue", label: "Annual Revenue", type: "number" },
    { name: "street", label: "Street", type: "text" },
    { name: "city", label: "City", type: "text" },
    { name: "state", label: "State", type: "text" },
    { name: "zip", label: "Zip Code", type: "text" },
    { name: "country", label: "Country", type: "text" },
    { name: "website", label: "Website", type: "text" },
    { name: "description", label: "Description", type: "textarea" },
  ];

  const handleCreateLead = async (data) => {
    const newLead = {
      leadId: `lead_${Date.now()}`,
      firstName: data.firstName,
      lastName: data.lastName,
      company: data.company,
      title: data.title || "",
      email: data.email,
      phone: data.phone || "",
      mobile: data.mobile || "",
      status: data.status || "New",
      source: data.source || "",
      rating: data.rating || "Warm",
      industry: data.industry || "",
      employees: data.employees || 0,
      revenue: data.revenue || 0,
      street: data.street || "",
      city: data.city || "",
      state: data.state || "",
      zip: data.zip || "",
      country: data.country || "",
      website: data.website || "",
      description: data.description || "",
      ownerId: state.user.userId,
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
    };

    try {
      await updateState({ leads: [...state.leads, newLead] });
      onShowToast("Lead created successfully.", "success");
    } catch (err) {
      onShowToast(err.message || "Failed to create lead.", "error");
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
        <h1 style={{ fontSize: "28px", fontWeight: 600 }}>Leads</h1>
        <div style={{ display: "flex", gap: "12px" }}>
          <button className="btn btn-secondary" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={18} />
            Filters
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              const csvContent =
                "data:text/csv;charset=utf-8," +
                "Name,Company,Email,Phone,Status,Source,Rating,Owner,Created Date\n" +
                filteredLeads
                  .map((lead) => {
                    const owner = state.users.find((user) => user.userId === lead.ownerId);
                    return `"${lead.firstName} ${lead.lastName}","${lead.company}","${lead.email}","${lead.phone}","${lead.status}","${lead.source}","${lead.rating}","${owner?.firstName} ${owner?.lastName}","${format(
                      new Date(lead.createdDate),
                      "yyyy-MM-dd"
                    )}"`;
                  })
                  .join("\n");

              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "leads.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              onShowToast("Leads exported successfully.", "success");
            }}
          >
            <Download size={18} />
            Export
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            New Lead
          </button>
        </div>
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <select
            value={selectedView}
            onChange={(event) => setSelectedView(event.target.value)}
            className="form-select"
            style={{ width: "200px" }}
          >
            <option value="all">All Leads</option>
            <option value="my">My Leads</option>
            <option value="today">Today's Leads</option>
          </select>
          <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            {filteredLeads.length} items
          </div>
        </div>

        {showFilters && (
          <div className="card" style={{ marginBottom: "16px", padding: "16px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={filters.status}
                  onChange={(event) => setFilters({ ...filters, status: event.target.value })}
                >
                  <option value="">All Statuses</option>
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
                  value={filters.rating}
                  onChange={(event) => setFilters({ ...filters, rating: event.target.value })}
                >
                  <option value="">All Ratings</option>
                  <option value="Hot">Hot</option>
                  <option value="Warm">Warm</option>
                  <option value="Cold">Cold</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Source</label>
                <select
                  className="form-select"
                  value={filters.source}
                  onChange={(event) => setFilters({ ...filters, source: event.target.value })}
                >
                  <option value="">All Sources</option>
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Trade Show">Trade Show</option>
                  <option value="Cold Call">Cold Call</option>
                  <option value="LinkedIn">LinkedIn</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              <button
                className="btn btn-secondary"
                onClick={() => setFilters({ status: "", rating: "", source: "", owner: "" })}
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div className="spinner" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "var(--text-secondary)" }}>Loading leads...</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th className="table-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === paginatedLeads.length && paginatedLeads.length > 0}
                    onChange={toggleAllLeads}
                  />
                </th>
                <th onClick={() => handleSort("firstName")}>Name</th>
                <th onClick={() => handleSort("company")}>Company</th>
                <th onClick={() => handleSort("email")}>Email</th>
                <th onClick={() => handleSort("phone")}>Phone</th>
                <th onClick={() => handleSort("status")}>Status</th>
                <th onClick={() => handleSort("source")}>Source</th>
                <th onClick={() => handleSort("rating")}>Rating</th>
                <th>Owner</th>
                <th onClick={() => handleSort("createdDate")}>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeads.map((lead) => {
                const owner = state.users.find((user) => user.userId === lead.ownerId);
                return (
                  <tr key={lead.leadId}>
                    <td className="table-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.leadId)}
                        onChange={() => toggleLeadSelection(lead.leadId)}
                      />
                    </td>
                    <td>
                      <Link to={`/leads/${lead.leadId}`}>
                        {lead.firstName} {lead.lastName}
                      </Link>
                    </td>
                    <td>{lead.company}</td>
                    <td>{lead.email}</td>
                    <td>{lead.phone}</td>
                    <td>
                      <span className={`badge badge-${lead.status.toLowerCase()}`}>{lead.status}</span>
                    </td>
                    <td>{lead.source}</td>
                    <td>
                      <span className={`badge badge-${lead.rating.toLowerCase()}`}>{lead.rating}</span>
                    </td>
                    <td>
                      {owner?.firstName} {owner?.lastName}
                    </td>
                    <td>{format(new Date(lead.createdDate), "MMM d, yyyy")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

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
        title="Create New Lead"
        fields={leadFields}
        onSubmit={handleCreateLead}
      />
    </div>
  );
};
