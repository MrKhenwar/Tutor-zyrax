import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import api from "./api"; // Import the central api instance
import AttendanceManagement from "./AttendanceManagement";

// Timezone utility functions
const convertISTToLocal = (istTimeString, dateString = null) => {
  if (!istTimeString) return "";

  // Create a date object in IST (UTC+5:30)
  const date = dateString ? new Date(dateString) : new Date();
  const [hours, minutes] = istTimeString.split(':');

  // Set time in IST
  const istDate = new Date(date);
  istDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  // IST is UTC+5:30, so subtract 5.5 hours to get UTC
  const utcDate = new Date(istDate.getTime() - (5.5 * 60 * 60 * 1000));

  // Convert to local timezone
  const localHours = utcDate.getHours().toString().padStart(2, '0');
  const localMinutes = utcDate.getMinutes().toString().padStart(2, '0');

  return `${localHours}:${localMinutes}`;
};

const convertLocalToIST = (localTimeString) => {
  if (!localTimeString) return "";

  const [hours, minutes] = localTimeString.split(':');
  const localDate = new Date();
  localDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  // Convert to UTC
  const utcDate = new Date(localDate.getTime());

  // Add 5.5 hours to get IST
  const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));

  const istHours = istDate.getHours().toString().padStart(2, '0');
  const istMinutes = istDate.getMinutes().toString().padStart(2, '0');

  return `${istHours}:${istMinutes}`;
};

const getUserTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

const AdminClassesPage = () => {
  // State for Classes
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // State for Filtering (Classes)
  const [classSearchQuery, setClassSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // State for Class Form
  const [showClassForm, setShowClassForm] = useState(false);
  const [editingClassId, setEditingClassId] = useState(null);
  const [newClass, setNewClass] = useState({
    title: "",
    class_date: "",
    time: "",
    duration: "",
    zoom_link: "",
  });

  // State for Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
    platform: "zyrax", // Default to zyrax
  });

  // State for Diet Uploads
  const [showDietUploadForm, setShowDietUploadForm] = useState(false);
  const [users, setUsers] = useState([]);
  const [dietUpload, setDietUpload] = useState({
    title: "",
    description: "",
    assigned_to_id: "",
    pdf_file: null,
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [userSearchQuery, setUserSearchQuery] = useState(""); // 🔹 separate search for users

  const { logout } = useAuth();
  const navigate = useNavigate();

  // Filter users based on search query (by username)
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) {
      // Show only first 50 users when no search query
      return users.slice(0, 50);
    }

    // When searching, show all matching results
    return users.filter(user => {
      const username = user.username || "";
      const firstName = user.first_name || "";
      const lastName = user.last_name || "";
      const fullName = user.full_name || "";
      const searchTerm = userSearchQuery.toLowerCase();

      return username.toLowerCase().includes(searchTerm) ||
             firstName.toLowerCase().includes(searchTerm) ||
             lastName.toLowerCase().includes(searchTerm) ||
             fullName.toLowerCase().includes(searchTerm);
    }).slice(0, 100); // Limit search results to 100 for performance
  }, [users, userSearchQuery]);

  // --- Helper Function to show temporary success messages ---
  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  // --- API Functions using the central 'api' instance ---
  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/zyrax/classes/");
      setClasses(response.data);
      setError(null);
    } catch (err) {
      setError(`Failed to fetch classes: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    setAnnouncementLoading(true);
    try {
      const response = await api.get("/zyrax/announcements/my/");
      setAnnouncements(response.data);
    } catch (err) {
      setError(`Failed to fetch announcements: ${err.response?.data?.detail || err.message}`);
    } finally {
      setAnnouncementLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get("/zyrax/admin/users/");
      setUsers(response.data);
    } catch (err) {
      console.error("Failed to load users:", err);
      // Don't show error to user as this is not critical for the main page
    }
  }, []);

  useEffect(() => {
    fetchClasses();
    fetchAnnouncements();
    fetchUsers();
  }, [fetchClasses, fetchAnnouncements, fetchUsers]);

  // --- Handler Functions ---
  const handleAddClass = () => {
    setEditingClassId(null);
    setNewClass({
      title: "",
      class_date: "",
      time: "",
      duration: "",
      zoom_link: "",
    });
    setShowClassForm(true);
  };

  const handleUpdateClass = (cls) => {
    setEditingClassId(cls.id);
    setNewClass({
      title: cls.title || "",
      class_date: cls.class_date || cls.date || "",
      time: convertISTToLocal(cls.time, cls.class_date || cls.date) || "",
      duration: cls.duration || "",
      zoom_link: cls.zoom_link || "",
    });
    setShowClassForm(true);
  };

  const handleSaveClass = async () => {
    if (!newClass.title.trim() || !newClass.class_date || !newClass.time) {
      setError("Please fill in at least title, date, and time for the class.");
      return;
    }
    setError(null);
    try {
      // Convert local time to IST before sending to backend
      const classData = {
        ...newClass,
        time: convertLocalToIST(newClass.time)
      };

      if (editingClassId) {
        // Update existing class
        await api.patch(`/zyrax/classes/${editingClassId}/`, classData);
        showSuccessMessage("Class updated successfully!");
      } else {
        // Create new class
        await api.post("/zyrax/classes/create/", classData);
        showSuccessMessage("Class created successfully!");
      }
      setNewClass({
        title: "",
        class_date: "",
        time: "",
        duration: "",
        zoom_link: "",
      });
      setEditingClassId(null);
      setShowClassForm(false);
      fetchClasses(); // Refresh the list
    } catch (err) {
      setError(`Failed to save class: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm("Are you sure you want to delete this class?")) return;
    try {
      await api.delete(`/zyrax/classes/${id}/delete/`);
      showSuccessMessage("Class deleted successfully!");
      fetchClasses(); // Refresh the list
    } catch (err) {
      setError(`Failed to delete class: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) {
      setError("Please fill in both title and message for the announcement.");
      return;
    }
    setError(null);
    try {
      await api.post("/zyrax/announcements/create/", newAnnouncement);
      showSuccessMessage("Announcement created successfully!");
      setNewAnnouncement({ title: "", message: "", platform: "zyrax" });
      setShowAnnouncementForm(false);
      fetchAnnouncements(); // Refresh the list
    } catch (err) {
      setError(`Failed to create announcement: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await api.delete(`/zyrax/announcements/${id}/`);
      showSuccessMessage("Announcement deleted successfully!");
      fetchAnnouncements(); // Refresh the list
    } catch (err) {
      setError(`Failed to delete announcement: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleUploadDietPDF = async () => {
    if (!dietUpload.title.trim() || !dietUpload.assigned_to_id || !dietUpload.pdf_file) {
      setError("Please provide a title, select a user, and choose a PDF file.");
      return;
    }
    setError(null);

    const formData = new FormData();
    formData.append('title', dietUpload.title);
    formData.append('description', dietUpload.description);
    formData.append('assigned_to_id', dietUpload.assigned_to_id);
    formData.append('pdf_file', dietUpload.pdf_file);

    try {
      await api.post("/zyrax/diet-pdfs/upload/", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });
      showSuccessMessage("Diet plan uploaded successfully!");
      setDietUpload({ title: "", description: "", assigned_to_id: "", pdf_file: null });
      setShowDietUploadForm(false);
    } catch (err) {
      console.error('Upload error:', err);
      let errorMessage = "Failed to upload diet plan";

      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.details) {
        // Handle validation errors
        const details = err.response.data.details;
        if (typeof details === 'object') {
          const errorMessages = Object.values(details).flat();
          errorMessage = `Validation errors: ${errorMessages.join(', ')}`;
        } else {
          errorMessage = `Error: ${details}`;
        }
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
        setUploadProgress(0);
    }
  };

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const title = c.title || "";
      const classDate = c.class_date || c.date || "";
      const matchesSearch = title.toLowerCase().includes(classSearchQuery.toLowerCase());
      const matchesDate = filterDate ? classDate === filterDate : true;
      return matchesSearch && matchesDate;
    });
  }, [classes, classSearchQuery, filterDate]);

  // Handle class join tracking
  const handleJoinClass = async (classId, zoomLink) => {
    try {
      // Log the join to backend
      await api.post("/zyrax/classes/join/", { class_id: classId });

      // Mark attendance (using Zylo attendance endpoint)
      await api.post("/zyrax/zylo-attendance/mark_attendance/");

      // Open Zoom link
      window.open(zoomLink, '_blank');

      showSuccessMessage("Class join logged successfully!");
    } catch (err) {
      console.error("Failed to log class join:", err);
      // Still open the link even if logging fails
      window.open(zoomLink, '_blank');
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>🎓 Admin Dashboard</h1>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/subscribers')} style={styles.subscribersButton}>
            👥 Manage Subscribers
          </button>
          <button onClick={() => navigate('/extend-subscription')} style={styles.extensionButton}>
            ⏰ Extend Subscription
          </button>
          <button onClick={() => navigate('/everyday-stats')} style={styles.statsButton}>
            📊 Everyday Stats
          </button>
          <button onClick={() => navigate('/class-wise-stats')} style={styles.classWiseButton}>
            📋 Class-Wise Stats
          </button>
          <button onClick={logout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      {error && <div style={styles.errorBox}>{error}</div>}
      {successMessage && <div style={styles.successBox}>{successMessage}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {/* --- Announcements Section --- */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2>📢 Announcements</h2>
            <button
              onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
              style={{ ...styles.button, backgroundColor: showAnnouncementForm ? "#6c757d" : "#17a2b8" }}
            >
              {showAnnouncementForm ? "Cancel" : "Create New"}
            </button>
          </div>
          {showAnnouncementForm && (
            <div style={styles.formContainer}>
              <input type="text" placeholder="Announcement Title" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} style={styles.input}/>
              <textarea placeholder="Announcement Message" value={newAnnouncement.message} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })} rows={4} style={styles.textarea}/>

              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <label style={{fontWeight: 'bold', color: '#333', fontSize: '14px'}}>Platform:</label>
                <select
                  value={newAnnouncement.platform}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, platform: e.target.value })}
                  style={styles.input}
                >
                  <option value="zyrax">Zyrax Only</option>
                  <option value="zylo">Zylo Only</option>
                  <option value="both">Both Zyrax and Zylo</option>
                </select>
                <small style={{color: '#666', fontStyle: 'italic'}}>Select which platform(s) this announcement should appear on</small>
              </div>

              <button onClick={handleCreateAnnouncement} style={{...styles.button, width: '100%'}}>Post Announcement</button>
            </div>
          )}
          {announcementLoading ? <p>Loading announcements...</p> : (
            <div style={styles.list}>
              {announcements.length === 0 ? <p>No announcements found.</p> :
                announcements.map(ann => (
                  <div key={ann.id} style={styles.listItem}>
                    <div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px'}}>
                        <h4 style={{ margin: 0 }}>{ann.title}</h4>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          backgroundColor: ann.platform === 'zyrax' ? '#e3f2fd' : ann.platform === 'zylo' ? '#fff3e0' : '#f3e5f5',
                          color: ann.platform === 'zyrax' ? '#1976d2' : ann.platform === 'zylo' ? '#f57c00' : '#7b1fa2',
                        }}>
                          {ann.platform_display || ann.platform}
                        </span>
                      </div>
                      <p style={{ margin: '5px 0 0', color: '#555' }}>{ann.message}</p>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <small>{new Date(ann.created_at).toLocaleDateString()}</small>
                        <button onClick={() => handleDeleteAnnouncement(ann.id)} style={styles.deleteButtonSmall}>Delete</button>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </section>

        {/* --- Diet Plan Section --- */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2>📄 Diet Plan Upload</h2>
            <button
              onClick={() => setShowDietUploadForm(!showDietUploadForm)}
              style={{ ...styles.button, backgroundColor: showDietUploadForm ? "#6c757d" : "#28a745" }}
            >
              {showDietUploadForm ? "Cancel" : "New Upload"}
            </button>
          </div>
          {showDietUploadForm && (
             <div style={styles.formContainer}>
                <input type="text" placeholder="Diet Plan Title" value={dietUpload.title} onChange={(e) => setDietUpload({ ...dietUpload, title: e.target.value })} style={styles.input}/>

                {/* Search input for users */}
                <input
                  type="text"
                  placeholder="🔍 Search users by username..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  style={styles.input}
                />

                <select value={dietUpload.assigned_to_id} onChange={(e) => setDietUpload({ ...dietUpload, assigned_to_id: e.target.value })} style={styles.input}>
                    <option value="">-- Select User --</option>
                    {filteredUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name || user.username || `User #${user.id}`} ({user.username})
                      </option>
                    ))}
                </select>

                {!userSearchQuery && users.length > 50 && (
                  <p style={{color: '#666', fontStyle: 'italic', textAlign: 'center', fontSize: '12px'}}>
                    Showing first 50 users. Use search above to find specific users.
                  </p>
                )}

                {filteredUsers.length === 0 && userSearchQuery && (
                  <p style={{color: '#666', fontStyle: 'italic', textAlign: 'center'}}>
                    No users found matching "{userSearchQuery}"
                  </p>
                )}

                {userSearchQuery && filteredUsers.length === 100 && (
                  <p style={{color: '#666', fontStyle: 'italic', textAlign: 'center', fontSize: '12px'}}>
                    Showing first 100 matches. Be more specific to see fewer results.
                  </p>
                )}

                <textarea placeholder="Description (optional)" value={dietUpload.description} onChange={(e) => setDietUpload({ ...dietUpload, description: e.target.value })} rows={3} style={styles.textarea}/>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      // Validate file type
                      if (file.type !== 'application/pdf') {
                        setError('Please select a valid PDF file.');
                        e.target.value = '';
                        return;
                      }
                      // Validate file size (10MB limit)
                      if (file.size > 10 * 1024 * 1024) {
                        setError('File size must be less than 10MB.');
                        e.target.value = '';
                        return;
                      }
                      setError(null);
                      setDietUpload({ ...dietUpload, pdf_file: file });
                    }
                  }}
                  style={{...styles.input, padding: '10px'}}
                />
                {uploadProgress > 0 && <progress value={uploadProgress} max="100" style={{width: '100%', marginTop: '10px'}} />}
                <button onClick={handleUploadDietPDF} style={{...styles.button, backgroundColor: '#28a745', width: '100%'}} disabled={uploadProgress > 0}>
                    {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : "Upload Diet Plan"}
                </button>
             </div>
          )}
        </section>

        {/* --- Attendance & Analytics Section --- */}
        <AttendanceManagement />

        {/* --- Classes Section --- */}
        <section style={styles.section}>
            <div style={styles.sectionHeader}>
                <h2>📚 Manage Classes</h2>
                <button
                  onClick={() => {
                    if (showClassForm) {
                      setShowClassForm(false);
                      setEditingClassId(null);
                    } else {
                      handleAddClass();
                    }
                  }}
                  style={{ ...styles.button, backgroundColor: showClassForm ? "#6c757d" : "#007bff"}}
                >
                  {showClassForm ? "Cancel" : "Add New Class"}
                </button>
            </div>
            {showClassForm && (
              <div style={styles.formContainer}>
                <input
                  type="text"
                  placeholder="Class Title"
                  value={newClass.title}
                  onChange={(e) => setNewClass({ ...newClass, title: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="date"
                  placeholder="Class Date"
                  value={newClass.class_date}
                  onChange={(e) => setNewClass({ ...newClass, class_date: e.target.value })}
                  style={styles.input}
                />
                <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                  <input
                    type="time"
                    placeholder="Class Time"
                    value={newClass.time}
                    onChange={(e) => setNewClass({ ...newClass, time: e.target.value })}
                    style={styles.input}
                  />
                  <small style={{color: '#666', fontStyle: 'italic'}}>Enter time in your timezone: {getUserTimezone()}</small>
                </div>
                <input
                  type="number"
                  placeholder="Duration (minutes)"
                  value={newClass.duration}
                  onChange={(e) => setNewClass({ ...newClass, duration: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="url"
                  placeholder="Zoom Link"
                  value={newClass.zoom_link}
                  onChange={(e) => setNewClass({ ...newClass, zoom_link: e.target.value })}
                  style={styles.input}
                />
                <button onClick={handleSaveClass} style={{...styles.button, width: '100%', backgroundColor: '#007bff'}}>
                  {editingClassId ? "Update Class" : "Create Class"}
                </button>
              </div>
            )}
             <div style={styles.filterContainer}>
                <input type="text" placeholder="🔍 Search by title..." value={classSearchQuery} onChange={(e) => setClassSearchQuery(e.target.value)} style={styles.input} />
                <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={styles.input}/>
            </div>
            {loading ? <p>Loading classes...</p> : (
                <div style={styles.grid}>
                    {filteredClasses.length > 0 ? filteredClasses.map((cls) => (
                        <div key={cls.id} style={{
                          ...styles.card,
                          ...(cls.is_cancelled ? {
                            borderLeft: '4px solid #dc3545',
                            opacity: 0.7,
                            backgroundColor: '#fff5f5'
                          } : {})
                        }}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "10px"}}>
                              <h3 style={{ margin: 0 }}>{cls.title}</h3>
                              {cls.is_cancelled && (
                                <span style={{
                                  padding: '4px 12px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  backgroundColor: '#dc3545',
                                  color: 'white',
                                  whiteSpace: 'nowrap'
                                }}>
                                  ❌ CANCELLED
                                </span>
                              )}
                            </div>
                            <p>📅 {cls.class_date || cls.date}</p>
                            <p>⏰ {convertISTToLocal(cls.time, cls.class_date || cls.date)} <small style={{color: '#666'}}>({getUserTimezone()})</small></p>
                            <p>⏳ {cls.duration} minutes</p>
                            <p>
                              🔗 <button
                                onClick={() => handleJoinClass(cls.id, cls.zoom_link)}
                                disabled={cls.is_cancelled}
                                style={{
                                  ...styles.joinButton,
                                  ...(cls.is_cancelled ? {
                                    backgroundColor: '#6c757d',
                                    cursor: 'not-allowed',
                                    opacity: 0.6
                                  } : {})
                                }}
                              >
                                {cls.is_cancelled ? 'Class Cancelled' : 'Join Class'}
                              </button>
                            </p>
                            {cls.is_cancelled && cls.cancelled_reason && (
                              <p style={{
                                fontSize: '13px',
                                color: '#721c24',
                                backgroundColor: '#f8d7da',
                                padding: '8px',
                                borderRadius: '6px',
                                marginTop: '10px'
                              }}>
                                <strong>Reason:</strong> {cls.cancelled_reason}
                              </p>
                            )}
                            <div style={styles.cardActions}>
                                <button onClick={() => handleUpdateClass(cls)} style={{...styles.button, backgroundColor: '#ffc107', color: '#000'}}>Edit</button>
                                <button onClick={() => handleDeleteClass(cls.id)} style={styles.deleteButton}>Delete</button>
                            </div>
                        </div>
                    )) : <p>No classes found for the selected criteria.</p>}
                </div>
            )}
        </section>
      </div>
    </div>
  );
};

// --- Styles ---
const styles = {
    page: { padding: '40px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh'},
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    title: { color: '#333', margin: 0 },
    subscribersButton: { padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap' },
    extensionButton: { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap' },
    statsButton: { padding: '10px 20px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap' },
    classWiseButton: { padding: '10px 20px', backgroundColor: '#fd7e14', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap' },
    logoutButton: { padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap' },
    errorBox: { color: '#721c24', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' },
    successBox: { color: '#155724', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' },
    noticeBox: { backgroundColor: '#e2f3ff', border: '1px solid #b8e2ff', borderRadius: '8px', padding: '16px', marginBottom: '30px', textAlign: 'center', color: '#004085' },
    section: { backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    formContainer: { display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '20px' },
    filterContainer: { display: 'flex', gap: '20px', marginBottom: '30px' },
    input: { padding: '12px 15px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px', flex: '1', minWidth: '150px' },
    textarea: { padding: '12px 15px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px', resize: 'vertical', minHeight: '80px' },
    button: { padding: '12px 20px', borderRadius: '8px', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' },
    deleteButton: { padding: '10px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#dc3545', color: '#fff', cursor: 'pointer', fontSize: '14px' },
    deleteButtonSmall: { padding: '5px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#dc3545', color: '#fff', cursor: 'pointer', fontSize: '12px' },
    list: { display: 'flex', flexDirection: 'column', gap: '15px' },
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' },
    card: { backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid #eee' },
    cardActions: { marginTop: '15px', display: 'flex', justifyContent: 'space-between' },
    joinButton: {
      padding: '8px 16px',
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
      transition: 'background-color 0.3s'
    },
};

export default AdminClassesPage;
