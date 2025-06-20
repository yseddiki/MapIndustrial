import React, { useState, useEffect } from 'react';
import './App.css';
import { MapContainer } from './components';

const App = () => {
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Asset classes mapping
  const assetClasses = {
    'office': {
      id: 'office',
      name: 'Office',
      queryId: 3624,
      icon: '🏢',
      description: 'Commercial office buildings and spaces'
    },
    'retail': {
      id: 'retail',
      name: 'Retail',
      queryId: 3622,
      icon: '🛍️',
      description: 'Shopping centers, stores and retail spaces'
    },
    'industrial': {
      id: 'industrial',
      name: 'Industrial',
      queryId: 3618,
      icon: '🏭',
      description: 'Warehouses, factories and industrial facilities'
    },
    'residential': {
      id: 'residential',
      name: 'Residential',
      queryId: 3623,
      icon: '🏘️',
      description: 'Residential buildings and housing'
    }
  };

  useEffect(() => {
    // Get asset class from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const assetClassParam = urlParams.get('assetClass') 
    
    // Default to industrial if no parameter or invalid parameter
    const assetKey = assetClassParam && assetClasses[assetClassParam.toLowerCase()] 
      ? assetClassParam.toLowerCase() 
      : 'industrial';
    
    const asset = assetClasses[assetKey];
    
    console.log('🎯 Asset class from URL:', assetClassParam);
    console.log('🎯 Using asset class:', asset);
    
    setSelectedAsset(asset);
  }, []);

  // Show loading while determining asset class
  if (!selectedAsset) {
    return (
      <div className="loading-overlay">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Loading Quality Building...</p>
        </div>
      </div>
    );
  }

  return <MapContainer selectedAsset={selectedAsset} />;
};

export default App;