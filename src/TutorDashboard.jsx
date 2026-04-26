import React, { useState, useEffect, useCallback } from 'react';
import { useTutorAuth } from './TutorAuthContext';
import axios from 'axios';

const TutorDashboard = () => {
  const { tutorLogout } = useTutorAuth();

  const [activeTab, setActiveTab] = useState('classes');
  const [platform, setPlatform] = useState('zyrax');

  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    platform: 'zyrax',
  });

  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancellingClass, setCancellingClass] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const [showEditLinkForm, setShowEditLinkForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [newZoomLink, setNewZoomLink] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const baseURL = 'https://api.zyrax.fit';

  const getAxiosConfig = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem('tutorAccessToken')}`,
    },
  });

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

  useEffect(() => {
    if (activeTab === 'classes') {
      fetchClasses();
    } else {
      fetchAnnouncements();
    }
  }, [activeTab, platform, fetchClasses, fetchAnnouncements]);

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
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>🎓 Tutor Dashboard</h1>
        <div style={styles.headerButtons}>
          <button
            onClick={() => (window.location.href = '/zoom-classes')}
            style={styles.zoomButton}
          >
            🎥 Zoom Classes
          </button>
          <button onClick={tutorLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      {error && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

      {/* Controls row: tabs + platform selector side by side */}
      <div style={styles.controlsRow}>
        <div style={styles.tabContainer}>
          <button
            onClick={() => setActiveTab('classes')}
            style={{ ...styles.tab, ...(activeTab === 'classes' ? styles.activeTab : {}) }}
          >
            📚 Classes
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            style={{ ...styles.tab, ...(activeTab === 'announcements' ? styles.activeTab : {}) }}
          >
            📢 Announcements
          </button>
        </div>

        <div style={styles.platformContainer}>
          <span style={styles.platformLabel}>Platform:</span>
          <button
            onClick={() => setPlatform('zyrax')}
            style={{ ...styles.platformButton, ...(platform === 'zyrax' ? styles.activePlatform : {}) }}
          >
            Zyrax
          </button>
          <button
            onClick={() => setPlatform('zylo')}
            style={{ ...styles.platformButton, ...(platform === 'zylo' ? styles.activePlatform : {}) }}
          >
            Zylo
          </button>
        </div>
      </div>

      {/* Classes Tab */}
      {activeTab === 'classes' && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>📚 Manage Classes</h2>
          </div>
          {loadingClasses ? (
            <p style={styles.loadingText}>Loading classes...</p>
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
                      <td colSpan="6" style={styles.emptyCell}>No classes found</td>
                    </tr>
                  ) : (
                    classes.map((cls) => (
                      <tr key={cls.id} style={styles.tableRow}>
                        <td style={styles.td}>{cls.title}</td>
                        <td style={styles.td}>
                          {cls.is_weekly
                            ? cls.weekday_name
                            : new Date(cls.class_date).toLocaleDateString()}
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
            <h2 style={styles.sectionTitle}>📢 Manage Announcements</h2>
            <button
              onClick={() => setShowAnnouncementForm(true)}
              style={{ ...styles.button, backgroundColor: '#28a745' }}
            >
              ➕ Create
            </button>
          </div>

          {loadingAnnouncements ? (
            <p style={styles.loadingText}>Loading announcements...</p>
          ) : (
            <div style={styles.announcementList}>
              {announcements.length === 0 ? (
                <p style={styles.emptyText}>No announcements found</p>
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
              <button onClick={() => setShowCancelForm(false)} style={styles.closeButton}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <p><strong>Class:</strong> {cancellingClass.title}</p>
              <label style={styles.label}>Cancellation Reason (Optional)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{ ...styles.input, minHeight: '100px' }}
                placeholder="Why is this class being cancelled?"
              />
              <button
                onClick={handleCancelClass}
                style={{ ...styles.button, width: '100%', backgroundColor: '#dc3545', marginTop: '12px' }}
              >
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
              <button onClick={() => setShowEditLinkForm(false)} style={styles.closeButton}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <p><strong>Class:</strong> {editingClass.title}</p>
              <label style={styles.label}>Zoom Link</label>
              <input
                type="url"
                value={newZoomLink}
                onChange={(e) => setNewZoomLink(e.target.value)}
                style={styles.input}
                placeholder="https://zoom.us/j/..."
              />
              <button
                onClick={handleUpdateClassLink}
                style={{ ...styles.button, width: '100%', marginTop: '12px' }}
              >
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
              <button onClick={() => setShowAnnouncementForm(false)} style={styles.closeButton}>✕</button>
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
              <button
                onClick={handleCreateAnnouncement}
                style={{ ...styles.button, width: '100%', marginTop: '12px' }}
              >
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
    padding: '16px 20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f4f7f6',
    minHeight: '100vh',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '16px',
    backgroundColor: '#fff',
    padding: '14px 18px',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  },
  title: {
    color: '#333',
    margin: 0,
    fontSize: '22px',
  },
  headerButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  zoomButton: {
    padding: '8px 16px',
    backgroundColor: '#6f42c1',
    color: 'white',
    border: 'none',
    borderRadius: '7px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '7px',
    cursor: 'pointer',
    fontSize: '13px',
    whiteSpace: 'nowrap',
  },
  errorBox: {
    color: '#721c24',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    padding: '10px 14px',
    borderRadius: '8px',
    marginBottom: '12px',
    fontSize: '14px',
  },
  successBox: {
    color: '#155724',
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    padding: '10px 14px',
    borderRadius: '8px',
    marginBottom: '12px',
    fontSize: '14px',
  },
  controlsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '16px',
    backgroundColor: '#fff',
    padding: '10px 14px',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  },
  tabContainer: {
    display: 'flex',
    gap: '4px',
    borderBottom: 'none',
  },
  tab: {
    padding: '8px 18px',
    border: '2px solid transparent',
    background: '#f4f7f6',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#555',
    borderRadius: '7px',
    fontWeight: '500',
  },
  activeTab: {
    color: '#007bff',
    border: '2px solid #007bff',
    backgroundColor: '#e8f0fe',
    fontWeight: 'bold',
  },
  platformContainer: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  platformLabel: {
    fontSize: '13px',
    color: '#666',
    fontWeight: '600',
    marginRight: '2px',
  },
  platformButton: {
    padding: '7px 16px',
    border: '2px solid #007bff',
    backgroundColor: 'white',
    color: '#007bff',
    borderRadius: '7px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  activePlatform: {
    backgroundColor: '#007bff',
    color: 'white',
  },
  section: {
    backgroundColor: '#fff',
    padding: '18px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#333',
    fontWeight: '600',
  },
  loadingText: {
    color: '#666',
    padding: '20px 0',
    textAlign: 'center',
  },
  emptyCell: {
    textAlign: 'center',
    padding: '20px',
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
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
    padding: '10px 12px',
    textAlign: 'left',
    borderBottom: '2px solid #dee2e6',
    fontWeight: 'bold',
    fontSize: '13px',
    whiteSpace: 'nowrap',
  },
  tableRow: {
    borderBottom: '1px solid #dee2e6',
  },
  td: {
    padding: '10px 12px',
    fontSize: '14px',
  },
  badge: {
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
  actionButtons: {
    display: 'flex',
    gap: '5px',
  },
  smallButton: {
    padding: '5px 9px',
    borderRadius: '6px',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '13px',
  },
  button: {
    padding: '9px 18px',
    borderRadius: '8px',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    backgroundColor: '#007bff',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  announcementList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  announcementCard: {
    backgroundColor: '#f8f9fa',
    padding: '14px',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
  },
  announcementHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    flexWrap: 'wrap',
    gap: '6px',
  },
  announcementTitle: {
    margin: 0,
    color: '#333',
    fontSize: '15px',
  },
  platformBadge: {
    padding: '3px 8px',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  announcementMessage: {
    margin: '8px 0',
    color: '#666',
    fontSize: '14px',
  },
  announcementFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
    flexWrap: 'wrap',
    gap: '6px',
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
    padding: '16px 20px',
    borderBottom: '1px solid #dee2e6',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '22px',
    cursor: 'pointer',
    color: '#666',
    lineHeight: 1,
  },
  modalBody: {
    padding: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    marginTop: '12px',
    fontWeight: 'bold',
    color: '#333',
    fontSize: '14px',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '2px solid #007bff',
    fontSize: '15px',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
  },
};

export default TutorDashboard;
