// src/components/WelcomeScreen.js

import React, { useState } from 'react';

const WelcomeScreen = ({ onAssetClassSelected }) => {
  const [selectedAsset, setSelectedAsset] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  const assetClasses = [
    {
      id: 'office',
      name: 'Office',
      queryId: 3624,
      icon: '🏢',
      description: 'Commercial office buildings and spaces',
      color: 'var(--chart-blue)',
      bgColor: 'rgba(31, 55, 101, 0.1)'
    },
    {
      id: 'retail',
      name: 'Retail',
      queryId: 3622,
      icon: '🛍️',
      description: 'Shopping centers, stores and retail spaces',
      color: 'var(--chart-orange)',
      bgColor: 'rgba(210, 120, 90, 0.1)'
    },
    {
      id: 'industrial',
      name: 'Industrial',
      queryId: 3618,
      icon: '🏭',
      description: 'Warehouses, factories and industrial facilities',
      color: 'var(--chart-purple)',
      bgColor: 'rgba(136, 80, 115, 0.1)'
    },
    {
      id: 'residential',
      name: 'Residential',
      queryId: 3623,
      icon: '🏘️',
      description: 'Residential buildings and housing',
      color: 'var(--chart-celadon)',
      bgColor: 'rgba(128, 187, 173, 0.1)'
    }
  ];

  const handleAssetSelect = (asset) => {
    setSelectedAsset(asset.id);
    setIsAnimating(true);
    
    // Add a nice transition delay
    setTimeout(() => {
      onAssetClassSelected(asset);
    }, 800);
  };

  return (
    <div className={`welcome-screen ${isAnimating ? 'fade-out' : ''}`}>
      <div className="welcome-container">
        {/* Header */}
        <div className="welcome-header">
          <div className="cbre-logo">
            <div className="logo-circle">
              <span className="logo-text">CBRE</span>
            </div>
          </div>
          <h1 className="welcome-title">Welcome to Quality Building</h1>
          <p className="welcome-subtitle">
            Please choose your asset class to continue
          </p>
        </div>

        {/* Asset Class Selection */}
        <div className="asset-selection">
          <div className="asset-grid">
            {assetClasses.map((asset) => (
              <div
                key={asset.id}
                className={`asset-card ${selectedAsset === asset.id ? 'selected' : ''}`}
                onClick={() => handleAssetSelect(asset)}
                style={{
                  '--asset-color': asset.color,
                  '--asset-bg': asset.bgColor
                }}
              >
                <div className="asset-icon">{asset.icon}</div>
                <h3 className="asset-name">{asset.name}</h3>
                <p className="asset-description">{asset.description}</p>
                <div className="asset-overlay">
                  <span className="select-text">Select {asset.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="welcome-footer">
          <p className="powered-by">
            Powered by <span className="accent">CBRE IT BELUX</span>
          </p>
        </div>
      </div>

      {/* Loading Animation */}
      {isAnimating && (
        <div className="loading-transition">
          <div className="loading-spinner-large"></div>
          <p className="loading-text">Loading {assetClasses.find(a => a.id === selectedAsset)?.name} properties...</p>
        </div>
      )}
    </div>
  );
};

export default WelcomeScreen;