import { useApp } from "../context/AppContext";

export const Reports = ({ onShowToast }) => {
  const { state } = useApp();

  const totalLeads = state.leads.length;
  const totalAccounts = state.accounts.length;
  const totalOpportunities = state.opportunities.length;
  const totalCases = state.cases.length;

  const leadsByStatus = state.leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {});

  const opportunitiesByStage = state.opportunities.reduce((acc, opp) => {
    acc[opp.stage] = (acc[opp.stage] || 0) + 1;
    return acc;
  }, {});

  const totalOppValue = state.opportunities.reduce((sum, opp) => sum + opp.amount, 0);

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
        <h1 style={{ fontSize: "28px", fontWeight: 600 }}>Reports</h1>
        <button className="btn btn-primary" onClick={() => onShowToast("Report refreshed.", "success")}>
          Refresh Reports
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <div className="card">
          <h3 style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "8px" }}>
            Total Leads
          </h3>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>{totalLeads}</div>
          <div style={{ fontSize: "14px", color: "var(--success)" }}>+3 this week</div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "8px" }}>
            Total Accounts
          </h3>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>{totalAccounts}</div>
          <div style={{ fontSize: "14px", color: "var(--success)" }}>+1 this week</div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "8px" }}>
            Total Opportunities
          </h3>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>{totalOpportunities}</div>
          <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            ${(totalOppValue / 1000000).toFixed(1)}M total
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "8px" }}>
            Total Cases
          </h3>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>{totalCases}</div>
          <div style={{ fontSize: "14px", color: "var(--error)" }}>2 open</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div className="card">
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>Leads by Status</h2>
          {Object.entries(leadsByStatus).map(([status, count]) => (
            <div
              key={status}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span>{status}</span>
              <span style={{ fontWeight: 600 }}>{count}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
            Opportunities by Stage
          </h2>
          {Object.entries(opportunitiesByStage).map(([stage, count]) => (
            <div
              key={stage}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span>{stage}</span>
              <span style={{ fontWeight: 600 }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>Top Accounts</h2>
        {state.accounts.slice(0, 5).map((account, index) => (
          <div
            key={account.accountId}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: index < 4 ? "1px solid var(--border)" : "none",
            }}
          >
            <span>{account.name}</span>
            <span>${(account.revenue / 1000).toFixed(0)}K</span>
          </div>
        ))}
      </div>
    </div>
  );
};
