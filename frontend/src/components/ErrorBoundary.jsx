import React from 'react';

/**
 * ErrorBoundary catches rendering errors in the component tree below it
 * and shows a graceful fallback UI instead of a blank white screen.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught rendering error:', error, errorInfo);
  }

  handleReset() {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0a0a0f 0%, #111827 100%)',
          color: '#e5e7eb',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '16px',
            padding: '2.5rem 3rem',
            maxWidth: '560px'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f87171' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#9ca3af', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              The dashboard encountered an unexpected rendering error. This is usually caused by
              malformed API data or a network parsing issue.
            </p>
            {this.state.error && (
              <pre style={{
                background: 'rgba(0,0,0,0.4)',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.75rem',
                color: '#f87171',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '1.5rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={() => this.handleReset()}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 2rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
