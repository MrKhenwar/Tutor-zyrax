import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import api from "./api";

const SubscriptionExtension = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // State for active tab (Zyrax or Zylo)
  const [activeTab, setActiveTab] = useState("zyrax");

  // State for user search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // State for selected user
  const [selectedUser, setSelectedUser] = useState(null);

  // State for extension
  const [extendingUser, setExtendingUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);

  // Get base URL based on active tab
  const getBaseUrl = () => activeTab === "zyrax" ? "/zyrax" : "/zylo";

  // Search users
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError("Please enter a username to search");
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setSelectedUser(null);

    try {
      const response = await api.get(`${getBaseUrl()}/admin/users/`);
      const users = response.data;

      // Filter users by search query
      const filtered = users.filter(user =>
        (user.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.phone_number || "").includes(searchQuery)
      );

      setSearchResults(filtered);

      if (filtered.length === 0) {
        setSearchError("No users found matching your search");
      }
    } catch (err) {
      setSearchError(`Failed to search users: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  // Select user
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchResults([]);
    setSearchQuery(user.username);
  };

  // Extend subscription
  const handleExtendSubscription = async (days) => {
    if (!selectedUser) {
      setError("Please select a user first");
      return;
    }

    setExtendingUser(selectedUser.username);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await api.post(`${getBaseUrl()}/admin/subscriptions/extend/`, {
        username: selectedUser.username,
        days_to_add: days
      });

      setSuccessMessage(
        `✅ Successfully extended subscription for ${selectedUser.username} by ${days} days!\n` +
        `New end date: ${new Date(response.data.new_end_date).toLocaleDateString()}`
      );

      // Clear search after successful extension
      setTimeout(() => {
        setSelectedUser(null);
        setSearchQuery("");
        setSuccessMessage(null);
      }, 4000);

    } catch (err) {
      setError(`Failed to extend subscription: ${err.response?.data?.error || err.message}`);
    } finally {
      setExtendingUser(null);
    }
  };

  // Extension button configurations
  const extensionOptions = [
    { days: 5, label: "5 Days", color: "#17a2b8" },
    { days: 10, label: "10 Days", color: "#28a745" },
    { days: 15, label: "15 Days", color: "#ffc107" },
    { days: 30, label: "30 Days", color: "#007bff" },
    { days: 45, label: "45 Days", color: "#6f42c1" },
    { days: 60, label: "60 Days", color: "#e83e8c" },
    { days: 90, label: "90 Days", color: "#fd7e14" },
  ];

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>⏰ Subscription Extension</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/')} style={styles.backButton}>
            ← Back to Dashboard
          </button>
          <button onClick={logout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      {error && <div style={styles.errorBox}>{error}</div>}
      {successMessage && <div style={styles.successBox}>{successMessage}</div>}

      {/* Tab Navigation */}
      <div style={styles.tabContainer}>
        <button
          onClick={() => {
            setActiveTab("zyrax");
            setSearchQuery("");
            setSelectedUser(null);
            setSearchResults([]);
          }}
          style={{
            ...styles.tab,
            ...(activeTab === "zyrax" ? styles.activeTab : {}),
          }}
        >
          Zyrax Subscriptions
        </button>
        <button
          onClick={() => {
            setActiveTab("zylo");
            setSearchQuery("");
            setSelectedUser(null);
            setSearchResults([]);
          }}
          style={{
            ...styles.tab,
            ...(activeTab === "zylo" ? styles.activeTab : {}),
          }}
        >
          Zylo Subscriptions
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2>🔍 Search & Extend {activeTab === "zyrax" ? "Zyrax" : "Zylo"} Subscription</h2>
        </div>

        {/* Search Section */}
        <div style={styles.searchSection}>
          <div style={styles.searchInputContainer}>
            <input
              type="text"
              placeholder="Enter username, name, or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              style={styles.input}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              style={{ ...styles.button, backgroundColor: '#007bff', minWidth: '120px' }}
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </div>

          {searchError && (
            <div style={{ ...styles.infoBox, color: '#856404', backgroundColor: '#fff3cd', borderColor: '#ffeeba' }}>
              {searchError}
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div style={styles.resultsContainer}>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>
              Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''}
            </h3>
            <div style={styles.resultsGrid}>
              {searchResults.map(user => (
                <div
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  style={styles.userCard}
                >
                  <div style={styles.userCardHeader}>
                    <strong>{user.full_name || user.username}</strong>
                  </div>
                  <div style={styles.userCardBody}>
                    <small style={{ color: '#666' }}>@{user.username}</small>
                    <br />
                    <small style={{ color: '#666' }}>{user.phone_number}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected User & Extension Options */}
        {selectedUser && !searchResults.length && (
          <div style={styles.extensionContainer}>
            <div style={styles.selectedUserBox}>
              <h3 style={{ margin: '0 0 10px 0', color: '#155724' }}>Selected User</h3>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>
                {selectedUser.full_name || selectedUser.username}
              </div>
              <div style={{ color: '#666' }}>
                <div>Username: @{selectedUser.username}</div>
                <div>Phone: {selectedUser.phone_number}</div>
              </div>
            </div>

            <div style={styles.extensionButtonsContainer}>
              <h3 style={{ marginBottom: '20px', textAlign: 'center', color: '#333' }}>
                Select Extension Duration
              </h3>
              <div style={styles.extensionButtonsGrid}>
                {extensionOptions.map(option => (
                  <button
                    key={option.days}
                    onClick={() => handleExtendSubscription(option.days)}
                    disabled={extendingUser === selectedUser.username}
                    style={{
                      ...styles.extensionButton,
                      backgroundColor: option.color,
                      cursor: extendingUser ? 'not-allowed' : 'pointer',
                      opacity: extendingUser ? 0.6 : 1
                    }}
                  >
                    {extendingUser === selectedUser.username ? "Extending..." : `+ ${option.label}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!selectedUser && !searchResults.length && !searchError && (
          <div style={styles.instructionsBox}>
            <h3 style={{ marginTop: 0 }}>📝 Instructions</h3>
            <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>Enter the username, name, or phone number in the search box above</li>
              <li>Click "Search" or press Enter to find matching users</li>
              <li>Click on a user from the search results to select them</li>
              <li>Choose the number of days to extend their subscription</li>
              <li>The subscription end date will be automatically extended</li>
            </ol>
            <p style={{ marginTop: '15px', color: '#666', fontStyle: 'italic' }}>
              💡 This feature works for active {activeTab === "zyrax" ? "Zyrax" : "Zylo"} subscriptions only.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Styles
const styles = {
  page: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f4f7f6',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    gap: '15px'
  },
  title: {
    color: '#333',
    margin: 0,
    fontSize: 'clamp(1.5rem, 4vw, 2rem)'
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap'
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    whiteSpace: 'nowrap'
  },
  errorBox: {
    color: '#721c24',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
    whiteSpace: 'pre-line'
  },
  successBox: {
    color: '#155724',
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
    whiteSpace: 'pre-line'
  },
  infoBox: {
    padding: '12px',
    borderRadius: '8px',
    marginTop: '15px',
    border: '1px solid',
  },
  tabContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    borderBottom: '2px solid #dee2e6'
  },
  tab: {
    padding: '12px 24px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#666',
    borderBottom: '3px solid transparent',
    transition: 'all 0.3s'
  },
  activeTab: {
    color: '#007bff',
    borderBottom: '3px solid #007bff',
    fontWeight: 'bold'
  },
  section: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
  },
  sectionHeader: {
    marginBottom: '25px'
  },
  searchSection: {
    marginBottom: '30px'
  },
  searchInputContainer: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  input: {
    flex: 1,
    minWidth: '250px',
    padding: '12px 15px',
    borderRadius: '8px',
    border: '2px solid #007bff',
    fontSize: '16px',
    boxSizing: 'border-box',
    outline: 'none'
  },
  button: {
    padding: '12px 20px',
    borderRadius: '8px',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  resultsContainer: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  resultsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '15px'
  },
  userCard: {
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '2px solid #007bff',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }
  },
  userCardHeader: {
    marginBottom: '8px',
    fontSize: '16px'
  },
  userCardBody: {
    fontSize: '14px'
  },
  extensionContainer: {
    marginTop: '30px'
  },
  selectedUserBox: {
    padding: '20px',
    backgroundColor: '#d4edda',
    borderRadius: '8px',
    border: '1px solid #c3e6cb',
    marginBottom: '30px'
  },
  extensionButtonsContainer: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  extensionButtonsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '15px'
  },
  extensionButton: {
    padding: '20px 15px',
    borderRadius: '8px',
    border: 'none',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'transform 0.2s, opacity 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  },
  instructionsBox: {
    marginTop: '30px',
    padding: '25px',
    backgroundColor: '#e7f3ff',
    borderRadius: '8px',
    border: '1px solid #b3d9ff'
  }
};

export default SubscriptionExtension;
