import { configureStore, createSlice } from '@reduxjs/toolkit';

// ─── Auth Slice ───────────────────────────────────────────────────────────────
// Simulates what this project stores in Redux via login/reducer.js
// (getUserPreferences, getFeatureDetails, getUserDetails)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    // Simulates userDetails from getApplicantDetails API
    userDetails: {
      userId: 'john.doe@bank.com',
      userName: 'John Doe',
      dtpCustomerId: 'CUST-001',
      role: 'MAKER'
    },
    // Simulates featureDetails — feature flags like enablePredefinedClause in Edit.jsx
    featureDetails: {
      enableCreateLC: true,
      enableAmendLC: true,
      enableApproveLC: false,  // turned OFF — withPermission will block this
      enableViewReports: true
    },
    // Simulates userPreferences — language, timezone etc.
    userPreferences: {
      language: 'en',
      timezone: 'Asia/Singapore',
      dateFormat: 'DD MMM YYYY'
    }
  },
  reducers: {
    // Toggle a feature flag — so you can test withPermission live
    toggleFeature: (state, action) => {
      const feature = action.payload;
      state.featureDetails[feature] = !state.featureDetails[feature];
    },
    // Change user role
    setRole: (state, action) => {
      state.userDetails.role = action.payload;
    }
  }
});

export const { toggleFeature, setRole } = authSlice.actions;

// ─── Audit Slice ──────────────────────────────────────────────────────────────
// Stores audit log entries — withAuditLog HOC will dispatch here

const auditSlice = createSlice({
  name: 'audit',
  initialState: {
    logs: []
  },
  reducers: {
    addLog: (state, action) => {
      state.logs.unshift(action.payload); // newest first
    },
    clearLogs: (state) => {
      state.logs = [];
    }
  }
});

export const { addLog, clearLogs } = auditSlice.actions;

// ─── Store ────────────────────────────────────────────────────────────────────
export const store = configureStore({
  reducer: {
    auth:  authSlice.reducer,
    audit: auditSlice.reducer
  }
});
