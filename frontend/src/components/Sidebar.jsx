import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  FolderOpen,
  Home,
  LayoutDashboard,
  MessageSquare,
  Star,
  Target,
  UserCircle,
  Users,
} from "lucide-react";

export const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/leads", icon: Users, label: "Leads" },
    { path: "/accounts", icon: Building2, label: "Accounts" },
    { path: "/contacts", icon: UserCircle, label: "Contacts" },
    { path: "/opportunities", icon: Target, label: "Opportunities" },
    { path: "/cases", icon: FileText, label: "Cases" },
    { path: "/reports", icon: BarChart3, label: "Reports" },
    { path: "/dashboards", icon: LayoutDashboard, label: "Dashboards" },
    { path: "/calendar", icon: Calendar, label: "Calendar" },
    { path: "/files", icon: FolderOpen, label: "Files" },
    { path: "/chatter", icon: MessageSquare, label: "Chatter" },
  ];

  const recentItems = [
    { label: "Sarah Johnson", path: "/leads/lead-1" },
    { label: "Acme Corporation", path: "/accounts/account-1" },
    { label: "New Office Expansion", path: "/opportunities/opp-1" },
  ];

  const favorites = [
    { label: "My Leads", path: "/leads" },
    { label: "Top Opportunities", path: "/opportunities" },
  ];

  return (
    <aside
      style={{
        width: collapsed ? "60px" : "240px",
        background: "white",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s",
        position: "relative",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <div style={{ flex: 1, padding: "16px 0" }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                color: isActive ? "var(--primary)" : "var(--text-primary)",
                background: isActive ? "var(--hover)" : "transparent",
                textDecoration: "none",
                fontWeight: isActive ? 600 : 400,
                borderLeft: isActive ? "3px solid var(--primary)" : "3px solid transparent",
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {!collapsed && (
          <>
            <div
              style={{
                padding: "16px",
                borderTop: "1px solid var(--border)",
                marginTop: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                }}
              >
                <Star size={14} />
                Favorites
              </div>
              {favorites.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: "block",
                    padding: "8px 0",
                    color: "var(--text-primary)",
                    textDecoration: "none",
                    fontSize: "14px",
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div style={{ padding: "16px", borderTop: "1px solid var(--border)" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                }}
              >
                <Clock size={14} />
                Recent Items
              </div>
              {recentItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: "block",
                    padding: "8px 0",
                    color: "var(--text-primary)",
                    textDecoration: "none",
                    fontSize: "14px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <button
        onClick={onToggle}
        style={{
          position: "absolute",
          right: "-12px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "white",
          border: "1px solid var(--border)",
          borderRadius: "50%",
          width: "24px",
          height: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 10,
        }}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
};
