// src/components/LoadingOverlay.js

import React from 'react';

const LoadingOverlay = () => {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="spinner"></div>
        <p>Loading map...</p>
        <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
          This may take a few seconds
        </p>
      </div>
    </div>
  );
};

export default LoadingOverlay;