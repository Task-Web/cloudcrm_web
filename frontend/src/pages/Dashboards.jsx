import { useState } from "react";
import { Plus } from "lucide-react";
import { useApp } from "../context/AppContext";
import { CreateModal } from "../components/CreateModal";

export const Dashboards = ({ onShowToast }) => {
  const { state, updateState } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const dashboardFields = [
    { name: "name", label: "Dashboard Name", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea" },
    {
      name: "chartType",
      label: "Chart Type",
      type: "select",
      options: ["bar", "line", "pie", "table"],
      required: true,
    },
  ];

  const handleCreateDashboard = async (data) => {
    const newDashboard = {
      dashboardId: `dashboard_${Date.now()}`,
      name: data.name,
      description: data.description || "",
      chartType: data.chartType || "bar",
      createdDate: new Date().toISOString(),
      createdBy: state.user.userId,
    };

    try {
      await updateState({ dashboards: [...(state.dashboards || []), newDashboard] });
      onShowToast("Dashboard created successfully.", "success");
    } catch (err) {
      onShowToast(err.message || "Failed to create dashboard.", "error");
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
        <h1 style={{ fontSize: "28px", fontWeight: 600 }}>Dashboards</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          New Dashboard
        </button>
      </div>

      <div className="card">
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Sales Performance Dashboard
        </h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
          Overview of key sales metrics and performance indicators
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          <div style={{ background: "var(--bg)", padding: "20px", borderRadius: "8px" }}>
            <h3 style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "8px" }}>
              Total Revenue
            </h3>
            <div style={{ fontSize: "32px", fontWeight: 600, color: "var(--success)" }}>$475K</div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
              +12% from last month
            </div>
          </div>

          <div style={{ background: "var(--bg)", padding: "20px", borderRadius: "8px" }}>
            <h3 style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "8px" }}>
              Open Deals
            </h3>
            <div style={{ fontSize: "32px", fontWeight: 600, color: "var(--primary)" }}>3</div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
              In pipeline
            </div>
          </div>

          <div style={{ background: "var(--bg)", padding: "20px", borderRadius: "8px" }}>
            <h3 style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "8px" }}>
              Win Rate
            </h3>
            <div style={{ fontSize: "32px", fontWeight: 600, color: "var(--warning)" }}>65%</div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
              This quarter
            </div>
          </div>
        </div>
      </div>

      <CreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Dashboard"
        fields={dashboardFields}
        onSubmit={handleCreateDashboard}
      />
    </div>
  );
};
