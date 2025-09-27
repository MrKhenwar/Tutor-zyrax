import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForceLogin, setShowForceLogin] = useState(false);
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, from]);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setLoginLoading(true);
    setError('');
    setShowForceLogin(false);

    const result = await login(username, password);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
      if (result.isDeviceLimitError) {
        setShowForceLogin(true);
      }
    }
    setLoginLoading(false);
  };
  
  const handleForceLogin = async () => {
    setLoginLoading(true);
    setError('');

    const result = await login(username, password); // For tutors, force login is the default

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
      setShowForceLogin(false);
    }
    setLoginLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎓</div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '8px', fontWeight: '600' }}>
            Welcome to Zyrax
          </h1>
          <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Sign in to manage your classes</p>
          {error && (
            <div style={{
              color: '#ff4444',
              backgroundColor: 'rgba(255, 68, 68, 0.1)',
              padding: '12px',
              borderRadius: '8px',
              marginTop: '16px',
              fontSize: '0.9rem',
              border: '1px solid rgba(255, 68, 68, 0.3)'
            }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%', padding: '16px', fontSize: '16px', borderRadius: '12px', border: '2px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.08)', color: '#fff', outline: 'none', transition: 'all 0.3s ease', marginBottom: '16px', boxSizing: 'border-box'
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%', padding: '16px', fontSize: '16px', borderRadius: '12px', border: '2px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.08)', color: '#fff', outline: 'none', transition: 'all 0.3s ease', boxSizing: 'border-box'
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') { showForceLogin ? handleForceLogin() : handleLogin(); } }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button onClick={handleLogin} disabled={loginLoading} style={{ width: '100%', padding: '16px', background: loginLoading ? '#666' : 'linear-gradient(45deg, #4CAF50, #45a049)', color: 'white', fontSize: '16px', fontWeight: '600', borderRadius: '12px', border: 'none', cursor: loginLoading ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease', boxShadow: loginLoading ? 'none' : '0 4px 15px rgba(76, 175, 80, 0.3)'}}>
            {loginLoading && !showForceLogin ? 'Signing in...' : 'Sign In'}
          </button>

          {showForceLogin && (
            <>
              <div style={{ textAlign: 'center', color: '#ff9800', fontSize: '14px', padding: '8px', backgroundColor: 'rgba(255, 152, 0, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 152, 0, 0.3)'}}>
                ⚠️ Device limit reached. Force login will log you out from other devices.
              </div>
              <button onClick={handleForceLogin} disabled={loginLoading} style={{ width: '100%', padding: '16px', background: loginLoading ? '#666' : 'linear-gradient(45deg, #ff5722, #f44336)', color: 'white', fontSize: '16px', fontWeight: '600', borderRadius: '12px', border: 'none', cursor: loginLoading ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease', boxShadow: loginLoading ? 'none' : '0 4px 15px rgba(255, 87, 34, 0.3)'}}>
                {loginLoading ? 'Force Logging In...' : "🔑 Force Login"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
