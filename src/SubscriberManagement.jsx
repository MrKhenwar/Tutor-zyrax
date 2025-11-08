import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import api from "./api";

const SubscriberManagement = () => {
  const navigate = useNavigate();
  // State for active tab (Zyrax or Zylo)
  const [activeTab, setActiveTab] = useState("zyrax");

  // State for subscribers
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // State for search/filter with debouncing
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, inactive

  // State for offers (for dropdown)
  const [offers, setOffers] = useState([]);

  // State for users (for subscriber creation)
  const [users, setUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // State for Add/Edit Subscriber Form
  const [showSubscriberForm, setShowSubscriberForm] = useState(false);
  const [editingSubscriberId, setEditingSubscriberId] = useState(null);
  const [isCreatingNewUser, setIsCreatingNewUser] = useState(false);
  const [subscriberForm, setSubscriberForm] = useState({
    user_id: "",
    offer_id: "",
    amount_paid: "",
    start_date: new Date().toISOString().split('T')[0], // Today's date
    end_date: "",
  });

  // State for new user creation
  const [newUserForm, setNewUserForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    password: "",
    confirm_password: "",
  });

  // State for Password Change Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    user_id: "",
    username: "",
    new_password: "",
    confirm_password: "",
  });

  const { logout } = useAuth();

  // Helper to show success messages
  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Get base URL based on active tab
  const getBaseUrl = () => activeTab === "zyrax" ? "/zyrax" : "/zylo";

  // Fetch subscribers
  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const baseUrl = activeTab === "zyrax" ? "/zyrax" : "/zylo";
    try {
      const response = await api.get(`${baseUrl}/admin/subscriptions/`);
      console.log('Fetched subscribers:', response.data);
      setSubscribers(response.data);
    } catch (err) {
      console.error('Error fetching subscribers:', err);
      setError(`Failed to fetch subscribers: ${err.response?.data?.error || err.message}`);
      setSubscribers([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Fetch offers
  const fetchOffers = useCallback(async () => {
    const baseUrl = activeTab === "zyrax" ? "/zyrax" : "/zylo";
    try {
      const response = await api.get(`${baseUrl}/admin/offers/`);
      setOffers(response.data);
    } catch (err) {
      console.error("Failed to fetch offers:", err);
    }
  }, [activeTab]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    const baseUrl = activeTab === "zyrax" ? "/zyrax" : "/zylo";
    try {
      const response = await api.get(`${baseUrl}/admin/users/`);
      setUsers(response.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      // Don't show error to user, just log it
    }
  }, [activeTab]);

  // Load data when tab changes
  useEffect(() => {
    fetchSubscribers();
    fetchOffers();
    fetchUsers();
  }, [activeTab, fetchSubscribers, fetchOffers, fetchUsers]);

  // Debounce search query - wait 300ms after user stops typing
  useEffect(() => {
    if (searchQuery !== debouncedSearchQuery) {
      setIsSearching(true);
    }

    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Filter users for search
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) {
      return users.slice(0, 50);
    }
    return users.filter(user => {
      const username = user.username || "";
      const fullName = user.full_name || "";
      const searchTerm = userSearchQuery.toLowerCase();
      return username.toLowerCase().includes(searchTerm) ||
             fullName.toLowerCase().includes(searchTerm);
    }).slice(0, 100);
  }, [users, userSearchQuery]);

  // Filter subscribers (using debounced search query)
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter(sub => {
      const matchesSearch = debouncedSearchQuery.trim() === "" ||
        (sub.user?.username || "").toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        (sub.user?.full_name || "").toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        (sub.user?.phone_number || "").includes(debouncedSearchQuery);

      const matchesStatus =
        statusFilter === "all" ? true :
        statusFilter === "active" ? sub.is_active :
        !sub.is_active;

      return matchesSearch && matchesStatus;
    });
  }, [subscribers, debouncedSearchQuery, statusFilter]);

  // Handle add new subscriber
  const handleAddSubscriber = () => {
    setEditingSubscriberId(null);
    setIsCreatingNewUser(false);
    setSubscriberForm({
      user_id: "",
      offer_id: "",
      amount_paid: "",
      start_date: new Date().toISOString().split('T')[0],
      end_date: "",
    });
    setNewUserForm({
      username: "",
      first_name: "",
      last_name: "",
      phone_number: "",
      password: "",
      confirm_password: "",
    });
    setShowSubscriberForm(true);
  };

  // Handle edit subscriber
  const handleEditSubscriber = (sub) => {
    setEditingSubscriberId(sub.id);
    setIsCreatingNewUser(false);
    setSubscriberForm({
      user_id: sub.user.id,
      offer_id: sub.offer.id,
      amount_paid: sub.amount_paid,
      start_date: sub.start_date.split('T')[0],
      end_date: sub.end_date.split('T')[0],
    });
    setShowSubscriberForm(true);
  };

  // Handle save subscriber (create or update)
  const handleSaveSubscriber = async () => {
    // Validation for creating new user
    if (!editingSubscriberId && isCreatingNewUser) {
      if (!newUserForm.username || !newUserForm.phone_number || !newUserForm.password) {
        setError("Please fill in username, phone number, and password for the new user");
        return;
      }
      if (newUserForm.password !== newUserForm.confirm_password) {
        setError("Passwords do not match");
        return;
      }
      if (newUserForm.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    }

    // Validation for selecting existing user or editing
    if (!isCreatingNewUser && !subscriberForm.user_id) {
      setError("Please select a user");
      return;
    }

    if (!subscriberForm.offer_id || !subscriberForm.amount_paid) {
      setError("Please fill in all required fields");
      return;
    }

    setError(null);
    try {
      if (editingSubscriberId) {
        // Update existing subscription
        const updateData = {
          offer_id: subscriberForm.offer_id,
          amount_paid: subscriberForm.amount_paid,
          start_date: subscriberForm.start_date,
        };

        // Include end_date if provided
        if (subscriberForm.end_date) {
          updateData.end_date = subscriberForm.end_date;
        }

        await api.put(`${getBaseUrl()}/admin/subscriptions/${editingSubscriberId}/update/`, updateData);
        showSuccessMessage("Subscription updated successfully!");
      } else {
        let userId = subscriberForm.user_id;

        // Create new user if in "create new user" mode
        if (isCreatingNewUser) {
          try {
            const newUserResponse = await api.post(`${getBaseUrl()}/admin/register/`, {
              phone_number: newUserForm.phone_number,
              first_name: newUserForm.first_name,
              last_name: newUserForm.last_name,
              password: newUserForm.password,
            });

            // Get the new user ID from the response
            userId = newUserResponse.data.user_id;

            if (!userId) {
              // If user_id is not in response, fetch users again and find by phone number
              const usersResponse = await api.get(`${getBaseUrl()}/admin/users/`);
              const newUser = usersResponse.data.find(u => u.phone_number === newUserForm.phone_number);
              userId = newUser?.id;
            }

            showSuccessMessage(`New user created: ${newUserForm.phone_number}`);
          } catch (userErr) {
            setError(`Failed to create user: ${userErr.response?.data?.error || userErr.response?.data?.detail || userErr.message}`);
            return;
          }
        }

        // Create subscription
        await api.post(`${getBaseUrl()}/admin/subscriptions/create/`, {
          ...subscriberForm,
          user_id: userId,
        });
        showSuccessMessage("Subscription created successfully!");
      }

      setShowSubscriberForm(false);
      fetchSubscribers();
      fetchUsers(); // Refresh users list if new user was created
    } catch (err) {
      setError(`Failed to save subscription: ${err.response?.data?.error || err.response?.data?.detail || err.message}`);
    }
  };

  // Handle deactivate subscriber
  const handleDeactivate = async (id, username) => {
    if (!window.confirm(`Are you sure you want to deactivate subscription for ${username}?`)) {
      return;
    }

    try {
      await api.delete(`${getBaseUrl()}/admin/subscriptions/${id}/deactivate/`);
      showSuccessMessage("Subscription deactivated successfully!");
      fetchSubscribers();
    } catch (err) {
      setError(`Failed to deactivate: ${err.response?.data?.error || err.message}`);
    }
  };

  // Handle show password modal
  const handleShowPasswordModal = (user) => {
    setPasswordForm({
      user_id: user.id,
      username: user.username,
      new_password: "",
      confirm_password: "",
    });
    setShowPasswordModal(true);
  };

  // Handle change password
  const handleChangePassword = async () => {
    if (!passwordForm.new_password || !passwordForm.confirm_password) {
      setError("Please fill in both password fields");
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setError(null);
    try {
      await api.post(`${getBaseUrl()}/admin/users/${passwordForm.user_id}/change-password/`, {
        new_password: passwordForm.new_password,
      });
      showSuccessMessage(`Password changed for ${passwordForm.username}`);
      setShowPasswordModal(false);
    } catch (err) {
      setError(`Failed to change password: ${err.response?.data?.error || err.message}`);
    }
  };

  // Get status badge color
  const getStatusColor = (sub) => {
    if (!sub.is_active) return '#dc3545'; // Red
    if (sub.days_remaining <= 7) return '#ffc107'; // Yellow
    return '#28a745'; // Green
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>👥 Subscriber Management</h1>
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
          onClick={() => setActiveTab("zyrax")}
          style={{
            ...styles.tab,
            ...(activeTab === "zyrax" ? styles.activeTab : {}),
          }}
        >
          Zyrax Subscribers
        </button>
        <button
          onClick={() => setActiveTab("zylo")}
          style={{
            ...styles.tab,
            ...(activeTab === "zylo" ? styles.activeTab : {}),
          }}
        >
          Zylo Subscribers
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2>📋 {activeTab === "zyrax" ? "Zyrax" : "Zylo"} Subscriptions</h2>
          <button
            onClick={handleAddSubscriber}
            style={{ ...styles.button, backgroundColor: "#28a745" }}
          >
            ➕ Add Subscriber
          </button>
        </div>

        {/* Search and Filter */}
        <div style={styles.filterContainer}>
          <div style={{ flex: 2, position: 'relative' }}>
            <input
              type="text"
              placeholder="🔍 Search by name, username, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.input}
            />
            {isSearching && (
              <span style={styles.searchingIndicator}>Searching...</span>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ ...styles.input, minWidth: '200px', flex: '1' }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {/* Subscribers Table */}
        {loading ? (
          <p>Loading subscribers...</p>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>User</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Offer</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Start Date</th>
                  <th style={styles.th}>End Date</th>
                  <th style={styles.th}>Days Left</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscribers.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>
                      No subscribers found
                    </td>
                  </tr>
                ) : (
                  filteredSubscribers.map((sub) => (
                    <tr key={sub.id} style={styles.tableRow}>
                      <td style={styles.td}>
                        <strong>{sub.user?.full_name || sub.user?.username || 'N/A'}</strong>
                        <br />
                        <small style={{ color: '#666' }}>{sub.user?.username || 'N/A'}</small>
                      </td>
                      <td style={styles.td}>{sub.user?.phone_number || 'N/A'}</td>
                      <td style={styles.td}>
                        {sub.offer?.title || 'N/A'}
                        <br />
                        <small style={{ color: '#666' }}>
                          ({sub.offer?.duration || 0} days)
                        </small>
                      </td>
                      <td style={styles.td}>₹{sub.amount_paid || 0}</td>
                      <td style={styles.td}>
                        {new Date(sub.start_date).toLocaleDateString()}
                      </td>
                      <td style={styles.td}>
                        {new Date(sub.end_date).toLocaleDateString()}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          fontWeight: 'bold',
                          color: getStatusColor(sub)
                        }}>
                          {sub.days_remaining}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor: sub.is_active ? '#d4edda' : '#f8d7da',
                            color: sub.is_active ? '#155724' : '#721c24',
                          }}
                        >
                          {sub.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button
                            onClick={() => handleEditSubscriber(sub)}
                            style={{ ...styles.smallButton, backgroundColor: '#ffc107' }}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          {sub.is_active && (
                            <button
                              onClick={() => handleDeactivate(sub.id, sub.user.username)}
                              style={{ ...styles.smallButton, backgroundColor: '#dc3545' }}
                              title="Deactivate"
                            >
                              ❌
                            </button>
                          )}
                          <button
                            onClick={() => handleShowPasswordModal(sub.user)}
                            style={{ ...styles.smallButton, backgroundColor: '#17a2b8' }}
                            title="Change Password"
                          >
                            🔑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Subscriber Modal */}
      {showSubscriberForm && (
        <div style={styles.modal} onClick={() => setShowSubscriberForm(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>{editingSubscriberId ? 'Edit Subscription' : 'Add New Subscriber'}</h3>
              <button onClick={() => setShowSubscriberForm(false)} style={styles.closeButton}>
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              {!editingSubscriberId && (
                <>
                  {/* Toggle between Select User and Create New User */}
                  <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => setIsCreatingNewUser(false)}
                      style={{
                        ...styles.button,
                        flex: 1,
                        backgroundColor: !isCreatingNewUser ? '#007bff' : '#6c757d'
                      }}
                    >
                      Select Existing User
                    </button>
                    <button
                      onClick={() => setIsCreatingNewUser(true)}
                      style={{
                        ...styles.button,
                        flex: 1,
                        backgroundColor: isCreatingNewUser ? '#28a745' : '#6c757d'
                      }}
                    >
                      Create New User
                    </button>
                  </div>

                  {isCreatingNewUser ? (
                    /* New User Form */
                    <>
                      <label style={styles.label}>Phone Number (Username) *</label>
                      <input
                        type="text"
                        placeholder="10-digit phone number"
                        value={newUserForm.phone_number}
                        onChange={(e) =>
                          setNewUserForm({ ...newUserForm, phone_number: e.target.value, username: e.target.value })
                        }
                        style={styles.input}
                      />

                      <label style={styles.label}>First Name</label>
                      <input
                        type="text"
                        placeholder="First Name"
                        value={newUserForm.first_name}
                        onChange={(e) =>
                          setNewUserForm({ ...newUserForm, first_name: e.target.value })
                        }
                        style={styles.input}
                      />

                      <label style={styles.label}>Last Name</label>
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={newUserForm.last_name}
                        onChange={(e) =>
                          setNewUserForm({ ...newUserForm, last_name: e.target.value })
                        }
                        style={styles.input}
                      />

                      <label style={styles.label}>Password *</label>
                      <input
                        type="password"
                        placeholder="At least 6 characters"
                        value={newUserForm.password}
                        onChange={(e) =>
                          setNewUserForm({ ...newUserForm, password: e.target.value })
                        }
                        style={styles.input}
                      />

                      <label style={styles.label}>Confirm Password *</label>
                      <input
                        type="password"
                        placeholder="Re-enter password"
                        value={newUserForm.confirm_password}
                        onChange={(e) =>
                          setNewUserForm({ ...newUserForm, confirm_password: e.target.value })
                        }
                        style={styles.input}
                      />
                    </>
                  ) : (
                    /* Select Existing User Form */
                    <>
                      <label style={styles.label}>Search User *</label>
                      <input
                        type="text"
                        placeholder="🔍 Search users by username..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        style={styles.input}
                      />
                      <label style={styles.label}>Select User *</label>
                      <select
                        value={subscriberForm.user_id}
                        onChange={(e) =>
                          setSubscriberForm({ ...subscriberForm, user_id: e.target.value })
                        }
                        style={styles.input}
                      >
                        <option value="">-- Select User --</option>
                        {filteredUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.full_name || user.username} ({user.username})
                          </option>
                        ))}
                      </select>
                      {!userSearchQuery && users.length > 50 && (
                        <small style={{ color: '#666', display: 'block', marginBottom: '10px' }}>
                          Showing first 50 users. Use search to find more.
                        </small>
                      )}
                    </>
                  )}
                </>
              )}

              <label style={styles.label}>Select Offer *</label>
              <select
                value={subscriberForm.offer_id}
                onChange={(e) =>
                  setSubscriberForm({ ...subscriberForm, offer_id: e.target.value })
                }
                style={styles.input}
              >
                <option value="">-- Select Offer --</option>
                {offers.map((offer) => (
                  <option key={offer.id} value={offer.id}>
                    {offer.title} - ₹{offer.amount} ({offer.duration} days)
                  </option>
                ))}
              </select>

              <label style={styles.label}>Amount Paid *</label>
              <input
                type="number"
                placeholder="Amount Paid"
                value={subscriberForm.amount_paid}
                onChange={(e) =>
                  setSubscriberForm({ ...subscriberForm, amount_paid: e.target.value })
                }
                style={styles.input}
              />

              <label style={styles.label}>Start Date *</label>
              <input
                type="date"
                value={subscriberForm.start_date}
                onChange={(e) =>
                  setSubscriberForm({ ...subscriberForm, start_date: e.target.value })
                }
                style={styles.input}
              />

              <label style={styles.label}>End Date (Optional - leave blank to auto-calculate)</label>
              <input
                type="date"
                value={subscriberForm.end_date}
                onChange={(e) =>
                  setSubscriberForm({ ...subscriberForm, end_date: e.target.value })
                }
                style={styles.input}
              />

              <button
                onClick={handleSaveSubscriber}
                style={{ ...styles.button, width: '100%', marginTop: '10px' }}
              >
                {editingSubscriberId ? 'Update Subscription' : 'Create Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div style={styles.modal} onClick={() => setShowPasswordModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>🔑 Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} style={styles.closeButton}>
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              <p style={{ marginBottom: '15px', color: '#666' }}>
                Changing password for: <strong>{passwordForm.username}</strong>
              </p>

              <label style={styles.label}>New Password *</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={passwordForm.new_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, new_password: e.target.value })
                }
                style={styles.input}
              />

              <label style={styles.label}>Confirm Password *</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwordForm.confirm_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
                }
                style={styles.input}
              />

              <small style={{ display: 'block', color: '#666', marginBottom: '15px' }}>
                Password must be at least 6 characters
              </small>

              <button
                onClick={handleChangePassword}
                style={{ ...styles.button, width: '100%', backgroundColor: '#17a2b8' }}
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}
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
    textAlign: 'center'
  },
  successBox: {
    color: '#155724',
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center'
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
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
  },
  sectionHeader: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    gap: '10px'
  },
  filterContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
    marginBottom: '20px'
  },
  input: {
    padding: '12px 15px',
    borderRadius: '8px',
    border: '2px solid #007bff',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
    outline: 'none',
    transition: 'border-color 0.3s'
  },
  searchingIndicator: {
    position: 'absolute',
    right: '15px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#007bff',
    fontSize: '12px',
    fontStyle: 'italic'
  },
  button: {
    padding: '12px 20px',
    borderRadius: '8px',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    backgroundColor: '#007bff',
    whiteSpace: 'nowrap',
    fontWeight: '600'
  },
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    backgroundColor: '#f8f9fa'
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '2px solid #dee2e6',
    fontWeight: 'bold',
    color: '#333'
  },
  tableRow: {
    borderBottom: '1px solid #dee2e6',
    transition: 'background-color 0.2s'
  },
  td: {
    padding: '12px'
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  actionButtons: {
    display: 'flex',
    gap: '5px'
  },
  smallButton: {
    padding: '6px 10px',
    borderRadius: '6px',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #dee2e6'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666'
  },
  modalBody: {
    padding: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    marginTop: '12px',
    fontWeight: 'bold',
    color: '#333',
    fontSize: '15px'
  },
};

// Add media query styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @media (max-width: 768px) {
    /* Make filter container stack vertically on mobile */
    div[style*="filterContainer"] > div {
      min-width: 100% !important;
    }

    /* Make section header stack on mobile */
    div[style*="sectionHeader"] {
      flex-direction: column !important;
      align-items: flex-start !important;
    }

    /* Make action buttons stack better */
    div[style*="actionButtons"] {
      flex-wrap: wrap !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default SubscriberManagement;
