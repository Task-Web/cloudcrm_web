import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, ChevronDown, Cloud, Grid3x3, HelpCircle, Plus } from "lucide-react";
import { useApp } from "../context/AppContext";
import { SearchBox } from "./SearchBox";
import { CreateModal } from "./CreateModal";
import { clearUserCookie } from "../utils/cookies";

export const TopNav = ({ onShowToast }) => {
  const { state, applyCrmChange } = useApp();
  const [showAppLauncher, setShowAppLauncher] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const profileFields = useMemo(
    () => [
      { name: "firstName", label: "First Name", type: "text", required: true },
      { name: "lastName", label: "Last Name", type: "text", required: true },
      { name: "title", label: "Title", type: "text" },
      { name: "department", label: "Department", type: "text" },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Phone", type: "text" },
    ],
    []
  );

  const settingsFields = useMemo(
    () => [
      { name: "timezone", label: "Timezone", type: "text" },
      { name: "locale", label: "Locale", type: "text" },
      {
        name: "theme",
        label: "Theme",
        type: "select",
        options: ["light", "dark"],
      },
    ],
    []
  );

  const handleProfileSave = async (data) => {
    try {
      const updatedUser = { ...state.user, ...data };
      const updatedUsers = state.users.map((user) =>
        user.userId === updatedUser.userId ? updatedUser : user
      );
      await applyCrmChange({ user: updatedUser, users: updatedUsers });
      onShowToast("Profile updated.", "success");
    } catch (err) {
      onShowToast(err.message || "Failed to update profile.", "error");
      throw err;
    }
  };

  const handleSettingsSave = async (data) => {
    try {
      const updatedUser = { ...state.user, ...data };
      const updatedUsers = state.users.map((user) =>
        user.userId === updatedUser.userId ? updatedUser : user
      );
      await applyCrmChange({ user: updatedUser, users: updatedUsers });
      onShowToast("Settings saved.", "success");
    } catch (err) {
      onShowToast(err.message || "Failed to update settings.", "error");
      throw err;
    }
  };

  return (
    <nav
      style={{
        height: "60px",
        background: "white",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: "16px",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      <button
        onClick={() => setShowAppLauncher(!showAppLauncher)}
        style={{ padding: "8px", position: "relative" }}
        title="App Launcher"
      >
        <Grid3x3 size={20} />
        {showAppLauncher && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: "8px",
              background: "white",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              boxShadow: "var(--shadow-lg)",
              padding: "16px",
              minWidth: "300px",
              zIndex: 1001,
            }}
          >
            <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>
              Apps
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <Link
                to="/leads"
                style={{
                  padding: "12px",
                  textAlign: "center",
                  borderRadius: "4px",
                  background: "var(--bg)",
                }}
              >
                Leads
              </Link>
              <Link
                to="/accounts"
                style={{
                  padding: "12px",
                  textAlign: "center",
                  borderRadius: "4px",
                  background: "var(--bg)",
                }}
              >
                Accounts
              </Link>
              <Link
                to="/contacts"
                style={{
                  padding: "12px",
                  textAlign: "center",
                  borderRadius: "4px",
                  background: "var(--bg)",
                }}
              >
                Contacts
              </Link>
              <Link
                to="/opportunities"
                style={{
                  padding: "12px",
                  textAlign: "center",
                  borderRadius: "4px",
                  background: "var(--bg)",
                }}
              >
                Opportunities
              </Link>
            </div>
          </div>
        )}
      </button>

      <Link
        to="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          textDecoration: "none",
          color: "var(--primary)",
          fontWeight: 600,
          fontSize: "18px",
        }}
      >
        <Cloud size={24} />
        CloudCRM
      </Link>

      <SearchBox onShowToast={onShowToast} />

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="btn btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "4px" }}
          >
            <Plus size={18} />
            New
          </button>
          {showCreateMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "8px",
                background: "white",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                boxShadow: "var(--shadow-lg)",
                minWidth: "200px",
                zIndex: 1001,
              }}
            >
              <Link
                to="/leads"
                style={{ display: "block", padding: "12px 16px", borderBottom: "1px solid var(--border)" }}
              >
                Lead
              </Link>
              <Link
                to="/accounts"
                style={{ display: "block", padding: "12px 16px", borderBottom: "1px solid var(--border)" }}
              >
                Account
              </Link>
              <Link
                to="/contacts"
                style={{ display: "block", padding: "12px 16px", borderBottom: "1px solid var(--border)" }}
              >
                Contact
              </Link>
              <Link
                to="/opportunities"
                style={{ display: "block", padding: "12px 16px", borderBottom: "1px solid var(--border)" }}
              >
                Opportunity
              </Link>
              <Link to="/cases" style={{ display: "block", padding: "12px 16px" }}>
                Case
              </Link>
            </div>
          )}
        </div>

        <button
          style={{ padding: "8px" }}
          title="Help & Training"
          onClick={() => onShowToast("Help center: visit docs for guides and training.", "info")}
        >
          <HelpCircle size={20} />
        </button>

        <button
          style={{ padding: "8px", position: "relative" }}
          title="Notifications"
          onClick={() => onShowToast("You're all caught up. No new notifications.", "info")}
        >
          <Bell size={20} />
        </button>

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px" }}
          >
            <img
              src={state.user.avatar}
              alt={state.user.firstName}
              style={{ width: "32px", height: "32px", borderRadius: "50%" }}
            />
            <ChevronDown size={16} />
          </button>
          {showUserMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "8px",
                background: "white",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                boxShadow: "var(--shadow-lg)",
                minWidth: "200px",
                zIndex: 1001,
              }}
            >
              <div style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 600 }}>
                  {state.user.firstName} {state.user.lastName}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  {state.user.email}
                </div>
              </div>
              <button
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border)",
                }}
                onClick={() => {
                  setShowProfileModal(true);
                  setShowUserMenu(false);
                }}
              >
                My Profile
              </button>
              <button
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border)",
                }}
                onClick={() => {
                  setShowSettingsModal(true);
                  setShowUserMenu(false);
                }}
              >
                My Settings
              </button>
              <button
                style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 16px" }}
                onClick={() => {
                  clearUserCookie();
                  window.location.reload();
                }}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      <CreateModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Edit Profile"
        fields={profileFields}
        initialData={state.user}
        onSubmit={handleProfileSave}
        submitLabel="Save"
        submittingLabel="Saving..."
      />

      <CreateModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="User Settings"
        fields={settingsFields}
        initialData={state.user}
        onSubmit={handleSettingsSave}
        submitLabel="Save"
        submittingLabel="Saving..."
      />
    </nav>
  );
};
