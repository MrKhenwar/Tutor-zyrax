import React, { useEffect, useState } from 'react';

export default function AdminClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);

  const API_BASE = "https://zyrax-xi.vercel.app/zyrax/classes/"; // ✅ Added trailing slash

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const fetchAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("access")}`,
  });

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const response = await fetch(API_BASE, {
          headers: fetchAuthHeaders(),
          credentials: "include", // ✅ Added credentials for CSRF/CORS
        });
        if (!response.ok) throw new Error('Failed to fetch classes');
        const data = await response.json();
        setClasses(data);
      } catch (error) {
        console.error(error);
        alert('Could not load classes. Make sure you are logged in.');
      }
      setLoading(false);
    };
    fetchClasses();
  }, []);

  const startEdit = (cls) => {
    setEditing(cls.id);
    setForm({ ...cls });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const saveChanges = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}${id}/`, {
        method: 'PATCH',
        headers: fetchAuthHeaders(),
        body: JSON.stringify(form),
        credentials: "include", // ✅ Added credentials
      });
      if (!response.ok) throw new Error('Failed to update class');
      const updatedClass = await response.json();
      setClasses((prev) => prev.map((cls) => (cls.id === id ? updatedClass : cls)));
      setEditing(null);
    } catch (error) {
      console.error(error);
      alert('Could not save changes. Please check your inputs.');
    }
    setLoading(false);
  };

  const addNewClass = async () => {
    const today = new Date().toISOString().split('T')[0];
    const newClass = {
      title: "New Class",
      time: "12:00",
      duration: 60,
      zoom_link: "https://zoom.us/",
      class_date: today,
      weekday: 0,
      is_weekly: false,
    };
    setLoading(true);
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: fetchAuthHeaders(),
        body: JSON.stringify(newClass),
        credentials: "include", // ✅ Added credentials
      });
      if (!response.ok) throw new Error('Failed to create class');
      const created = await response.json();
      setClasses((prev) => [...prev, created]);
    } catch (error) {
      console.error(error);
      alert('Could not create class. Make sure you are authenticated.');
    }
    setLoading(false);
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

  const formatTime = (timeString) =>
    new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true
    });

  const filteredClasses = selectedDay
    ? classes.filter(cls => cls.weekday !== null && weekdays[cls.weekday] === selectedDay)
    : classes;

  if (loading) return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '24px' }}>Loading...</div>
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px', fontFamily: 'sans-serif', backgroundColor: '#1a1a1a', color: '#fff' }}>
      <h1 style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '40px' }}>🎓 Tutor Dashboard</h1>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', marginBottom: '30px' }}>
        {weekdays.map(day => (
          <button key={day}
            onClick={() => setSelectedDay(day === selectedDay ? null : day)}
            style={{
              padding: '10px 18px', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer',
              background: selectedDay === day ? '#4CAF50' : '#444',
              color: selectedDay === day ? '#fff' : '#ddd',
              border: 'none',
            }}>
            {day}
          </button>
        ))}
      </div>

      <button
        onClick={addNewClass}
        style={{
          padding: '12px 24px', background: '#4CAF50', color: 'white',
          border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer',
          display: 'block', margin: '0 auto 40px'
        }}>➕ Add New Class</button>

      {filteredClasses.length === 0 && <p style={{ textAlign: 'center', fontSize: '1.25rem' }}>No classes found.</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {filteredClasses.map((cls) => (
          <div key={cls.id} style={{
            background: '#333', borderRadius: '12px', padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)', position: 'relative',
          }}>
            {editing === cls.id ? (
              <>
                {['title', 'time', 'duration', 'zoom_link', 'class_date'].map((field) => (
                  <input key={field}
                    type={field === 'time' ? 'time' : field === 'class_date' ? 'date' : 'text'}
                    name={field} value={form[field]} onChange={handleChange}
                    placeholder={field.replace('_', ' ')}
                    style={{ width: '100%', marginBottom: '12px', padding: '10px', borderRadius: '6px', border: 'none' }}
                  />
                ))}
                <button onClick={() => saveChanges(cls.id)} style={{ padding: '10px 20px', background: '#4CAF50', color: 'white', marginRight: '10px', borderRadius: '6px' }}>✓ Save</button>
                <button onClick={() => setEditing(null)} style={{ padding: '10px 20px', background: '#f44336', color: 'white', borderRadius: '6px' }}>✕ Cancel</button>
              </>
            ) : (
              <>
                <h2>{cls.title}</h2>
                <p>📅 <strong>{formatDate(cls.class_date)}</strong></p>
                <p>⏰ <strong>{formatTime(cls.time)} ({cls.duration} min)</strong></p>
                <p>🔗 <a href={cls.zoom_link} target="_blank" rel="noopener noreferrer" style={{ color: '#4FC3F7' }}>Join Meeting →</a></p>
                <button onClick={() => startEdit(cls)} style={{ marginTop: '16px', padding: '10px 20px', background: '#1976d2', color: 'white', borderRadius: '6px' }}>✏️ Edit</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
