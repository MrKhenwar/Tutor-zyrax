import React, { useState, useEffect, useCallback } from 'react';
import { useTutorAuth } from './TutorAuthContext';
import axios from 'axios';

const ZoomClassManagement = () => {
  const { tutorLogout } = useTutorAuth();

  const [platform, setPlatform] = useState('zyrax');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creatingMeeting, setCreatingMeeting] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showCreateClassForm, setShowCreateClassForm] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [newClass, setNewClass] = useState({
    title: '',
    class_date: '',
    time: '',
    duration: 60,
    is_weekly: false,
    weekday: 1,
  });

  const baseURL = process.env.REACT_APP_API_BASE_URL || 'https://api.zyrax.fit';

  const getAxiosConfig = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem('tutorAccessToken')}`,
    },
  });

  // Fetch classes with Zoom meeting status
  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${baseURL}/${platform}/classes/`, getAxiosConfig());

      // For each class, check if it has a Zoom meeting
      const classesWithZoomStatus = await Promise.all(
        response.data.map(async (classItem) => {
          try {
            const statusResponse = await axios.get(
              `${baseURL}/${platform}/zoom/class/${classItem.id}/status/`,
              getAxiosConfig()
            );
            return {
              ...classItem,
              hasZoomMeeting: statusResponse.data.has_zoom_meeting,
              zoomMeetingDetails: statusResponse.data.meeting_details || null,
            };
          } catch (err) {
            console.error(`Error fetching zoom status for class ${classItem.id}:`, err);
            return {
              ...classItem,
              hasZoomMeeting: false,
              zoomMeetingDetails: null,
            };
          }
        })
      );

      setClasses(classesWithZoomStatus);
    } catch (err) {
      setError(`Failed to load classes: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform]);

  useEffect(() => {
    fetchClasses();
  }, [platform, fetchClasses]);

  // Create new class
  const handleCreateClass = async () => {
    setError('');
    setSuccess('');

    if (!newClass.title || (!newClass.class_date && !newClass.is_weekly) || !newClass.time) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await axios.post(
        `${baseURL}/${platform}/classes/create/`,
        newClass,
        getAxiosConfig()
      );

      setSuccess('Class created successfully!');
      setShowCreateClassForm(false);
      setNewClass({
        title: '',
        class_date: '',
        time: '',
        duration: 60,
        is_weekly: false,
        weekday: 1,
      });
      await fetchClasses();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to create class.');
    }
  };

  // Create Zoom meeting for a class
  const handleCreateZoomMeeting = async (classId) => {
    setCreatingMeeting(classId);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        `${baseURL}/${platform}/zoom/create-for-class/`,
        {
          class_id: classId,
          timezone: 'Asia/Kolkata',
        },
        getAxiosConfig()
      );

      if (response.data.success) {
        setSuccess(
          `Zoom meeting created successfully! ${response.data.meeting.total_registered_users} users registered automatically.`
        );
        setSelectedMeeting(response.data.meeting);

        // Refresh classes
        await fetchClasses();
      }
    } catch (err) {
      if (err.response?.data?.existing_meeting) {
        setSelectedMeeting(err.response.data.existing_meeting);
        setError('Zoom meeting already exists for this class.');
      } else {
        setError(err.response?.data?.error || 'Failed to create Zoom meeting.');
      }
    } finally {
      setCreatingMeeting(null);
    }
  };

  // Fetch participants for a meeting
  const handleViewParticipants = async (classId, meetingId) => {
    setLoadingParticipants(true);
    setShowParticipants(true);
    setError('');

    try {
      const response = await axios.get(
        `${baseURL}/zoom/meeting/${meetingId}/participants/`,
        getAxiosConfig()
      );
      setParticipants(response.data.participants || []);
    } catch (err) {
      setError('Failed to load participants.');
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setSuccess(`${label} copied to clipboard!`);
    setTimeout(() => setSuccess(''), 2000);
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>🎥 Zoom Class Management</h1>
          <p style={styles.subtitle}>Create and manage secure Zoom meetings for your classes</p>
        </div>
        <div style={styles.headerButtons}>
          <button
            onClick={() => (window.location.href = '/tutor-dashboard')}
            style={styles.backButton}
          >
            ← Back to Dashboard
          </button>
          <button onClick={tutorLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      {/* Alert Messages */}
      {error && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

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

      {/* Info Section */}
      <div style={styles.infoSection}>
        <div style={styles.infoIcon}>🔒</div>
        <div>
          <h3 style={styles.infoTitle}>Secure Zoom Meetings</h3>
          <ul style={styles.infoList}>
            <li>All meetings require registration for enhanced security</li>
            <li>Only participants with emails in the database can join</li>
            <li>Active subscribers are automatically registered when you create a meeting</li>
            <li>Keep your Host Start URL private - only share Join URLs with participants</li>
          </ul>
        </div>
      </div>

      {/* Selected Meeting Details Modal */}
      {selectedMeeting && (
        <div style={styles.modal} onClick={() => setSelectedMeeting(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>✅ Meeting Created Successfully</h3>
              <button onClick={() => setSelectedMeeting(null)} style={styles.closeButton}>
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.meetingDetail}>
                <strong>Class Name:</strong>
                <p style={styles.meetingValue}>{selectedMeeting.class_title}</p>
              </div>

              <div style={styles.detailsGrid}>
                <div style={styles.detailCard}>
                  <strong>Meeting ID</strong>
                  <p style={styles.meetingId}>{selectedMeeting.zoom_meeting_id}</p>
                </div>
                <div style={styles.detailCard}>
                  <strong>Registered Users</strong>
                  <p style={styles.registeredUsers}>{selectedMeeting.total_registered_users} users</p>
                </div>
                {selectedMeeting.meeting_password && (
                  <div style={styles.detailCard}>
                    <strong>Password</strong>
                    <p style={styles.meetingId}>{selectedMeeting.meeting_password}</p>
                  </div>
                )}
              </div>

              <div style={styles.urlSection}>
                <div style={styles.urlCard}>
                  <div style={styles.urlHeader}>
                    <strong style={{ color: '#6f42c1' }}>🔐 Host Start URL (Keep Private)</strong>
                    <button
                      onClick={() => copyToClipboard(selectedMeeting.start_url, 'Start URL')}
                      style={styles.copyButton}
                    >
                      📋 Copy
                    </button>
                  </div>
                  <p style={styles.urlText}>{selectedMeeting.start_url}</p>
                  <a
                    href={selectedMeeting.start_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.startButton}
                  >
                    Start Meeting as Host
                  </a>
                </div>

                <div style={styles.urlCard}>
                  <div style={styles.urlHeader}>
                    <strong style={{ color: '#007bff' }}>🔗 Join URL (For Participants)</strong>
                    <button
                      onClick={() => copyToClipboard(selectedMeeting.join_url, 'Join URL')}
                      style={styles.copyButton}
                    >
                      📋 Copy
                    </button>
                  </div>
                  <p style={styles.urlText}>{selectedMeeting.join_url}</p>
                </div>
              </div>

              <div style={styles.securityNotice}>
                <strong>✅ Secure Meeting Active</strong>
                <p>
                  Only participants with registered emails can join. All {selectedMeeting.total_registered_users} active
                  subscribers have been automatically registered.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Classes List */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2>📚 Your Classes</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowCreateClassForm(true)}
              style={{ ...styles.refreshButton, backgroundColor: '#28a745' }}
            >
              ➕ Create New Class
            </button>
            <button onClick={fetchClasses} disabled={loading} style={styles.refreshButton}>
              {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
            </button>
          </div>
        </div>

        {loading && classes.length === 0 ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p>Loading classes...</p>
          </div>
        ) : classes.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📅</div>
            <p style={styles.emptyText}>No classes found</p>
          </div>
        ) : (
          <div style={styles.classGrid}>
            {classes.map((classItem) => (
              <div key={classItem.id} style={styles.classCard}>
                <div style={styles.classHeader}>
                  <h3 style={styles.className}>{classItem.title}</h3>
                  {classItem.hasZoomMeeting ? (
                    <span style={styles.statusBadgeActive}>✅ Zoom Active</span>
                  ) : (
                    <span style={styles.statusBadgeInactive}>⚪ No Zoom</span>
                  )}
                </div>

                <div style={styles.classInfo}>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>🗓️ Date:</span>
                    <span>
                      {classItem.is_weekly
                        ? classItem.weekday_name
                        : new Date(classItem.class_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>🕐 Time:</span>
                    <span>{classItem.time}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>⏱️ Duration:</span>
                    <span>{classItem.duration} minutes</span>
                  </div>
                  {classItem.tutor && (
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>👤 Tutor:</span>
                      <span>
                        {classItem.tutor.first_name} {classItem.tutor.last_name}
                      </span>
                    </div>
                  )}
                </div>

                <div style={styles.classActions}>
                  {classItem.hasZoomMeeting ? (
                    <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                      <button
                        onClick={() => setSelectedMeeting(classItem.zoomMeetingDetails)}
                        style={styles.viewButton}
                      >
                        📊 View Meeting Details
                      </button>
                      <button
                        onClick={() => handleViewParticipants(classItem.id, classItem.zoomMeetingDetails?.zoom_meeting_id)}
                        style={{ ...styles.viewButton, backgroundColor: '#17a2b8' }}
                      >
                        👥 View Participants
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCreateZoomMeeting(classItem.id)}
                      disabled={creatingMeeting === classItem.id}
                      style={styles.createButton}
                    >
                      {creatingMeeting === classItem.id ? '⏳ Creating...' : '🎥 Create Zoom Meeting'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create New Class Modal */}
      {showCreateClassForm && (
        <div style={styles.modal} onClick={() => setShowCreateClassForm(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>➕ Create New Class</h3>
              <button onClick={() => setShowCreateClassForm(false)} style={styles.closeButton}>
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              <label style={styles.label}>Class Title *</label>
              <input
                type="text"
                value={newClass.title}
                onChange={(e) => setNewClass({ ...newClass, title: e.target.value })}
                style={styles.input}
                placeholder="e.g., Morning Yoga"
              />

              <label style={styles.label}>
                <input
                  type="checkbox"
                  checked={newClass.is_weekly}
                  onChange={(e) => setNewClass({ ...newClass, is_weekly: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                Weekly Recurring Class
              </label>

              {!newClass.is_weekly && (
                <>
                  <label style={styles.label}>Class Date *</label>
                  <input
                    type="date"
                    value={newClass.class_date}
                    onChange={(e) => setNewClass({ ...newClass, class_date: e.target.value })}
                    style={styles.input}
                  />
                </>
              )}

              {newClass.is_weekly && (
                <>
                  <label style={styles.label}>Day of Week *</label>
                  <select
                    value={newClass.weekday}
                    onChange={(e) => setNewClass({ ...newClass, weekday: parseInt(e.target.value) })}
                    style={styles.input}
                  >
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                    <option value={0}>Sunday</option>
                  </select>
                </>
              )}

              <label style={styles.label}>Time *</label>
              <input
                type="time"
                value={newClass.time}
                onChange={(e) => setNewClass({ ...newClass, time: e.target.value })}
                style={styles.input}
              />

              <label style={styles.label}>Duration (minutes) *</label>
              <input
                type="number"
                value={newClass.duration}
                onChange={(e) => setNewClass({ ...newClass, duration: parseInt(e.target.value) })}
                style={styles.input}
                min="15"
                max="180"
              />

              <button
                onClick={handleCreateClass}
                style={{ ...styles.createButton, marginTop: '20px' }}
              >
                Create Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Participants Modal */}
      {showParticipants && (
        <div style={styles.modal} onClick={() => setShowParticipants(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>👥 Meeting Participants</h3>
              <button onClick={() => setShowParticipants(false)} style={styles.closeButton}>
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              {loadingParticipants ? (
                <div style={styles.loadingContainer}>
                  <div style={styles.spinner}></div>
                  <p>Loading participants...</p>
                </div>
              ) : participants.length === 0 ? (
                <div style={styles.emptyState}>
                  <p style={styles.emptyText}>No participants registered yet</p>
                </div>
              ) : (
                <div>
                  <p style={{ marginBottom: '20px', fontWeight: 'bold', color: '#007bff' }}>
                    Total Participants: {participants.length}
                  </p>
                  <div style={styles.participantList}>
                    {participants.map((participant, index) => (
                      <div key={index} style={styles.participantCard}>
                        <div style={styles.participantInfo}>
                          <div style={styles.participantAvatar}>
                            {participant.name ? participant.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <div style={styles.participantName}>
                              {participant.name || 'Unknown'}
                            </div>
                            <div style={styles.participantEmail}>
                              {participant.email || 'No email'}
                            </div>
                          </div>
                        </div>
                        <span style={participant.join_url ? styles.statusRegistered : styles.statusPending}>
                          {participant.join_url ? '✅ Registered' : '⏳ Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  title: {
    color: '#333',
    margin: '0 0 5px 0',
  },
  subtitle: {
    color: '#666',
    margin: 0,
    fontSize: '14px',
  },
  headerButtons: {
    display: 'flex',
    gap: '10px',
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  errorBox: {
    color: '#721c24',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  successBox: {
    color: '#155724',
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  platformContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  platformButton: {
    padding: '12px 24px',
    border: '2px solid #007bff',
    backgroundColor: 'white',
    color: '#007bff',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.3s',
  },
  activePlatform: {
    backgroundColor: '#007bff',
    color: 'white',
  },
  infoSection: {
    backgroundColor: '#e7f3ff',
    border: '2px solid #007bff',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    display: 'flex',
    gap: '15px',
  },
  infoIcon: {
    fontSize: '32px',
  },
  infoTitle: {
    margin: '0 0 10px 0',
    color: '#007bff',
  },
  infoList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#333',
    lineHeight: '1.6',
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
  refreshButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '40px',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  emptyText: {
    color: '#666',
    fontSize: '18px',
  },
  classGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  classCard: {
    backgroundColor: '#f8f9fa',
    border: '2px solid #dee2e6',
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 0.3s',
  },
  classHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
  },
  className: {
    margin: 0,
    color: '#333',
    fontSize: '18px',
    flex: 1,
  },
  statusBadgeActive: {
    padding: '6px 12px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
    border: '1px solid #c3e6cb',
  },
  statusBadgeInactive: {
    padding: '6px 12px',
    backgroundColor: '#f8f9fa',
    color: '#6c757d',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
    border: '1px solid #dee2e6',
  },
  classInfo: {
    marginBottom: '15px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #dee2e6',
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#666',
  },
  classActions: {
    marginTop: '15px',
  },
  createButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.3s',
  },
  viewButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.3s',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '700px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    borderBottom: '2px solid #dee2e6',
    backgroundColor: '#f8f9fa',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#666',
    lineHeight: '1',
  },
  modalBody: {
    padding: '24px',
  },
  meetingDetail: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  meetingValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#007bff',
    margin: '10px 0 0 0',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '20px',
  },
  detailCard: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
  },
  meetingId: {
    fontFamily: 'monospace',
    fontSize: '18px',
    color: '#333',
    margin: '8px 0 0 0',
    fontWeight: 'bold',
  },
  registeredUsers: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#28a745',
    margin: '8px 0 0 0',
  },
  urlSection: {
    marginTop: '20px',
  },
  urlCard: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '2px solid #dee2e6',
  },
  urlHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  copyButton: {
    padding: '6px 12px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  urlText: {
    fontSize: '12px',
    color: '#666',
    wordBreak: 'break-all',
    margin: '10px 0',
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '6px',
    border: '1px solid #dee2e6',
  },
  startButton: {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: '#6f42c1',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: '10px',
  },
  securityNotice: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#d4edda',
    border: '2px solid #c3e6cb',
    borderRadius: '8px',
    color: '#155724',
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
  participantList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  participantCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
  },
  participantInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  participantAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '18px',
  },
  participantName: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: '14px',
  },
  participantEmail: {
    color: '#666',
    fontSize: '12px',
  },
  statusRegistered: {
    padding: '6px 12px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  statusPending: {
    padding: '6px 12px',
    backgroundColor: '#fff3cd',
    color: '#856404',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
};

export default ZoomClassManagement;
