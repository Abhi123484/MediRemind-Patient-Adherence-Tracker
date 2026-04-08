import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register } from '../services/api';

function Register() {
  const { loginUser } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { data } = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone
      });
      loginUser(data.token, data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">💊</span>
          <h1>Create Account</h1>
          <p>Join MediRemind to track your medications</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone (optional)</label>
            <input
              id="phone"
              type="tel"
              placeholder="+1 234 567 8900"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              autoComplete="tel"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">I am a</label>
            <select
              id="role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Repeat password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
