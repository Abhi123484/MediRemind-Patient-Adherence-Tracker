import React, { useState, useEffect, useCallback } from 'react';
import { getMedications, addMedication, updateMedication, deleteMedication } from '../services/api';

const COLORS = ['#4A90D9', '#50C878', '#FF6B6B', '#FFB347', '#9B59B6', '#1ABC9C', '#E74C3C', '#3498DB'];

const EMPTY_FORM = {
  name: '', dosage: '', frequency: 'once_daily',
  scheduleTimes: ['08:00'], startDate: new Date().toISOString().split('T')[0],
  endDate: '', instructions: '', color: '#4A90D9'
};

function MedicationManager() {
  const [medications, setMedications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMeds = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getMedications();
      setMedications(data);
    } catch { setError('Failed to load medications'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMeds(); }, [fetchMeds]);

  const handleFrequencyChange = (freq) => {
    const timesMap = {
      once_daily: ['08:00'],
      twice_daily: ['08:00', '20:00'],
      three_times_daily: ['08:00', '14:00', '20:00'],
      weekly: ['08:00'],
      as_needed: []
    };
    setForm({ ...form, frequency: freq, scheduleTimes: timesMap[freq] || ['08:00'] });
  };

  const handleTimeChange = (index, value) => {
    const times = [...form.scheduleTimes];
    times[index] = value;
    setForm({ ...form, scheduleTimes: times });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await updateMedication(editingId, form);
      } else {
        await addMedication(form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      fetchMeds();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save medication');
    }
  };

  const handleEdit = (med) => {
    setForm({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      scheduleTimes: med.scheduleTimes,
      startDate: med.startDate ? med.startDate.split('T')[0] : '',
      endDate: med.endDate ? med.endDate.split('T')[0] : '',
      instructions: med.instructions || '',
      color: med.color || '#4A90D9'
    });
    setEditingId(med._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this medication?')) return;
    try {
      await deleteMedication(id);
      fetchMeds();
    } catch { setError('Failed to deactivate medication'); }
  };

  const frequencyLabels = {
    once_daily: 'Once Daily',
    twice_daily: 'Twice Daily',
    three_times_daily: 'Three Times Daily',
    weekly: 'Weekly',
    as_needed: 'As Needed'
  };

  if (loading) return <div className="loading">Loading medications...</div>;

  return (
    <div className="medications-page">
      <div className="page-header">
        <h1>My Medications</h1>
        <button
          className="btn btn-primary"
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(EMPTY_FORM); }}
        >
          {showForm ? 'Cancel' : '+ Add Medication'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <form className="med-form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Edit Medication' : 'New Medication'}</h2>

          <div className="form-row">
            <div className="form-group">
              <label>Medication Name</label>
              <input
                type="text"
                placeholder="e.g., Metformin"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Dosage</label>
              <input
                type="text"
                placeholder="e.g., 500mg"
                value={form.dosage}
                onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Frequency</label>
              <select value={form.frequency} onChange={(e) => handleFrequencyChange(e.target.value)}>
                {Object.entries(frequencyLabels).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Color Tag</label>
              <div className="color-picker">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch ${form.color === c ? 'selected' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setForm({ ...form, color: c })}
                  />
                ))}
              </div>
            </div>
          </div>

          {form.scheduleTimes.length > 0 && (
            <div className="form-group">
              <label>Schedule Times</label>
              <div className="time-inputs">
                {form.scheduleTimes.map((time, i) => (
                  <input
                    key={i}
                    type="time"
                    value={time}
                    onChange={(e) => handleTimeChange(i, e.target.value)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>End Date (optional)</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Instructions (optional)</label>
            <textarea
              placeholder="e.g., Take with food"
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              rows={2}
            />
          </div>

          <button type="submit" className="btn btn-primary">
            {editingId ? 'Update Medication' : 'Add Medication'}
          </button>
        </form>
      )}

      <div className="med-list">
        {medications.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">💊</span>
            <h3>No medications yet</h3>
            <p>Add your first medication to start tracking.</p>
          </div>
        ) : (
          medications.map(med => (
            <div key={med._id} className="med-list-card">
              <div className="med-color-bar" style={{ backgroundColor: med.color || '#4A90D9' }} />
              <div className="med-list-content">
                <div className="med-list-header">
                  <h3>{med.name}</h3>
                  <span className="med-dosage">{med.dosage}</span>
                </div>
                <div className="med-list-details">
                  <span>{frequencyLabels[med.frequency]}</span>
                  <span>{med.scheduleTimes?.join(', ')}</span>
                </div>
                {med.instructions && <p className="med-instructions">{med.instructions}</p>}
              </div>
              <div className="med-list-actions">
                <button className="btn btn-sm btn-outline" onClick={() => handleEdit(med)}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(med._id)}>Remove</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MedicationManager;
