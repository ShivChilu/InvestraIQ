import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

// Remote Browser Diagnostics
window.onerror = function (message, source, lineno, colno, error) {
  const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin.replace('5173', '5000');
  fetch(`${API_BASE_URL}/api/log-error`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      source,
      lineno,
      colno,
      stack: error ? error.stack : ''
    })
  }).catch(() => {});
  return false;
};

window.onunhandledrejection = function (event) {
  const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin.replace('5173', '5000');
  fetch(`${API_BASE_URL}/api/log-error`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Unhandled Promise Rejection: ' + (event.reason ? event.reason.message || event.reason : ''),
      stack: event.reason && event.reason.stack ? event.reason.stack : ''
    })
  }).catch(() => {});
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
