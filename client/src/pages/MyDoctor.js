import React, { useState, useEffect, useCallback } from 'react';
import { getDoctors, assignDoctor, getMe } from '../services/api';
import { useAuth } from '../context/AuthContext';

function MyDoctor() {
  const { user, loginUser } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [doctorsRes, meRes] = await Promise.all([getDoctors(), getMe()]);
      setDoctors(doctorsRes.data);
      setCurrentDoctor(meRes.data.user.assignedDoctor);
    } catch {
      setError('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAssign = async (doctorId) => {
    try {
      setAssigning(true);
      setError('');
      setSuccess('');
      const { data } = await assignDoctor(doctorId);
      setCurrentDoctor(data.assignedDoctor);
      setSuccess(`Dr. ${data.assignedDoctor.name} is now your assigned doctor`);

      // Update stored user context
      const token = localStorage.getItem('mediremind_token');
      if (token) {
        loginUser(token, { ...user });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign doctor');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <div className="loading">Loading doctors...</div>;

  return (
    <div className="my-doctor-page">
      <h1>My Doctor</h1>
      <p className="subtitle">Choose your doctor so they can monitor your medication adherence</p>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Current Doctor */}
      {currentDoctor && (
        <div className="current-doctor-card">
          <div className="current-doctor-badge">Current Doctor</div>
          <div className="doctor-card-body">
            <div className="doctor-avatar">
              {currentDoctor.name.charAt(0).toUpperCase()}
            </div>
            <div className="doctor-info">
              <h3>Dr. {currentDoctor.name}</h3>
              <span className="doctor-email">{currentDoctor.email}</span>
            </div>
            <span className="assigned-check">✓ Assigned</span>
          </div>
        </div>
      )}

      {/* Available Doctors */}
      <h2 style={{ margin: '24px 0 12px' }}>
        {currentDoctor ? 'Change Doctor' : 'Select a Doctor'}
      </h2>
      <div className="doctors-list">
        {doctors.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">👨‍⚕️</span>
            <h3>No doctors available</h3>
            <p>Doctors will appear here once they register.</p>
          </div>
        ) : (
          doctors.map(doc => {
            const isAssigned = currentDoctor && (currentDoctor.id === doc._id || currentDoctor._id === doc._id);
            return (
              <div key={doc._id} className={`doctor-list-card ${isAssigned ? 'assigned' : ''}`}>
                <div className="doctor-avatar">
                  {doc.name.charAt(0).toUpperCase()}
                </div>
                <div className="doctor-info">
                  <h3>Dr. {doc.name}</h3>
                  <span className="doctor-email">{doc.email}</span>
                  {doc.phone && <span className="doctor-phone">{doc.phone}</span>}
                </div>
                {isAssigned ? (
                  <span className="assigned-badge">✓ Your Doctor</span>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAssign(doc._id)}
                    disabled={assigning}
                  >
                    {assigning ? 'Assigning...' : 'Choose'}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default MyDoctor;
