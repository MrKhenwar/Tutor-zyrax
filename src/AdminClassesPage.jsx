import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./AuthContext";
import api from "./api"; // Import the central api instance

const AdminClassesPage = () => {
  // State for Classes
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // State for Filtering (Classes)
  const [classSearchQuery, setClassSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // State for Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
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

  const { logout, openDjangoAdmin } = useAuth();

  // Filter users based on search query (by username)
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (!userSearchQuery) return true;
      const username = user.username || "";
      return username.toLowerCase().includes(userSearchQuery.toLowerCase());
    });
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
      const response = await api.get("/zyrax/diet-pdfs/users/");
      setUsers(response.data);
    } catch (err) {
      setError(`Failed to load users: ${err.response?.data?.detail || err.message}`);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
    fetchAnnouncements();
    fetchUsers();
  }, [fetchClasses, fetchAnnouncements, fetchUsers]);

  // --- Handler Functions ---
  const handleAddClass = () => {
    showSuccessMessage("Opening Django Admin to add a new class...");
    openDjangoAdmin('zyrax/zyrax_class/add/');
  };

  const handleUpdateClass = (id) => {
    showSuccessMessage("Opening Django Admin to edit the class...");
    openDjangoAdmin(`zyrax/zyrax_class/${id}/change/`);
  };

  const handleDeleteClass = (id) => {
    if (window.confirm("This will open Django Admin to delete the class. Are you sure?")) {
      showSuccessMessage("Opening Django Admin to delete the class...");
      openDjangoAdmin(`zyrax/zyrax_class/${id}/delete/`);
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
      setNewAnnouncement({ title: "", message: "" });
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
      setError(`Failed to upload diet plan: ${err.response?.data?.detail || err.message}`);
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

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>🎓 Admin Dashboard</h1>
        <button onClick={logout} style={styles.logoutButton}>
          Logout
        </button>
      </header>

      {error && <div style={styles.errorBox}>{error}</div>}
      {successMessage && <div style={styles.successBox}>{successMessage}</div>}

      <div style={styles.noticeBox}>
        <p>✨ <strong>Seamless Admin Integration:</strong> Class management is handled via the Django Admin panel for security and consistency. Use the buttons below to add, edit, or delete classes.</p>
      </div>

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
              <button onClick={handleCreateAnnouncement} style={{...styles.button, width: '100%'}}>Post Announcement</button>
            </div>
          )}
          {announcementLoading ? <p>Loading announcements...</p> : (
            <div style={styles.list}>
              {announcements.length === 0 ? <p>No announcements found.</p> :
                announcements.map(ann => (
                  <div key={ann.id} style={styles.listItem}>
                    <div>
                      <h4 style={{ margin: 0 }}>{ann.title}</h4>
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
                        {user.username || `User #${user.id}`}
                      </option>
                    ))}
                </select>

                {filteredUsers.length === 0 && userSearchQuery && (
                  <p style={{color: '#666', fontStyle: 'italic', textAlign: 'center'}}>
                    No users found matching "{userSearchQuery}"
                  </p>
                )}

                <textarea placeholder="Description (optional)" value={dietUpload.description} onChange={(e) => setDietUpload({ ...dietUpload, description: e.target.value })} rows={3} style={styles.textarea}/>
                <input type="file" accept=".pdf" onChange={(e) => setDietUpload({ ...dietUpload, pdf_file: e.target.files[0] })} style={{...styles.input, padding: '10px'}}/>
                {uploadProgress > 0 && <progress value={uploadProgress} max="100" style={{width: '100%', marginTop: '10px'}} />}
                <button onClick={handleUploadDietPDF} style={{...styles.button, backgroundColor: '#28a745', width: '100%'}} disabled={uploadProgress > 0}>
                    {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : "Upload Diet Plan"}
                </button>
             </div>
          )}
        </section>

        {/* --- Classes Section --- */}
        <section style={styles.section}>
            <div style={styles.sectionHeader}>
                <h2>📚 Manage Classes</h2>
                <button onClick={handleAddClass} style={{ ...styles.button, backgroundColor: '#007bff'}}>Add New Class via Admin</button>
            </div>
             <div style={styles.filterContainer}>
                <input type="text" placeholder="🔍 Search by title..." value={classSearchQuery} onChange={(e) => setClassSearchQuery(e.target.value)} style={styles.input} />
                <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={styles.input}/>
            </div>
            {loading ? <p>Loading classes...</p> : (
                <div style={styles.grid}>
                    {filteredClasses.length > 0 ? filteredClasses.map((cls) => (
                        <div key={cls.id} style={styles.card}>
                            <h3 style={{ marginBottom: "10px" }}>{cls.title}</h3>
                            <p>📅 {cls.class_date || cls.date}</p>
                            <p>⏰ {cls.time}</p>
                            <p>⏳ {cls.duration} minutes</p>
                            <p>🔗 <a href={cls.zoom_link} target="_blank" rel="noopener noreferrer">Zoom Link</a></p>
                            <div style={styles.cardActions}>
                                <button onClick={() => handleUpdateClass(cls.id)} style={{...styles.button, backgroundColor: '#ffc107', color: '#000'}}>Edit</button>
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
    logoutButton: { padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
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
};

export default AdminClassesPage;
