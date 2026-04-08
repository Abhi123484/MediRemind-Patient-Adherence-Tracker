import React, { useState, useEffect, useCallback } from 'react';
import { getDoctorPatients, getPatientReport } from '../services/api';

function DoctorDashboard() {
  const [patients, setPatients] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getDoctorPatients();
      setPatients(data);
    } catch {
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const viewReport = async (patientId) => {
    try {
      setReportLoading(true);
      const { data } = await getPatientReport(patientId);
      setSelectedReport(data);
    } catch {
      setError('Failed to load patient report');
    } finally {
      setReportLoading(false);
    }
  };

  const getAdherenceColor = (rate) => {
    if (rate >= 80) return '#4CAF50';
    if (rate >= 50) return '#FFC107';
    return '#F44336';
  };

  if (loading) return <div className="loading">Loading patients...</div>;

  return (
    <div className="doctor-dashboard">
      <h1>Patient Adherence Dashboard</h1>
      <p className="subtitle">Monitor medication adherence for your assigned patients</p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="patients-grid">
        {patients.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">👨‍⚕️</span>
            <h3>No patients assigned</h3>
            <p>Patients will appear here once they're assigned to you.</p>
          </div>
        ) : (
          patients.map(patient => (
            <div key={patient._id} className="patient-card">
              <div className="patient-header">
                <div className="patient-avatar">
                  {patient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3>{patient.name}</h3>
                  <span className="patient-email">{patient.email}</span>
                </div>
              </div>

              <div className="patient-adherence">
                <div
                  className="adherence-bar"
                  style={{
                    width: `${patient.weeklyAdherence}%`,
                    backgroundColor: getAdherenceColor(patient.weeklyAdherence)
                  }}
                />
              </div>
              <div className="patient-stats">
                <span style={{ color: getAdherenceColor(patient.weeklyAdherence) }}>
                  {patient.weeklyAdherence}% adherence
                </span>
                <span>{patient.takenDoses}/{patient.totalDoses} doses this week</span>
              </div>

              <button
                className="btn btn-outline btn-full"
                onClick={() => viewReport(patient._id)}
              >
                View Full Report
              </button>
            </div>
          ))
        )}
      </div>

      {/* Detailed Report Modal */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedReport(null)}>✕</button>

            {reportLoading ? (
              <div className="loading">Loading report...</div>
            ) : (
              <>
                <h2>Patient Report: {selectedReport.patient.name}</h2>
                <p className="report-period">
                  {new Date(selectedReport.period.start).toLocaleDateString()} –{' '}
                  {new Date(selectedReport.period.end).toLocaleDateString()}
                </p>

                <div className="report-summary">
                  <div className="report-stat">
                    <span className="report-stat-value">{selectedReport.summary.adherenceRate}%</span>
                    <span className="report-stat-label">Overall Adherence</span>
                  </div>
                  <div className="report-stat">
                    <span className="report-stat-value">{selectedReport.summary.taken}</span>
                    <span className="report-stat-label">Doses Taken</span>
                  </div>
                  <div className="report-stat">
                    <span className="report-stat-value">{selectedReport.summary.missed}</span>
                    <span className="report-stat-label">Doses Missed</span>
                  </div>
                </div>

                <h3>Medication Breakdown</h3>
                <div className="med-breakdown">
                  {selectedReport.medicationBreakdown.map((med, i) => (
                    <div key={i} className="breakdown-row">
                      <div className="breakdown-info">
                        <span className="breakdown-name">{med.medication.name}</span>
                        <span className="breakdown-dosage">{med.medication.dosage}</span>
                      </div>
                      <div className="breakdown-bar-container">
                        <div
                          className="breakdown-bar"
                          style={{
                            width: `${med.adherenceRate}%`,
                            backgroundColor: getAdherenceColor(med.adherenceRate)
                          }}
                        />
                      </div>
                      <span className="breakdown-rate">{med.adherenceRate}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorDashboard;
