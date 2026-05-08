import React, { useState } from 'react';
import WithPermissionDemo  from './hocs/WithPermissionDemo.jsx';
import WithApiStateDemo    from './hocs/WithApiStateDemo.jsx';
import WithAuditLogDemo    from './hocs/WithAuditLogDemo.jsx';

// Add spinner keyframe animation globally
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

// =============================================================================
// TABS CONFIG
// =============================================================================
const TABS = [
  {
    id:          'permission',
    label:       '🔒 HOC 1 — withPermission',
    subtitle:    'Role-based access control',
    component:   WithPermissionDemo,
    description: 'Protects any screen based on Redux feature flags. Toggle flags to see the screen appear/disappear instantly.'
  },
  {
    id:          'apistate',
    label:       '⏳ HOC 2 — withApiState',
    subtitle:    'Loading + Error wrapper',
    component:   WithApiStateDemo,
    description: 'Wraps any component that needs API data. Handles spinner, error, and retry automatically — the component itself is clean.'
  },
  {
    id:          'auditlog',
    label:       '📋 HOC 3 — withAuditLog',
    subtitle:    'Cross-cutting audit tracking',
    component:   WithAuditLogDemo,
    description: 'Transparently intercepts onSubmit and onChange to log every user action to Redux. The form has zero audit code.'
  }
];

// =============================================================================
// APP
// =============================================================================
const App = () => {
  const [activeTab, setActiveTab] = useState('permission');

  const active = TABS.find((t) => t.id === activeTab);
  const ActiveComponent = active.component;

  return (
    <div style={styles.app}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>⚛️ HOC Pattern — Learning App</h1>
        <p style={styles.headerSub}>
          Enterprise-level examples modelled on the ILC Trade Finance project
        </p>
      </div>

      {/* Tab Nav */}
      <div style={styles.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {})
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            <span style={styles.tabLabel}>{tab.label}</span>
            <span style={styles.tabSub}>{tab.subtitle}</span>
          </button>
        ))}
      </div>

      {/* Description banner */}
      <div style={styles.descBanner}>
        <strong>What this demo shows: </strong>{active.description}
      </div>

      {/* Active HOC Demo */}
      <div style={styles.content}>
        <ActiveComponent />
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p>
          <strong>HOC Rule:</strong> A function that takes a component → returns an enhanced component.
          &nbsp;|&nbsp;
          <code style={styles.footerCode}>withPermission('feature')(MyScreen)</code>
          &nbsp;|&nbsp;
          <code style={styles.footerCode}>withApiState(fetchFn)(MyScreen)</code>
          &nbsp;|&nbsp;
          <code style={styles.footerCode}>withAuditLog('SCREEN')(MyScreen)</code>
        </p>
      </div>
    </div>
  );
};

// =============================================================================
// STYLES
// =============================================================================
const styles = {
  app: {
    minHeight:    '100vh',
    background:   '#f0f2f5',
    fontFamily:   'Arial, sans-serif'
  },
  header: {
    background:   'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
    padding:      '24px 32px',
    color:        '#fff'
  },
  headerTitle: {
    fontSize:   '22px',
    fontWeight: 'bold',
    margin:     '0 0 6px'
  },
  headerSub: {
    color:    '#94a3b8',
    fontSize: '14px',
    margin:   0
  },
  tabBar: {
    display:        'flex',
    background:     '#fff',
    borderBottom:   '2px solid #e2e8f0',
    padding:        '0 16px',
    gap:            '4px',
    overflowX:      'auto'
  },
  tab: {
    display:       'flex',
    flexDirection: 'column',
    padding:       '14px 20px',
    border:        'none',
    borderBottom:  '3px solid transparent',
    background:    'transparent',
    cursor:        'pointer',
    textAlign:     'left',
    minWidth:      '200px'
  },
  tabActive: {
    borderBottom: '3px solid #3b82f6',
    background:   '#eff6ff'
  },
  tabLabel: {
    fontSize:   '14px',
    fontWeight: '600',
    color:      '#1e293b'
  },
  tabSub: {
    fontSize: '12px',
    color:    '#64748b',
    marginTop: '2px'
  },
  descBanner: {
    background:   '#eff6ff',
    borderLeft:   '4px solid #3b82f6',
    padding:      '10px 20px',
    fontSize:     '13px',
    color:        '#1e40af'
  },
  content: {
    padding:  '0 0 40px'
  },
  footer: {
    background:   '#1e293b',
    color:        '#94a3b8',
    padding:      '16px 24px',
    fontSize:     '12px',
    textAlign:    'center'
  },
  footerCode: {
    background:   '#0f172a',
    color:        '#86efac',
    padding:      '2px 6px',
    borderRadius: '4px',
    fontFamily:   'monospace'
  }
};

export default App;
