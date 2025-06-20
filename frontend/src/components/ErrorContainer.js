// src/components/ErrorContainer.js

import React from 'react';

const ErrorContainer = ({ error, onRetry, onTryDifferentBasemap }) => {
  return (
    <div className="error-container">
      <div className="error-content">
        <h2>⚠️ Map Loading Error</h2>
        <p>{error}</p>
        <div style={{ marginTop: '1rem' }}>
          <button onClick={onRetry} style={{ marginRight: '0.5rem' }}>
            Retry
          </button>
          <button onClick={onTryDifferentBasemap}>
            Try Simple Basemap
          </button>
        </div>
        <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
          <p>This error often occurs due to network issues or basemap compatibility.</p>
        </div>
      </div>
    </div>
  );
};

export default ErrorContainer;