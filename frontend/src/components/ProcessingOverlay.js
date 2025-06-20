// src/components/ProcessingOverlay.js

import React from 'react';

const ProcessingOverlay = ({ processingStep }) => {
  return (
    <div className="processing-overlay">
      <div className="processing-content">
        <div className="processing-spinner"></div>
        <p className="processing-text">{processingStep}</p>
      </div>
    </div>
  );
};

export default ProcessingOverlay;