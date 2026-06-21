import React, { useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { User, Mail, Lock, Phone, Eye, EyeOff, LogIn, UserPlus, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function Login() {
  const { loginUser, registerUser, logoutUser, userInfo } = useContext(ShopContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Tab State: 'login', 'register', or 'admin'
  const [activeTab, setActiveTab] = useState('login');

  // Input fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Get redirect path
  const params = new URLSearchParams(location.search);
  const redirect = params.get('redirect') || '/';

  // If already logged in, redirect
  useEffect(() => {
    if (userInfo) {
      if (userInfo.isAdmin) navigate('/admin');
      else navigate(redirect);
    }
  }, [userInfo, redirect, navigate]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setErrorMsg('');
    setSuccessMsg('');
    setShowPassword(false);
  };

  // Final Registration/Login Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      // 1. Client-Side Input Validations
      const cleanEmail = email.trim();
      if (!cleanEmail) throw new Error('Email address is required.');
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        throw new Error('Please enter a valid email address.');
      }

      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      if (activeTab === 'register') {
        if (!name.trim()) throw new Error('Full name is required.');
        if (!phone.trim() || phone.length !== 10) {
          throw new Error('Please enter a valid 10-digit mobile number.');
        }
        
        await registerUser(name.trim(), cleanEmail.toLowerCase(), password, phone.trim());
        setSuccessMsg('Account created successfully! Redirecting...');
      } else if (activeTab === 'admin') {
        const result = await loginUser(cleanEmail, password);
        if (result && result.user && !result.user.isAdmin) {
          logoutUser();
          throw new Error('Access Denied: Customer credentials cannot access the Admin Portal.');
        }
        setSuccessMsg('Admin authorized! Loading console...');
      } else {
        // Customer login
        await loginUser(cleanEmail, password);
        setSuccessMsg('Success! Logging you in...');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page-wrapper container animate-fade" style={{ position: 'relative', overflow: 'hidden', minHeight: 'calc(100vh - 120px)' }}>
      {/* Glowing background orbs for depth & luxury aesthetic */}
      <div className="glowing-orb orb-primary" style={{ transform: 'scale(1.2)' }}></div>
      <div className="glowing-orb orb-secondary" style={{ transform: 'scale(1.2)' }}></div>

      <div className="auth-card-container glass-panel" style={{ position: 'relative', zIndex: 1, backdropFilter: 'blur(20px)' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-block', width: '60px', height: '60px', margin: '0 auto 12px' }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
              {/* Lotus Petals */}
              <path d="M 50,15 C 44,28 43,45 43,58 L 57,58 C 57,45 56,28 50,15 Z" fill="#800c14" />
              <path d="M 37,27 C 32,35 34,48 44,58 L 49,58 C 42,48 40,38 37,27 Z" fill="#00b4d8" />
              <path d="M 28,39 C 23,47 29,56 42,58 L 45,58 C 34,51 29,46 28,39 Z" fill="#e6007e" />
              <path d="M 63,27 C 68,35 66,48 56,58 L 51,58 C 58,48 60,38 63,27 Z" fill="#5c6bc0" />
              <path d="M 72,39 C 77,47 71,56 58,58 L 55,58 C 66,51 71,46 72,39 Z" fill="#9c27b0" />
              {/* Peacock Silhouette */}
              <path d="M 55,58 C 55,48 53,42 53,36 C 53,32 50,30 47,32 L 41,30 L 43,35 C 41,36 42,39 45,40 C 47,41 49,40 50,37 C 50,43 45,47 45,58 Z" fill="#ffffff" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--primary)', fontFamily: 'var(--font-serif)', marginBottom: '6px' }}>
            {activeTab === 'login' ? 'Welcome Back' : activeTab === 'register' ? 'Create Account' : 'Admin Portal'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {activeTab === 'login' 
              ? 'Sign in to access your orders and profile' 
              : activeTab === 'register' 
                ? 'Join Monika\'s Creation Boutique' 
                : 'Boutique Management Terminal'}
          </p>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button onClick={() => switchTab('login')} className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}>
            Sign In
          </button>
          <button onClick={() => switchTab('register')} className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}>
            Register
          </button>
          <button onClick={() => switchTab('admin')} className={`auth-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}>
            Admin Portal
          </button>
        </div>

        {/* Error / Success banners */}
        {errorMsg && (
          <div className="error-banner" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && !errorMsg && (
          <div style={{
            background: 'rgba(46, 125, 50, 0.08)',
            border: '1px solid rgba(46, 125, 50, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            fontSize: '0.85rem',
            color: 'var(--success)',
            marginBottom: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ShieldCheck size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Admin notice */}
        {activeTab === 'admin' && (
          <div style={{
            marginBottom: '20px', padding: '12px 16px',
            background: 'rgba(74, 14, 78, 0.05)', borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(124, 45, 130, 0.2)', fontSize: '0.8rem',
            color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <Lock size={14} style={{ flexShrink: 0 }} />
            <span><strong>Administrator Access:</strong> Verified credentials are required to modify products, view orders, and manage coupons.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">

          {/* ===== REGISTER TAB ===== */}
          {activeTab === 'register' && (
            <>
              <div className="auth-form-group">
                <label className="auth-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                    <User size={18} />
                  </span>
                  <input
                    type="text" placeholder="Enter your full name"
                    value={name} onChange={(e) => setName(e.target.value)}
                    className="form-input" style={{ paddingLeft: '46px' }} required
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                    <Phone size={18} />
                  </span>
                  <input
                    type="tel" placeholder="10-digit mobile number"
                    value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="form-input" style={{ paddingLeft: '46px' }} pattern="[0-9]{10}"
                    required
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                    <Mail size={18} />
                  </span>
                  <input
                    type="email" placeholder="name@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="form-input" style={{ paddingLeft: '46px' }} required
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"} placeholder="Min 6 characters"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="form-input" style={{ paddingLeft: '46px', paddingRight: '46px' }} required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                      display: 'flex', alignItems: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ===== LOGIN & ADMIN TABS ===== */}
          {(activeTab === 'login' || activeTab === 'admin') && (
            <>
              <div className="auth-form-group">
                <label className="auth-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                    <Mail size={18} />
                  </span>
                  <input
                    type="email" placeholder="name@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="form-input" style={{ paddingLeft: '46px' }} required
                  />
                </div>
              </div>
              
              <div className="auth-form-group">
                <label className="auth-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"} placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="form-input" style={{ paddingLeft: '46px', paddingRight: '46px' }} required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                      display: 'flex', alignItems: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}
            disabled={submitting}
          >
            {submitting ? (
              <span>Please wait...</span>
            ) : (
              <>
                {activeTab === 'login' && (
                  <>
                    <LogIn size={18} />
                    <span>Sign In</span>
                  </>
                )}
                {activeTab === 'admin' && (
                  <>
                    <Lock size={18} />
                    <span>Admin Login</span>
                  </>
                )}
                {activeTab === 'register' && (
                  <>
                    <UserPlus size={18} />
                    <span>Create Account</span>
                  </>
                )}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
