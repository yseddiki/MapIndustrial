// src/components/CadastreModal.js

import React, { useState, useEffect } from 'react';
import { CadastreService } from '../services/CadastreService';

const CadastreModal = ({ isOpen, onClose, cadastrePoint }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [cadastreData, setCadastreData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedAssetClass, setSelectedAssetClass] = useState('');

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && cadastrePoint && cadastrePoint.guid) {
      loadCadastreData(cadastrePoint.guid);
    }
  }, [isOpen, cadastrePoint]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCadastreData(null);
      setError(null);
      setSelectedAssetClass('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const loadCadastreData = async (guid) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Loading cadastre data for GUID:', guid);
      
      // Fetch complete cadastre data
      const data = await CadastreService.fetchCadastreDataByGuid(guid);
      
      // Also include the original point data
      const completeData = {
        ...data,
        point: { ...cadastrePoint, ...data.point } // Merge original point data
      };
      
      setCadastreData(completeData);
      console.log('✅ Cadastre data loaded:', completeData);
      
    } catch (err) {
      console.error('❌ Error loading cadastre data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProperty = () => {
    if (!selectedAssetClass) {
      alert('Please select a property type first!');
      return;
    }

    if (!cadastreData || !cadastreData.point) {
      alert('Property data not available.');
      return;
    }

    const pointData = cadastreData.point;
    const parcelData = cadastreData.parcel;
    const buildingsData = cadastreData.buildings;

    // Format the address
    const address = formatAddress(pointData);
    
    // Get areas
    const parcelArea = parcelData ? parcelData.area_m2 : '';
    const buildingArea = buildingsData && buildingsData.length > 0 ? buildingsData[0].area_m2 : '';

    console.log('🏗️ Creating property in Efficy with data:', {
      address,
      selectedAssetClass,
      pointData,
      parcelData,
      buildingsData
    });

    // Construct Efficy URL with all available data
    const params = new URLSearchParams({
      'source': 'cadastre',
      'guid': pointData.guid || '',
      'address': address,
      'street_fr': pointData.street_fr || '',
      'street_nl': pointData.street_nl || '',
      'street_de': pointData.street_de || '',
      'number': pointData.number || '',
      'postcode': pointData.postcode || '',
      'town_fr': pointData.town_fr || '',
      'town_nl': pointData.town_nl || '',
      'town_de': pointData.town_de || '',
      'country': pointData.country || '',
      'building_guid': pointData.building_guid || '',
      'parcel_key': parcelData ? parcelData.parcelkey : '',
      'parcel_area': parcelArea,
      'building_area': buildingArea,
      'asset_class': selectedAssetClass,
      'coordinates': pointData.x && pointData.y ? `${pointData.x},${pointData.y}` : ''
    });

    const efficyUrl = 'https://efficy.cbre.be/crm/view/Prop/new?' + params.toString();
    
    console.log('🌐 Opening Efficy URL:', efficyUrl);
    window.open(efficyUrl, '_blank');
    
    // Close modal after creating
    onClose();
  };

  const formatAddress = (pointData) => {
    if (!pointData) return 'N/A';
    
    let address = '';
    
    // Street and number
    const street = pointData.street_fr || pointData.street_nl || pointData.street_de;
    if (street && pointData.number) {
      address = `${street} ${pointData.number}`;
    } else if (street) {
      address = street;
    }
    
    // City and postcode
    const city = pointData.town_fr || pointData.town_nl || pointData.town_de;
    if (city) {
      if (address) address += ', ';
      if (pointData.postcode) {
        address += `${pointData.postcode} ${city}`;
      } else {
        address += city;
      }
    }
    
    // Country
    if (pointData.country && pointData.country !== 'BEL') {
      address += `, ${pointData.country}`;
    }
    
    return address || 'Address not available';
  };

  const formatArea = (areaM2) => {
    if (!areaM2) return 'N/A';
    
    if (areaM2 >= 10000) {
      return `${(areaM2 / 10000).toFixed(2)} hectares`;
    } else {
      return `${Math.round(areaM2).toLocaleString()} m²`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <h3>📍 Cadastre Property</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          
          {/* Loading State */}
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="spinner"></div>
              <p style={{ marginTop: '1rem', color: '#666' }}>Loading property data...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#dc2626' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
              <h4>Failed to load property data</h4>
              <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>{error}</p>
            </div>
          )}

          {/* Data Display */}
          {!isLoading && !error && cadastreData && (
            <>
              {/* Status Header */}
              <div style={{ 
                background: 'linear-gradient(135deg, #003F2D 0%, #012A2D 100%)', 
                color: 'white', 
                padding: '1rem', 
                borderRadius: '8px', 
                textAlign: 'center',
                marginBottom: '1.5rem'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '0.5rem' }}>📍</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Not in Efficy</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>Cadastre Property</div>
              </div>

              {/* Point Information */}
              {cadastreData.point && (
                <div className="modal-section">
                  <h4>📍 Address Information</h4>
                  <div className="data-grid">
                    <div className="data-row">
                      <strong>Address:</strong>
                      <span style={{ fontWeight: '600', color: '#003F2D' }}>
                        {formatAddress(cadastreData.point)}
                      </span>
                    </div>
                    <div className="data-row">
                      <strong>ID:</strong>
                      <span>{cadastreData.point.id || 'N/A'}</span>
                    </div>
                    <div className="data-row">
                      <strong>GUID:</strong>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        {cadastreData.point.guid || 'N/A'}
                      </span>
                    </div>
                    <div className="data-row">
                      <strong>Country:</strong>
                      <span>{cadastreData.point.country || 'N/A'}</span>
                    </div>
                    <div className="data-row">
                      <strong>Postcode:</strong>
                      <span>{cadastreData.point.postcode || 'N/A'}</span>
                    </div>
                    <div className="data-row">
                      <strong>Coordinates:</strong>
                      <span>
                        {cadastreData.point.x && cadastreData.point.y 
                          ? `${cadastreData.point.x.toFixed(6)}, ${cadastreData.point.y.toFixed(6)}`
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Building Information */}
              {cadastreData.buildings && cadastreData.buildings.length > 0 && (
                <div className="modal-section">
                  <h4>🏢 Building Information</h4>
                  {cadastreData.buildings.map((building, index) => (
                    <div key={index} className="data-grid" style={{ marginBottom: index < cadastreData.buildings.length - 1 ? '1rem' : '0' }}>
                      {cadastreData.buildings.length > 1 && (
                        <div className="data-row">
                          <strong>Building:</strong>
                          <span style={{ fontWeight: '600' }}>#{index + 1}</span>
                        </div>
                      )}
                      <div className="data-row">
                        <strong>ID:</strong>
                        <span>{building.id || 'N/A'}</span>
                      </div>
                      <div className="data-row">
                        <strong>GUID:</strong>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                          {building.guid || 'N/A'}
                        </span>
                      </div>
                      <div className="data-row">
                        <strong>Building Area:</strong>
                        <span style={{ fontWeight: '600', color: '#003F2D' }}>
                          {formatArea(building.area_m2)}
                        </span>
                      </div>
                      <div className="data-row">
                        <strong>Parcel Link:</strong>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                          {building.parcel_guid || 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Parcel Information */}
              {cadastreData.parcel && (
                <div className="modal-section">
                  <h4>📋 Parcel Information</h4>
                  <div className="data-grid">
                    <div className="data-row">
                      <strong>Parcel Key:</strong>
                      <span style={{ fontWeight: '600', color: '#003F2D' }}>
                        {cadastreData.parcel.parcelkey || 'N/A'}
                      </span>
                    </div>
                    <div className="data-row">
                      <strong>ID:</strong>
                      <span>{cadastreData.parcel.seq || 'N/A'}</span>
                    </div>
                    <div className="data-row">
                      <strong>GUID:</strong>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        {cadastreData.parcel.guid || 'N/A'}
                      </span>
                    </div>
                    <div className="data-row">
                      <strong>Parcel Area:</strong>
                      <span style={{ fontWeight: '600', color: '#003F2D' }}>
                        {formatArea(cadastreData.parcel.area_m2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Asset Class Selection */}
              <div className="asset-class-section">
                <label className="asset-class-label">🏗️ Property Type</label>
                <select 
                  className="asset-class-dropdown"
                  value={selectedAssetClass}
                  onChange={(e) => setSelectedAssetClass(e.target.value)}
                >
                  <option value="">Select Property Type...</option>
                  <option value="office">Office</option>
                  <option value="retail">Retail</option>
                  <option value="industrial">Industrial</option>
                  <option value="residential">Residential</option>
                  <option value="hotel">Hotel</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="mixed-use">Mixed Use</option>
                  <option value="land">Land</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Show errors if any */}
              {cadastreData.errors && cadastreData.errors.length > 0 && (
                <div style={{ 
                  background: '#fee2e2', 
                  border: '1px solid #fecaca', 
                  padding: '1rem', 
                  borderRadius: '6px', 
                  marginTop: '1rem' 
                }}>
                  <h4 style={{ color: '#dc2626', margin: '0 0 0.5rem 0' }}>⚠️ Data Loading Issues</h4>
                  <div style={{ fontSize: '0.9rem', color: '#dc2626' }}>
                    {cadastreData.errors.join(', ')}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!isLoading && !error && cadastreData && (
          <div className="modal-footer">
            <button className="modal-btn modal-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              className="modal-btn modal-btn-primary" 
              onClick={handleCreateProperty}
              disabled={!selectedAssetClass}
            >
              🏗️ Create this property in Efficy
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CadastreModal;