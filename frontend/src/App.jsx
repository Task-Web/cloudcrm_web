import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import { TopNav } from "./components/TopNav";
import { Sidebar } from "./components/Sidebar";
import { Toast } from "./components/Toast";
import { Home } from "./pages/Home";
import { Leads } from "./pages/Leads";
import { LeadDetail } from "./pages/LeadDetail";
import { Accounts } from "./pages/Accounts";
import { AccountDetail } from "./pages/AccountDetail";
import { Contacts } from "./pages/Contacts";
import { ContactDetail } from "./pages/ContactDetail";
import { Opportunities } from "./pages/Opportunities";
import { OpportunityDetail } from "./pages/OpportunityDetail";
import { Cases } from "./pages/Cases";
import { CaseDetail } from "./pages/CaseDetail";
import { Chatter } from "./pages/Chatter";
import { Files } from "./pages/Files";
import { Dashboards } from "./pages/Dashboards";
import { Reports } from "./pages/Reports";
import { Calendar } from "./pages/Calendar";

const LoadingScreen = ({ label, action }) => (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: "16px",
      background: "var(--bg)",
      color: "var(--text-secondary)",
    }}
  >
    <div className="spinner" style={{ width: "32px", height: "32px" }} />
    <div style={{ fontSize: "14px" }}>{label}</div>
    {action}
  </div>
);

const AppShell = () => {
  const { state, loading, error, refreshState } = useApp();
  const [toasts, setToasts] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1100 : false
  );

  const showToast = (message, type) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    if (!error) return;
    showToast(error, "error");
  }, [error]);

  if (loading) {
    return <LoadingScreen label="Loading CloudCRM workspace..." />;
  }

  if (!state) {
    return (
      <LoadingScreen
        label="Unable to load workspace data."
        action={
          <button className="btn btn-primary" onClick={() => refreshState()}>
            Retry
          </button>
        }
      />
    );
  }

  return (
    <BrowserRouter>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <TopNav onShowToast={showToast} />
        <div
          style={{
            display: "flex",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <main
            style={{
              flex: 1,
              overflow: "auto",
              padding: "clamp(16px, 2.5vw, 24px)",
              background: "var(--bg)",
            }}
          >
            <Routes>
              <Route path="/" element={<Home onShowToast={showToast} />} />
              <Route path="/leads" element={<Leads onShowToast={showToast} />} />
              <Route path="/leads/:id" element={<LeadDetail onShowToast={showToast} />} />
              <Route path="/accounts" element={<Accounts onShowToast={showToast} />} />
              <Route path="/accounts/:id" element={<AccountDetail onShowToast={showToast} />} />
              <Route path="/contacts" element={<Contacts onShowToast={showToast} />} />
              <Route path="/contacts/:id" element={<ContactDetail onShowToast={showToast} />} />
              <Route
                path="/opportunities"
                element={<Opportunities onShowToast={showToast} />}
              />
              <Route
                path="/opportunities/:id"
                element={<OpportunityDetail onShowToast={showToast} />}
              />
              <Route path="/cases" element={<Cases onShowToast={showToast} />} />
              <Route path="/cases/:id" element={<CaseDetail onShowToast={showToast} />} />
              <Route path="/chatter" element={<Chatter onShowToast={showToast} />} />
              <Route path="/files" element={<Files onShowToast={showToast} />} />
              <Route path="/dashboards" element={<Dashboards onShowToast={showToast} />} />
              <Route path="/reports" element={<Reports onShowToast={showToast} />} />
              <Route path="/calendar" element={<Calendar onShowToast={showToast} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </BrowserRouter>
  );
};

const App = () => (
  <AppProvider>
    <AppShell />
  </AppProvider>
);

export default App;
