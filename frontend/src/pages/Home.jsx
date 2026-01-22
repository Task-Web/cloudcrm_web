import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  Calendar,
  DollarSign,
  ExternalLink,
  FileText,
  MessageSquare,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

export const Home = () => {
  const { state } = useApp();

  const todaysLeads = state.leads.filter((lead) => {
    const created = new Date(lead.createdDate);
    const today = new Date();
    return created.toDateString() === today.toDateString();
  }).length;

  const openOpportunities = state.opportunities.filter(
    (opp) => opp.stage !== "Closed Won" && opp.stage !== "Closed Lost"
  );

  const totalOppValue = openOpportunities.reduce((sum, opp) => sum + opp.amount, 0);

  const thisMonthCases = state.cases.filter((caseItem) => {
    const created = new Date(caseItem.createdDate);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  const todayActivities = state.activities.filter((activity) => {
    if (activity.dueDate) {
      const due = new Date(activity.dueDate);
      const today = new Date();
      return due.toDateString() === today.toDateString();
    }
    return false;
  }).length;

  const recentItems = [
    ...state.leads.slice(0, 3).map((lead) => ({
      type: "Lead",
      name: `${lead.firstName} ${lead.lastName}`,
      subtitle: lead.company,
      path: `/leads/${lead.leadId}`,
      modifiedDate: lead.modifiedDate,
    })),
    ...state.accounts.slice(0, 2).map((account) => ({
      type: "Account",
      name: account.name,
      subtitle: account.industry,
      path: `/accounts/${account.accountId}`,
      modifiedDate: account.modifiedDate,
    })),
    ...state.opportunities.slice(0, 2).map((opp) => ({
      type: "Opportunity",
      name: opp.name,
      subtitle: `$${(opp.amount / 1000).toFixed(0)}K`,
      path: `/opportunities/${opp.opportunityId}`,
      modifiedDate: opp.modifiedDate,
    })),
    ...state.contacts.slice(0, 2).map((contact) => ({
      type: "Contact",
      name: `${contact.firstName} ${contact.lastName}`,
      subtitle: state.accounts.find((account) => account.accountId === contact.accountId)?.name || "",
      path: `/contacts/${contact.contactId}`,
      modifiedDate: contact.modifiedDate,
    })),
    ...state.cases.slice(0, 1).map((caseItem) => ({
      type: "Case",
      name: caseItem.subject,
      subtitle: caseItem.caseNumber,
      path: `/cases/${caseItem.caseId}`,
      modifiedDate: caseItem.modifiedDate,
    })),
  ]
    .sort((a, b) => new Date(b.modifiedDate).getTime() - new Date(a.modifiedDate).getTime())
    .slice(0, 10);

  return (
    <div>
      <h1 style={{ fontSize: "28px", fontWeight: 600, marginBottom: "8px" }}>
        Good morning, {state.user.firstName}!
      </h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "32px" }}>
        Here's what's happening with your sales today.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <div style={{ background: "#e3f3ff", padding: "12px", borderRadius: "8px" }}>
              <TrendingUp size={24} color="#0176D3" />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Today's Leads</div>
              <div style={{ fontSize: "24px", fontWeight: 600 }}>{todaysLeads}</div>
            </div>
          </div>
          <Link to="/leads" style={{ fontSize: "14px" }}>
            View all leads ->
          </Link>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <div style={{ background: "#e8f4e8", padding: "12px", borderRadius: "8px" }}>
              <DollarSign size={24} color="#04844B" />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Open Opportunities
              </div>
              <div style={{ fontSize: "24px", fontWeight: 600 }}>
                ${(totalOppValue / 1000).toFixed(0)}K
              </div>
            </div>
          </div>
          <Link to="/opportunities" style={{ fontSize: "14px" }}>
            View opportunities ->
          </Link>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <div style={{ background: "#fff4e5", padding: "12px", borderRadius: "8px" }}>
              <FileText size={24} color="#fe9339" />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Cases This Month</div>
              <div style={{ fontSize: "24px", fontWeight: 600 }}>{thisMonthCases}</div>
            </div>
          </div>
          <Link to="/cases" style={{ fontSize: "14px" }}>
            View cases ->
          </Link>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <div style={{ background: "#ffeaea", padding: "12px", borderRadius: "8px" }}>
              <Calendar size={24} color="#EA001E" />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Activities Due Today
              </div>
              <div style={{ fontSize: "24px", fontWeight: 600 }}>{todayActivities}</div>
            </div>
          </div>
          <Link to="/calendar" style={{ fontSize: "14px" }}>
            View calendar ->
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        <div>
          <div className="card" style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>Recent Items</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {recentItems.map((item, index) => (
                <Link
                  key={`${item.path}-${index}`}
                  to={item.path}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px",
                    borderBottom: index < recentItems.length - 1 ? "1px solid var(--border)" : "none",
                    textDecoration: "none",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background = "var(--hover)";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = "transparent";
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--text-secondary)",
                          textTransform: "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        {item.type}
                      </span>
                      <ExternalLink size={12} color="var(--text-secondary)" />
                    </div>
                    <div style={{ fontWeight: 500, color: "var(--text-primary)", marginBottom: "2px" }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{item.subtitle}</div>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", textAlign: "right" }}>
                    {format(new Date(item.modifiedDate), "MMM d")}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>Top Opportunities</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Opportunity Name</th>
                  <th>Account</th>
                  <th>Amount</th>
                  <th>Stage</th>
                  <th>Close Date</th>
                </tr>
              </thead>
              <tbody>
                {openOpportunities.slice(0, 5).map((opp) => {
                  const account = state.accounts.find((item) => item.accountId === opp.accountId);
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
              Tasks & Events
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {state.activities.slice(0, 5).map((activity) => (
                <div
                  key={activity.activityId}
                  style={{ padding: "12px", background: "var(--bg)", borderRadius: "4px" }}
                >
                  <div style={{ fontWeight: 500, marginBottom: "4px" }}>{activity.subject}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    {activity.dueDate && format(new Date(activity.dueDate), "MMM d, yyyy")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
              Chatter Feed
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {state.chatterPosts.slice(0, 3).map((post) => {
                const user = state.users.find((item) => item.userId === post.userId);
                return (
                  <div key={post.postId}>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                      <img
                        src={user?.avatar}
                        alt={user?.firstName}
                        style={{ width: "32px", height: "32px", borderRadius: "50%" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: "14px" }}>
                          {user?.firstName} {user?.lastName}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                          {format(new Date(post.createdDate), "MMM d, h:mm a")}
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize: "14px", marginBottom: "8px" }}>{post.content}</p>
                    <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--text-secondary)" }}>
                      <button style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <ThumbsUp size={14} /> {post.likeCount}
                      </button>
                      <button style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <MessageSquare size={14} /> {post.commentCount}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
