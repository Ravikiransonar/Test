import React, { useState, useEffect } from 'react';

// =============================================================================
// HOC 2 — withApiState
// =============================================================================
// PURPOSE: Any screen that needs to fetch data before rendering gets:
//   - Automatic loading spinner
//   - Automatic error handling
//   - Data injected as props once ready
//
// In the real project, every screen has this pattern manually:
//   const [dataLoaded, setDataLoaded] = useState(false);
//   useEffect(() => { getViewDetails(); }, []);
//   {!dataLoaded && <LoaderSpinner />}
//
// This HOC extracts all of that into one reusable wrapper.
//
// HOW IT WORKS:
//   withApiState(fetchFn)(LCViewScreen)
//   → Calls fetchFn(props) on mount
//   → Shows spinner while loading
//   → Shows error if it fails
//   → Renders LCViewScreen with data injected when done
// =============================================================================

// ── Shared UI components (same as LoaderSpinner in the real project) ──────────
const Spinner = () => (
  <div style={spinnerStyles.wrap}>
    <div style={spinnerStyles.spinner} />
    <p style={spinnerStyles.text}>Loading LC details...</p>
  </div>
);

const ErrorBanner = ({ message, onRetry }) => (
  <div style={errorStyles.wrap}>
    <span style={errorStyles.icon}>⚠️</span>
    <h3 style={errorStyles.title}>Failed to load data</h3>
    <p style={errorStyles.msg}>{message}</p>
    <button style={errorStyles.btn} onClick={onRetry}>Retry</button>
  </div>
);

// ── The HOC ───────────────────────────────────────────────────────────────────
const withApiState = (fetchFn) => (WrappedComponent) => {
  const WithApiState = (props) => {
    const [data,      setData]      = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error,     setError]     = useState(null);
    const [retryKey,  setRetryKey]  = useState(0); // incrementing this re-triggers useEffect

    useEffect(() => {
      setIsLoading(true);
      setError(null);

      // Call the fetch function — receives props so it can use
      // location, stepRecId, etc. — same as getViewDetails(props)
      fetchFn(props)
        .then((result) => {
          setData(result);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Something went wrong');
          setIsLoading(false);
        });
    }, [retryKey]); // retryKey changes → effect re-runs → retry!

    const handleRetry = () => setRetryKey((k) => k + 1);

    if (isLoading) return <Spinner />;
    if (error)     return <ErrorBanner message={error} onRetry={handleRetry} />;

    // Success → pass data + all original props to the wrapped screen
    return <WrappedComponent {...props} data={data} />;
  };

  WithApiState.displayName = `withApiState(${WrappedComponent.name})`;
  return WithApiState;
};

// =============================================================================
// DEMO: Simulated API functions
// =============================================================================

// Simulates a SUCCESSFUL API call (like viewImportLC in the project)
const fetchLCDetailsSuccess = () =>
  new Promise((resolve) =>
    setTimeout(() =>
      resolve({
        companyReference: 'LC-2024-SGP-0042',
        applicant:        'ACME Corporation',
        beneficiary:      'Global Exports Ltd',
        amount:           'USD 750,000.00',
        expiryDate:       '31 Dec 2024',
        issuingBank:      'DBS Bank Singapore',
        status:           'Active',
        processingSystem: 'TXP',
        bookingLocation:  'Singapore'
      }), 2000) // 2 second delay to show spinner
  );

// Simulates a FAILED API call — toggle this to see error state
const fetchLCDetailsFailure = () =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Network error: Unable to reach backend server')), 1500)
  );

// =============================================================================
// DEMO SCREEN — The actual component (zero loading/error code here!)
// =============================================================================
const LCViewScreen = ({ data }) => (
  <div style={screenStyles.wrap}>
    <h3 style={screenStyles.title}>📄 LC View Screen</h3>
    <p style={screenStyles.note}>
      This component has <strong>zero</strong> loading or error code.
      The HOC handled everything.
    </p>
    <div style={screenStyles.grid}>
      {Object.entries(data).map(([key, val]) => (
        <div key={key} style={screenStyles.row}>
          <span style={screenStyles.label}>{key}</span>
          <span style={screenStyles.value}>{val}</span>
        </div>
      ))}
    </div>
  </div>
);

// Two versions — success and failure
const LCViewSuccess = withApiState(fetchLCDetailsSuccess)(LCViewScreen);
const LCViewFailure = withApiState(fetchLCDetailsFailure)(LCViewScreen);

// =============================================================================
// DEMO WRAPPER
// =============================================================================
const WithApiStateDemo = () => {
  const [scenario, setScenario] = useState('success');

  return (
    <div style={demoStyles.wrap}>
      <div style={demoStyles.explainBox}>
        <h3 style={demoStyles.explainTitle}>🎯 How withApiState HOC Works</h3>
        <pre style={demoStyles.code}>{`const withApiState = (fetchFn) => (WrappedComponent) => {
  const WithApiState = (props) => {
    const [data, setData]         = useState(null);
    const [isLoading, setLoading] = useState(true);
    const [error, setError]       = useState(null);

    useEffect(() => {
      fetchFn(props)
        .then(result => { setData(result); setLoading(false); })
        .catch(err   => { setError(err.message); setLoading(false); });
    }, []);

    if (isLoading) return <Spinner />;         // ← automatic
    if (error)     return <ErrorBanner />;     // ← automatic
    return <WrappedComponent {...props} data={data} />;  // ← data injected!
  };
  return WithApiState;
};

// Usage:
const LCViewScreen    = ({ data }) => <div>{data.companyReference}</div>;
const LCViewWithState = withApiState(fetchLCDetails)(LCViewScreen);`}</pre>
      </div>

      <div style={demoStyles.controls}>
        <h4>🎛️ Choose Scenario</h4>
        <div style={demoStyles.btnRow}>
          <button
            style={{ ...demoStyles.scBtn, ...(scenario === 'success' ? demoStyles.active : {}) }}
            onClick={() => setScenario('success')}
          >
            ✅ Success (2s delay)
          </button>
          <button
            style={{ ...demoStyles.scBtn, ...(scenario === 'failure' ? demoStyles.activeRed : {}) }}
            onClick={() => setScenario('failure')}
          >
            ❌ Failure (1.5s delay)
          </button>
        </div>
        <p style={demoStyles.hint}>Switch scenario to remount and see spinner → result</p>
      </div>

      <div style={demoStyles.result}>
        <h4 style={demoStyles.resultLabel}>👇 Component wrapped with withApiState</h4>
        {scenario === 'success'
          ? <LCViewSuccess key="success" />
          : <LCViewFailure key="failure" />
        }
      </div>
    </div>
  );
};

// =============================================================================
// STYLES
// =============================================================================
const spinnerStyles = {
  wrap:    { padding: '40px', textAlign: 'center' },
  spinner: { width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' },
  text:    { color: '#64748b', fontSize: '14px' }
};

const errorStyles = {
  wrap:  { padding: '40px', textAlign: 'center' },
  icon:  { fontSize: '40px', display: 'block', marginBottom: '12px' },
  title: { color: '#ef4444', marginBottom: '8px' },
  msg:   { color: '#64748b', marginBottom: '16px', fontSize: '14px' },
  btn:   { background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer' }
};

const screenStyles = {
  wrap:  { padding: '24px' },
  title: { color: '#1e293b', marginBottom: '8px' },
  note:  { color: '#64748b', fontSize: '13px', marginBottom: '16px', fontStyle: 'italic' },
  grid:  { display: 'grid', gap: '8px' },
  row:   { display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' },
  label: { color: '#64748b', fontSize: '13px', fontFamily: 'monospace' },
  value: { color: '#1e293b', fontSize: '13px', fontWeight: '500' }
};

const demoStyles = {
  wrap:        { padding: '20px', maxWidth: '800px', margin: '0 auto' },
  explainBox:  { background: '#1e293b', borderRadius: '8px', padding: '16px', marginBottom: '20px' },
  explainTitle:{ color: '#60a5fa', marginBottom: '10px', fontSize: '15px' },
  code:        { color: '#86efac', fontSize: '11.5px', lineHeight: '1.6', overflowX: 'auto', whiteSpace: 'pre-wrap' },
  controls:    { background: '#fff', borderRadius: '8px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  btnRow:      { display: 'flex', gap: '10px', margin: '12px 0' },
  scBtn:       { padding: '8px 16px', borderRadius: '6px', border: '2px solid #e2e8f0', cursor: 'pointer', background: '#f8fafc', fontSize: '14px' },
  active:      { borderColor: '#22c55e', background: '#f0fdf4', color: '#15803d' },
  activeRed:   { borderColor: '#ef4444', background: '#fef2f2', color: '#dc2626' },
  hint:        { color: '#94a3b8', fontSize: '12px' },
  result:      { background: '#fff', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', overflow: 'hidden' },
  resultLabel: { background: '#f8fafc', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '14px' }
};

export default WithApiStateDemo;
