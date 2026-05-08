import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addLog, clearLogs } from '../store/index.js';

// =============================================================================
// HOC 3 — withAuditLog
// =============================================================================
// PURPOSE: Automatically track every user action on any screen — open, submit,
//          field change — and log it to Redux (and optionally a backend API).
//
// In the real project:
//   - correlationId is added to every API header in src/services/api/index.js
//   - latestJourneyDetails.current tracks stepRecId across saves
//   - AuditTrail component shows history of actions
// This HOC centralises all that tracking in one place.
//
// HOW IT WORKS:
//   withAuditLog('LC_CREATE_SCREEN')(LCCreateForm)
//   → Logs SCREEN_OPEN when component mounts
//   → Logs SCREEN_CLOSE + time spent when component unmounts
//   → Intercepts onSubmit → logs FORM_SUBMIT before calling original
//   → Intercepts onChange → logs FIELD_CHANGE with field name + value
//   → All logs go to Redux (visible in the log panel below)
// =============================================================================

const withAuditLog = (screenName) => (WrappedComponent) => {
  const WithAuditLog = (props) => {
    const dispatch   = useDispatch();
    const userDetails = useSelector((state) => state.auth.userDetails);

    // Track time on screen — same as latestJourneyDetails in Edit.jsx
    const openedAt = useRef(Date.now());

    // ── Log OPEN event on mount ───────────────────────────────────────────────
    useEffect(() => {
      dispatch(addLog({
        id:        Date.now(),
        action:    'SCREEN_OPEN',
        screen:    screenName,
        userId:    userDetails?.userId,
        role:      userDetails?.role,
        timestamp: new Date().toLocaleTimeString()
      }));

      // ── Log CLOSE event on unmount ──────────────────────────────────────────
      return () => {
        const timeSpentSec = Math.round((Date.now() - openedAt.current) / 1000);
        dispatch(addLog({
          id:          Date.now(),
          action:      'SCREEN_CLOSE',
          screen:      screenName,
          userId:      userDetails?.userId,
          detail:      `Time spent: ${timeSpentSec}s`,
          timestamp:   new Date().toLocaleTimeString()
        }));
      };
    }, []);

    // ── Intercept onSubmit ────────────────────────────────────────────────────
    // Same concept as how graphql HOC wraps props.onSaveImportLC in Edit.jsx
    const handleSubmitWithAudit = (formData) => {
      dispatch(addLog({
        id:        Date.now(),
        action:    'FORM_SUBMIT',
        screen:    screenName,
        userId:    userDetails?.userId,
        detail:    `Reference: ${formData?.companyReference || 'N/A'}`,
        timestamp: new Date().toLocaleTimeString()
      }));
      // Call original onSubmit if it exists
      if (props.onSubmit) props.onSubmit(formData);
    };

    // ── Intercept onChange ────────────────────────────────────────────────────
    const handleChangeWithAudit = (fieldName, value) => {
      dispatch(addLog({
        id:        Date.now(),
        action:    'FIELD_CHANGE',
        screen:    screenName,
        userId:    userDetails?.userId,
        detail:    `${fieldName}: "${value}"`,
        timestamp: new Date().toLocaleTimeString()
      }));
      if (props.onChange) props.onChange(fieldName, value);
    };

    // Pass everything through + replace onSubmit/onChange with audited versions
    return (
      <WrappedComponent
        {...props}
        onSubmit={handleSubmitWithAudit}
        onChange={handleChangeWithAudit}
      />
    );
  };

  WithAuditLog.displayName = `withAuditLog(${WrappedComponent.name})`;
  return WithAuditLog;
};

// =============================================================================
// DEMO SCREEN — A simple LC Create form (no audit code here!)
// =============================================================================
const LCCreateForm = ({ onSubmit, onChange }) => {
  const [form, setForm] = useState({
    companyReference: '',
    applicant:        'ACME Corporation',
    amount:           '',
    beneficiary:      ''
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    onChange(field, value); // HOC intercepts this
  };

  return (
    <div style={formStyles.wrap}>
      <h3 style={formStyles.title}>📝 LC Create Form</h3>
      <p style={formStyles.note}>
        Type in any field or click Submit — watch the <strong>Audit Log panel</strong> update automatically.
        This component has <strong>zero</strong> audit code.
      </p>

      {[
        { field: 'companyReference', label: 'Company Reference', placeholder: 'e.g. REF-2024-001' },
        { field: 'amount',           label: 'LC Amount (USD)',   placeholder: 'e.g. 500000' },
        { field: 'beneficiary',      label: 'Beneficiary Name', placeholder: 'e.g. Global Exports Ltd' }
      ].map(({ field, label, placeholder }) => (
        <div key={field} style={formStyles.group}>
          <label style={formStyles.label}>{label}</label>
          <input
            style={formStyles.input}
            placeholder={placeholder}
            value={form[field]}
            onChange={(e) => handleChange(field, e.target.value)}
          />
        </div>
      ))}

      <button
        style={formStyles.btn}
        onClick={() => onSubmit(form)} // HOC intercepts this
      >
        Submit LC
      </button>
    </div>
  );
};

// Wrap the form with withAuditLog HOC
const AuditedLCCreateForm = withAuditLog('LC_CREATE_SCREEN')(LCCreateForm);

// =============================================================================
// LOG PANEL — Shows Redux audit logs in real time
// =============================================================================
const AuditLogPanel = () => {
  const dispatch = useDispatch();
  const logs     = useSelector((state) => state.audit.logs);

  const actionColors = {
    SCREEN_OPEN:  '#3b82f6',
    SCREEN_CLOSE: '#8b5cf6',
    FORM_SUBMIT:  '#22c55e',
    FIELD_CHANGE: '#f59e0b'
  };

  return (
    <div style={logStyles.panel}>
      <div style={logStyles.header}>
        <h4 style={logStyles.title}>📋 Audit Log (Redux State)</h4>
        <button style={logStyles.clearBtn} onClick={() => dispatch(clearLogs())}>
          Clear
        </button>
      </div>
      {logs.length === 0
        ? <p style={logStyles.empty}>No logs yet — interact with the form above</p>
        : logs.map((log) => (
          <div key={log.id} style={logStyles.entry}>
            <span style={{ ...logStyles.badge, background: actionColors[log.action] || '#64748b' }}>
              {log.action}
            </span>
            <span style={logStyles.detail}>{log.detail || log.screen}</span>
            <span style={logStyles.time}>{log.timestamp}</span>
          </div>
        ))
      }
    </div>
  );
};

// =============================================================================
// DEMO WRAPPER — mounts/unmounts the form to demo SCREEN_OPEN/CLOSE logs
// =============================================================================
const WithAuditLogDemo = () => {
  const [showForm, setShowForm] = useState(true);

  return (
    <div style={demoStyles.wrap}>
      <div style={demoStyles.explainBox}>
        <h3 style={demoStyles.explainTitle}>🎯 How withAuditLog HOC Works</h3>
        <pre style={demoStyles.code}>{`const withAuditLog = (screenName) => (WrappedComponent) => {
  const WithAuditLog = (props) => {
    const dispatch = useDispatch();

    useEffect(() => {
      dispatch(addLog({ action: 'SCREEN_OPEN', screen: screenName }));
      return () => dispatch(addLog({ action: 'SCREEN_CLOSE', ... }));
    }, []);

    // Intercept onSubmit — log then call original
    const handleSubmit = (data) => {
      dispatch(addLog({ action: 'FORM_SUBMIT', ... }));
      props.onSubmit?.(data);
    };

    // Intercept onChange — log field changes
    const handleChange = (field, val) => {
      dispatch(addLog({ action: 'FIELD_CHANGE', detail: field }));
      props.onChange?.(field, val);
    };

    return <WrappedComponent {...props}
      onSubmit={handleSubmit}
      onChange={handleChange}
    />;
  };
  return WithAuditLog;
};`}</pre>
      </div>

      <div style={demoStyles.mountControl}>
        <button
          style={{ ...demoStyles.mountBtn, background: showForm ? '#ef4444' : '#22c55e' }}
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? '🔴 Unmount Form (triggers SCREEN_CLOSE)' : '🟢 Mount Form (triggers SCREEN_OPEN)'}
        </button>
      </div>

      <div style={demoStyles.split}>
        <div style={demoStyles.left}>
          {showForm
            ? <AuditedLCCreateForm />
            : <div style={demoStyles.unmounted}>Form unmounted — check Audit Log for SCREEN_CLOSE entry</div>
          }
        </div>
        <div style={demoStyles.right}>
          <AuditLogPanel />
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// STYLES
// =============================================================================
const formStyles = {
  wrap:  { padding: '20px' },
  title: { color: '#1e293b', marginBottom: '8px' },
  note:  { color: '#64748b', fontSize: '13px', marginBottom: '16px', fontStyle: 'italic' },
  group: { marginBottom: '14px' },
  label: { display: 'block', fontSize: '13px', color: '#475569', marginBottom: '4px', fontWeight: '500' },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', outline: 'none' },
  btn:   { background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', marginTop: '4px' }
};

const logStyles = {
  panel:    { background: '#0f172a', borderRadius: '8px', padding: '14px', height: '100%', minHeight: '300px', overflowY: 'auto' },
  header:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  title:    { color: '#e2e8f0', fontSize: '14px', margin: 0 },
  clearBtn: { background: '#374151', color: '#9ca3af', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  empty:    { color: '#4b5563', fontSize: '13px', textAlign: 'center', marginTop: '40px' },
  entry:    { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid #1e293b' },
  badge:    { color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap', fontWeight: 'bold' },
  detail:   { color: '#94a3b8', fontSize: '12px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  time:     { color: '#4b5563', fontSize: '11px', whiteSpace: 'nowrap' }
};

const demoStyles = {
  wrap:         { padding: '20px', maxWidth: '900px', margin: '0 auto' },
  explainBox:   { background: '#1e293b', borderRadius: '8px', padding: '16px', marginBottom: '20px' },
  explainTitle: { color: '#60a5fa', marginBottom: '10px', fontSize: '15px' },
  code:         { color: '#86efac', fontSize: '11px', lineHeight: '1.6', overflowX: 'auto', whiteSpace: 'pre-wrap' },
  mountControl: { marginBottom: '16px' },
  mountBtn:     { color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  split:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  left:         { background: '#fff', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', overflow: 'hidden' },
  right:        { borderRadius: '8px', overflow: 'hidden' },
  unmounted:    { padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }
};

export default WithAuditLogDemo;
