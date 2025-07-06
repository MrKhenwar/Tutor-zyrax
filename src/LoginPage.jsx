import React, { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/zylo/login/", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }
      const data = await response.json();
      console.log('Login response:', data);

      // Save tokens for authenticated requests
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);

      alert("Login successful!");
      window.location.href = "/";  // redirect to your dashboard page
    } catch (error) {
      console.error(error);
      alert("Login failed: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#111', color: '#fff' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '24px' }}>🔐 Login to Dashboard</h1>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ padding: '12px', margin: '8px', width: '300px', borderRadius: '8px', border: 'none' }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ padding: '12px', margin: '8px', width: '300px', borderRadius: '8px', border: 'none' }}
      />
      <button
        onClick={handleLogin}
        disabled={loading}
        style={{ padding: '12px 24px', marginTop: '16px', background: '#4CAF50', color: 'white', fontSize: '16px', borderRadius: '8px', cursor: 'pointer' }}>
        {loading ? "Logging in..." : "Login"}
      </button>
    </div>
  );
}
