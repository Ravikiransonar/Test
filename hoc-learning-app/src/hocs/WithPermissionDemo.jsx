import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleFeature } from '../store/index.js';

// =============================================================================
// HOC 1 — withPermission
// =============================================================================
// PURPOSE: Protect any screen/component based on feature flags from Redux.
//
// In the real project (Edit.jsx), featureDetails comes from Redux via:
//   connect((state) => ({ featureDetails: getFeatureDetails(state) }))
// Here we do the same using useSelector — modern way.
//
// HOW IT WORKS:
//   withPermission('enableAmendLC')(LCAmendScreen)
//   → Returns a new component that checks featureDetails.enableAmendLC
//   → If true  → renders LCAmendScreen
//   → If false → renders "Access Denied" screen
// =============================================================================

const withPermission = (requiredFeature) => (WrappedComponent) => {
  // The new enhanced component
  const PermissionGuard = (props) => {
    const featureDetails = useSelector((state) => state.auth.featureDetails);
    const userDetails    = useSelector((state) => state.auth.userDetails);

    const isLoggedIn    = !!userDetails?.userId;
    const hasPermission = featureDetails?.[requiredFeature] === true;

    // Guard 1 — not logged in
    if (!isLoggedIn) {
      return (
        <div style={styles.blocked}>
          <span style={styles.icon}>🔒</span>
          <h3>Session Expired</h3>
          <p>Please log in to continue.</p>
        </div>
      );
    }

    // Guard 2 — feature is disabled
    if (!hasPermission) {
      return (
        <div style={styles.blocked}>
          <span style={styles.icon}>🚫</span>
          <h3>Access Denied</h3>
          <p>
            You do not have permission to access this screen.
            <br />
            <strong>Required feature flag:</strong>{' '}
            <code style={styles.code}>{requiredFeature}</code>
          </p>
          <p style={styles.hint}>
            ↑ Use the toggle button above to enable it and watch the screen appear!
          </p>
        </div>
      );
    }

    // All good — render the original component with ALL its props untouched
    return <WrappedComponent {...props} />;
  };

  // Name shown in React DevTools — helps with debugging
  PermissionGuard.displayName = `withPermission(${WrappedComponent.displayName || WrappedComponent.name})`;

  return PermissionGuard;
};

// =============================================================================
// DEMO SCREEN — The actual component being protected
// =============================================================================
const LCApproveScreen = () => (
  <div style={styles.screen}>
    <h2 style={styles.screenTitle}>✅ LC Approve Screen</h2>
    <p>You can see this because <code>enableApproveLC</code> is <strong>true</strong>.</p>
    <div style={styles.card}>
      <div style={styles.row}><span style={styles.label}>LC Reference</span><span>LC-2024-001</span></div>
      <div style={styles.row}><span style={styles.label}>Applicant</span><span>ACME Corp</span></div>
      <div style={styles.row}><span style={styles.label}>Amount</span><span>USD 500,000</span></div>
      <div style={styles.row}><span style={styles.label}>Status</span><span style={styles.badge}>Pending Approval</span></div>
    </div>
    <button style={styles.approveBtn}>Approve LC</button>
  </div>
);

// Wrap it — only users with 'enableApproveLC' feature can see this
const ProtectedLCApproveScreen = withPermission('enableApproveLC')(LCApproveScreen);

// =============================================================================
// DEMO WRAPPER — Shows the toggle controls + the protected screen
// =============================================================================
const WithPermissionDemo = () => {
  const dispatch       = useDispatch();
  const featureDetails = useSelector((state) => state.auth.featureDetails);
  const userDetails    = useSelector((state) => state.auth.userDetails);

  return (
    <div style={styles.demo}>
      <div style={styles.explainBox}>
        <h3 style={styles.explainTitle}>🎯 How withPermission HOC Works</h3>
        <pre style={styles.code2}>{`const withPermission = (requiredFeature) => (WrappedComponent) => {
  const PermissionGuard = (props) => {
    const featureDetails = useSelector(state => state.auth.featureDetails);
    const hasPermission  = featureDetails?.[requiredFeature] === true;

    if (!hasPermission) return <AccessDenied />;     // blocked
    return <WrappedComponent {...props} />;           // allowed
  };
  return PermissionGuard;
};

// Usage:
const ProtectedScreen = withPermission('enableApproveLC')(LCApproveScreen);`}</pre>
      </div>

      {/* Toggle controls */}
      <div style={styles.controls}>
        <h4 style={styles.controlTitle}>🎛️ Toggle Feature Flags (Redux State)</h4>
        <p style={styles.controlHint}>Click a flag to toggle it — watch the screen below change instantly</p>
        <div style={styles.toggleRow}>
          {Object.entries(featureDetails).map(([key, value]) => (
            <div key={key} style={styles.toggleItem}>
              <span style={styles.flagName}>{key}</span>
              <button
                style={{ ...styles.toggleBtn, background: value ? '#22c55e' : '#ef4444' }}
                onClick={() => dispatch(toggleFeature(key))}
              >
                {value ? 'ON' : 'OFF'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* User info */}
      <div style={styles.userInfo}>
        <span>👤 Logged in as: <strong>{userDetails.userName}</strong> ({userDetails.role})</span>
      </div>

      {/* The protected screen — reacts to flag changes immediately */}
      <div style={styles.result}>
        <h4 style={styles.resultLabel}>👇 Protected Component (enableApproveLC)</h4>
        <ProtectedLCApproveScreen />
      </div>
    </div>
  );
};

// =============================================================================
// STYLES
// =============================================================================
const styles = {
  demo:         { padding: '20px', maxWidth: '800px', margin: '0 auto' },
  explainBox:   { background: '#1e293b', borderRadius: '8px', padding: '16px', marginBottom: '20px' },
  explainTitle: { color: '#60a5fa', marginBottom: '10px', fontSize: '15px' },
  code2:        { color: '#86efac', fontSize: '12px', lineHeight: '1.6', overflowX: 'auto', whiteSpace: 'pre-wrap' },
  controls:     { background: '#fff', borderRadius: '8px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  controlTitle: { marginBottom: '6px', color: '#1e293b' },
  controlHint:  { color: '#64748b', fontSize: '13px', marginBottom: '12px' },
  toggleRow:    { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  toggleItem:   { display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' },
  flagName:     { fontSize: '13px', fontFamily: 'monospace', color: '#475569' },
  toggleBtn:    { color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
  userInfo:     { background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px', fontSize: '14px', color: '#0369a1' },
  result:       { background: '#fff', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', overflow: 'hidden' },
  resultLabel:  { background: '#f8fafc', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '14px' },
  // Blocked screen
  blocked:      { padding: '40px', textAlign: 'center', color: '#64748b' },
  icon:         { fontSize: '40px', display: 'block', marginBottom: '12px' },
  hint:         { marginTop: '12px', color: '#94a3b8', fontSize: '13px' },
  code:         { background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' },
  // Allowed screen
  screen:       { padding: '24px' },
  screenTitle:  { marginBottom: '16px', color: '#16a34a' },
  card:         { background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' },
  row:          { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' },
  label:        { color: '#64748b', fontSize: '14px' },
  badge:        { background: '#fef3c7', color: '#92400e', padding: '2px 10px', borderRadius: '12px', fontSize: '13px' },
  approveBtn:   { background: '#16a34a', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }
};

export default WithPermissionDemo;
