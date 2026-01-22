import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useApp } from "../context/AppContext";

export const SearchBox = ({ onShowToast }) => {
  const { state } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const performSearch = (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const lowerQuery = searchQuery.toLowerCase();

      const searchResults = [
        ...(state.leads || [])
          .filter(
            (lead) =>
              `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(lowerQuery) ||
              lead.company.toLowerCase().includes(lowerQuery) ||
              lead.email.toLowerCase().includes(lowerQuery)
          )
          .map((lead) => ({
            type: "Lead",
            path: `/leads/${lead.leadId}`,
            name: `${lead.firstName} ${lead.lastName}`,
            subtitle: lead.company,
          })),

        ...(state.accounts || [])
          .filter((account) => account.name.toLowerCase().includes(lowerQuery))
          .map((account) => ({
            type: "Account",
            path: `/accounts/${account.accountId}`,
            name: account.name,
            subtitle: account.type,
          })),

        ...(state.contacts || [])
          .filter(
            (contact) =>
              `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(lowerQuery) ||
              contact.email.toLowerCase().includes(lowerQuery)
          )
          .map((contact) => ({
            type: "Contact",
            path: `/contacts/${contact.contactId}`,
            name: `${contact.firstName} ${contact.lastName}`,
            subtitle:
              state.accounts.find((account) => account.accountId === contact.accountId)?.name ||
              "No Account",
          })),

        ...(state.opportunities || [])
          .filter((opp) => opp.name.toLowerCase().includes(lowerQuery))
          .map((opp) => ({
            type: "Opportunity",
            path: `/opportunities/${opp.opportunityId}`,
            name: opp.name,
            subtitle: `$${(opp.amount / 1000).toFixed(0)}K - ${opp.stage}`,
          })),
      ];

      setResults(searchResults);
      setShowResults(searchResults.length > 0);
      setLoading(false);
    }, 150);
  };

  const handleResultClick = (result) => {
    navigate(result.path);
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setShowResults(false);
      setQuery("");
    } else if (event.key === "Enter" && query.trim()) {
      if (results.length > 0) {
        handleResultClick(results[0]);
      } else {
        onShowToast("No results found", "info");
      }
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <div
      ref={searchRef}
      style={{
        flex: 1,
        maxWidth: "600px",
        position: "relative",
        margin: "0 16px",
      }}
    >
      <Search
        size={18}
        style={{
          position: "absolute",
          left: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--text-secondary)",
          zIndex: 1,
        }}
      />

      {query && (
        <button
          onClick={clearSearch}
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-secondary)",
            zIndex: 1,
          }}
        >
          <X size={16} />
        </button>
      )}

      <input
        type="text"
        placeholder="Search CloudCRM (press Enter)"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          performSearch(event.target.value);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setShowResults(true)}
        className="form-input"
        style={{
          paddingLeft: "40px",
          paddingRight: query ? "40px" : "12px",
          width: "100%",
          zIndex: 0,
        }}
      />

      {showResults && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            background: "white",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            boxShadow: "var(--shadow-lg)",
            maxHeight: "400px",
            overflowY: "auto",
            zIndex: 1001,
          }}
        >
          {loading ? (
            <div style={{ padding: "20px", textAlign: "center" }}>
              <div
                className="spinner"
                style={{ margin: "0 auto 8px", width: "24px", height: "24px" }}
              />
              <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Searching...</p>
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>
              <p>No results found for "{query}"</p>
              <p style={{ fontSize: "12px", marginTop: "8px" }}>
                Try searching for names, companies, or emails
              </p>
            </div>
          ) : (
            <div>
              <div
                style={{
                  padding: "8px 12px",
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {results.length} result{results.length === 1 ? "" : "s"} found
              </div>
              {results.map((result, index) => (
                <button
                  key={`${result.path}-${index}`}
                  onClick={() => handleResultClick(result)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "12px",
                    border: "none",
                    background: index % 2 === 0 ? "white" : "var(--bg)",
                    cursor: "pointer",
                    borderBottom: index < results.length - 1 ? "1px solid var(--border)" : "none",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background = "var(--hover)";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = index % 2 === 0 ? "white" : "var(--bg)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        background: "var(--primary)",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: "600",
                        textTransform: "uppercase",
                      }}
                    >
                      {result.type}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "600", fontSize: "14px" }}>{result.name}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        {result.subtitle}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
