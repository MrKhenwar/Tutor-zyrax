import React, { useState, useEffect, useCallback } from 'react';
import { useTutorAuth } from './TutorAuthContext';
import axios from 'axios';

const TutorDashboard = () => {
  const { tutorLogout } = useTutorAuth();

  const [activeTab, setActiveTab] = useState('classes'); // classes or announcements
  const [platform, setPlatform] = useState('zyrax'); // zyrax or zylo

  // Classes state
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    platform: 'zyrax',
  });

  // Cancel class state
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancellingClass, setCancellingClass] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Edit class link state
  const [showEditLinkForm, setShowEditLinkForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [newZoomLink, setNewZoomLink] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const baseURL = 'https://api.zyrax.fit';

  // Get axios instance with auth headers
  const getAxiosConfig = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem('tutorAccessToken')}`,
    },
  });

  // Fetch classes
  const fetchClasses = useCallback(async () => {
    setLoadingClasses(true);
    setError('');
    try {
      const response = await axios.get(`${baseURL}/${platform}/classes/`, getAxiosConfig());
      setClasses(response.data);
    } catch (err) {
      setError(`Failed to load classes: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoadingClasses(false);
    }
  }, [platform]);

  // Fetch announcements
  const fetchAnnouncements = useCallback(async () => {
    setLoadingAnnouncements(true);
    setError('');
    try {
      const response = await axios.get(`${baseURL}/${platform}/announcements/my/`, getAxiosConfig());
      setAnnouncements(response.data);
    } catch (err) {
      setError(`Failed to load announcements: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoadingAnnouncements(false);
    }
  }, [platform]);

  // Load data when tab/platform changes
  useEffect(() => {
    if (activeTab === 'classes') {
      fetchClasses();
    } else {
      fetchAnnouncements();
    }
  }, [activeTab, platform, fetchClasses, fetchAnnouncements]);

  // Handle cancel class
  const handleCancelClass = async () => {
    if (!cancellingClass) return;

    try {
      await axios.post(
        `${baseURL}/${platform}/classes/${cancellingClass.id}/cancel/`,
        { reason: cancelReason },
        getAxiosConfig()
      );
      setSuccess('Class cancelled successfully!');
      setShowCancelForm(false);
      setCancellingClass(null);
      setCancelReason('');
      fetchClasses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to cancel class: ${err.response?.data?.error || err.message}`);
    }
  };

  // Handle update class link
  const handleUpdateClassLink = async () => {
    if (!editingClass || !newZoomLink) return;

    try {
      await axios.patch(
        `${baseURL}/${platform}/classes/${editingClass.id}/`,
        { zoom_link: newZoomLink },
        getAxiosConfig()
      );
      setSuccess('Class link updated successfully!');
      setShowEditLinkForm(false);
      setEditingClass(null);
      setNewZoomLink('');
      fetchClasses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to update link: ${err.response?.data?.error || err.message}`);
    }
  };

  // Handle create announcement
  const handleCreateAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.message) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await axios.post(
        `${baseURL}/${platform}/announcements/create/`,
        announcementForm,
        getAxiosConfig()
      );
      setSuccess('Announcement created successfully!');
      setShowAnnouncementForm(false);
      setAnnouncementForm({ title: '', message: '', platform: 'zyrax' });
      fetchAnnouncements();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to create announcement: ${err.response?.data?.error || err.message}`);
    }
  };

  // Handle delete announcement
  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await axios.delete(`${baseURL}/${platform}/announcements/${id}/`, getAxiosConfig());
      setSuccess('Announcement deleted successfully!');
      fetchAnnouncements();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to delete announcement: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>🎓 Tutor Dashboard</h1>
        <button onClick={tutorLogout} style={styles.logoutButton}>
          Logout
        </button>
      </header>

      {error && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

      {/* Tab Navigation */}
      <div style={styles.tabContainer}>
        <button
          onClick={() => setActiveTab('classes')}
          style={{
            ...styles.tab,
            ...(activeTab === 'classes' ? styles.activeTab : {}),
          }}
        >
          📚 Classes
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          style={{
            ...styles.tab,
            ...(activeTab === 'announcements' ? styles.activeTab : {}),
          }}
        >
          📢 Announcements
        </button>
      </div>

      {/* Platform Selection */}
      <div style={styles.platformContainer}>
        <button
          onClick={() => setPlatform('zyrax')}
          style={{
            ...styles.platformButton,
            ...(platform === 'zyrax' ? styles.activePlatform : {}),
          }}
        >
          Zyrax
        </button>
        <button
          onClick={() => setPlatform('zylo')}
          style={{
            ...styles.platformButton,
            ...(platform === 'zylo' ? styles.activePlatform : {}),
          }}
        >
          Zylo
        </button>
      </div>

      {/* Classes Tab */}
      {activeTab === 'classes' && (
        <div style={styles.section}>
          <h2>📚 Manage Classes</h2>
          {loadingClasses ? (
            <p>Loading classes...</p>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Title</th>
                    <th style={styles.th}>Date/Day</th>
                    <th style={styles.th}>Time</th>
                    <th style={styles.th}>Duration</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                        No classes found
                      </td>
                    </tr>
                  ) : (
                    classes.map((cls) => (
                      <tr key={cls.id} style={styles.tableRow}>
                        <td style={styles.td}>{cls.title}</td>
                        <td style={styles.td}>
                          {cls.is_weekly ? cls.weekday_name : new Date(cls.class_date).toLocaleDateString()}
                        </td>
                        <td style={styles.td}>{cls.time}</td>
                        <td style={styles.td}>{cls.duration} min</td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.badge,
                              backgroundColor: cls.is_cancelled ? '#f8d7da' : '#d4edda',
                              color: cls.is_cancelled ? '#721c24' : '#155724',
                            }}
                          >
                            {cls.is_cancelled ? 'Cancelled' : 'Active'}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actionButtons}>
                            {!cls.is_cancelled && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingClass(cls);
                                    setNewZoomLink(cls.zoom_link || '');
                                    setShowEditLinkForm(true);
                                  }}
                                  style={{ ...styles.smallButton, backgroundColor: '#17a2b8' }}
                                  title="Edit Link"
                                >
                                  🔗
                                </button>
                                <button
                                  onClick={() => {
                                    setCancellingClass(cls);
                                    setShowCancelForm(true);
                                  }}
                                  style={{ ...styles.smallButton, backgroundColor: '#dc3545' }}
                                  title="Cancel Class"
                                >
                                  ❌
                                </button>
                              </>
                            )}
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
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2>📢 Manage Announcements</h2>
            <button
              onClick={() => setShowAnnouncementForm(true)}
              style={{ ...styles.button, backgroundColor: '#28a745' }}
            >
              ➕ Create Announcement
            </button>
          </div>

          {loadingAnnouncements ? (
            <p>Loading announcements...</p>
          ) : (
            <div style={styles.announcementList}>
              {announcements.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666' }}>No announcements found</p>
              ) : (
                announcements.map((announcement) => (
                  <div key={announcement.id} style={styles.announcementCard}>
                    <div style={styles.announcementHeader}>
                      <h3 style={styles.announcementTitle}>{announcement.title}</h3>
                      <span style={styles.platformBadge}>{announcement.platform_display}</span>
                    </div>
                    <p style={styles.announcementMessage}>{announcement.message}</p>
                    <div style={styles.announcementFooter}>
                      <small style={{ color: '#666' }}>
                        {new Date(announcement.created_at).toLocaleString()}
                      </small>
                      <button
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        style={{ ...styles.smallButton, backgroundColor: '#dc3545' }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Cancel Class Modal */}
      {showCancelForm && cancellingClass && (
        <div style={styles.modal} onClick={() => setShowCancelForm(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>❌ Cancel Class</h3>
              <button onClick={() => setShowCancelForm(false)} style={styles.closeButton}>
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              <p>
                <strong>Class:</strong> {cancellingClass.title}
              </p>
              <label style={styles.label}>Cancellation Reason (Optional)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{ ...styles.input, minHeight: '100px' }}
                placeholder="Why is this class being cancelled?"
              />
              <button onClick={handleCancelClass} style={{ ...styles.button, width: '100%', backgroundColor: '#dc3545' }}>
                Cancel Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Link Modal */}
      {showEditLinkForm && editingClass && (
        <div style={styles.modal} onClick={() => setShowEditLinkForm(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>🔗 Edit Class Link</h3>
              <button onClick={() => setShowEditLinkForm(false)} style={styles.closeButton}>
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              <p>
                <strong>Class:</strong> {editingClass.title}
              </p>
              <label style={styles.label}>Zoom Link</label>
              <input
                type="url"
                value={newZoomLink}
                onChange={(e) => setNewZoomLink(e.target.value)}
                style={styles.input}
                placeholder="https://zoom.us/j/..."
              />
              <button onClick={handleUpdateClassLink} style={{ ...styles.button, width: '100%' }}>
                Update Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Announcement Modal */}
      {showAnnouncementForm && (
        <div style={styles.modal} onClick={() => setShowAnnouncementForm(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>📢 Create Announcement</h3>
              <button onClick={() => setShowAnnouncementForm(false)} style={styles.closeButton}>
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              <label style={styles.label}>Title *</label>
              <input
                type="text"
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                style={styles.input}
                placeholder="Announcement title"
              />

              <label style={styles.label}>Message *</label>
              <textarea
                value={announcementForm.message}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                style={{ ...styles.input, minHeight: '120px' }}
                placeholder="Announcement message"
              />

              <label style={styles.label}>Platform *</label>
              <select
                value={announcementForm.platform}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, platform: e.target.value })}
                style={styles.input}
              >
                <option value="zyrax">Zyrax Only</option>
                <option value="zylo">Zylo Only</option>
                <option value="both">Both Platforms</option>
              </select>

              <button onClick={handleCreateAnnouncement} style={{ ...styles.button, width: '100%', marginTop: '10px' }}>
                Create Announcement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f4f7f6',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  title: {
    color: '#333',
    margin: 0,
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  errorBox: {
    color: '#721c24',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  successBox: {
    color: '#155724',
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  tabContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '2px solid #dee2e6',
  },
  tab: {
    padding: '12px 24px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#666',
    borderBottom: '3px solid transparent',
  },
  activeTab: {
    color: '#007bff',
    borderBottom: '3px solid #007bff',
    fontWeight: 'bold',
  },
  platformContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  platformButton: {
    padding: '10px 20px',
    border: '2px solid #007bff',
    backgroundColor: 'white',
    color: '#007bff',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  activePlatform: {
    backgroundColor: '#007bff',
    color: 'white',
  },
  section: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '2px solid #dee2e6',
    fontWeight: 'bold',
  },
  tableRow: {
    borderBottom: '1px solid #dee2e6',
  },
  td: {
    padding: '12px',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  actionButtons: {
    display: 'flex',
    gap: '5px',
  },
  smallButton: {
    padding: '6px 10px',
    borderRadius: '6px',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
  button: {
    padding: '12px 20px',
    borderRadius: '8px',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    backgroundColor: '#007bff',
    fontWeight: '600',
  },
  announcementList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  announcementCard: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
  },
  announcementHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  announcementTitle: {
    margin: 0,
    color: '#333',
  },
  platformBadge: {
    padding: '4px 8px',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  announcementMessage: {
    margin: '10px 0',
    color: '#666',
  },
  announcementFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '10px',
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
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #dee2e6',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
  },
  modalBody: {
    padding: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    marginTop: '12px',
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid #007bff',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
  },
};

export default TutorDashboard;
