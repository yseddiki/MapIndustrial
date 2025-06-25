// src/components/CadastreModal.js - UPDATED WITH SUBMARKET INTERSECTION DATA

import React, { useState, useEffect } from 'react';
import { CadastreService } from '../services/CadastreService';
import { PropertyService } from '../services/PropertyService';

const CadastreModal = ({ isOpen, onClose, cadastrePoint }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [cadastreData, setCadastreData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedAssetClass, setSelectedAssetClass] = useState('');
  // ✅ NEW: Property creation states
  const [isCreating, setIsCreating] = useState(false);
  const [creationResult, setCreationResult] = useState(null);

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
      // ✅ NEW: Reset creation states
      setIsCreating(false);
      setCreationResult(null);
    }
  }, [isOpen]);

  const loadCadastreData = async (guid) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Loading cadastre data for GUID:', guid);
      
      // Fetch complete cadastre data
      const data = await CadastreService.fetchCadastreDataByGuid(guid);
      
      // ✅ NEW: Include submarket data from intersection if available
      const completeData = {
        ...data,
        point: { ...cadastrePoint, ...data.point }, // Merge original point data
        // ✅ NEW: Include submarket data from click intersection
        submarket: cadastrePoint.submarketData || data.submarket
      };
      
      setCadastreData(completeData);
      console.log('✅ Cadastre data loaded with submarket intersection:', completeData);
      
    } catch (err) {
      console.error('❌ Error loading cadastre data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ UPDATED: Use PropertyService API instead of URL
  const handleCreateProperty = async () => {
    if (!selectedAssetClass) {
      alert('Please select a property type first!');
      return;
    }

    if (!cadastreData || !cadastreData.point) {
      alert('Property data not available.');
      return;
    }

    // Validate property data
    const validation = PropertyService.validatePropertyData(cadastreData);
    if (!validation.isValid) {
      alert(`Cannot create property: ${validation.errors.join(', ')}`);
      return;
    }

    setIsCreating(true);
    setCreationResult(null);

    try {
      console.log('🏗️ Creating property via API with data:', {
        cadastreData,
        assetClass: selectedAssetClass
      });

      // Create property using the API
      const result = await PropertyService.createProperty(cadastreData, selectedAssetClass);

      setCreationResult(result);

      if (result.success) {
        console.log('✅ Property created successfully:', result);
        // Don't close modal immediately, let user see the success message
      } else {
        console.error('❌ Property creation failed:', result.error);
      }

    } catch (error) {
      console.error('💥 Unexpected error creating property:', error);
      setCreationResult({
        success: false,
        error: error.message || 'Unexpected error occurred'
      });
    } finally {
      setIsCreating(false);
    }
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
                <div style={{ fontSize: '12px', opacity: 0.8 }}>Cadastre Property with Submarket Data</div>
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

              {/* ✅ NEW: Submarket Information from Intersection */}
              {cadastreData.submarket ? (
                <div className="modal-section" style={{ 
                  background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)', 
                  border: '2px solid #007AC2' 
                }}>
                  <h4 style={{ color: '#007AC2' }}>🗺️ Submarket Information (Intersection)</h4>
                  <div className="data-grid">
                    <div className="data-row">
                      <strong>Office Submarket:</strong>
                      <span style={{ fontWeight: '600', color: '#007AC2' }}>
                        {cadastreData.submarket.officesubmarket || 'N/A'}
                      </span>
                    </div>
                    <div className="data-row">
                      <strong>Logistics Submarket:</strong>
                      <span style={{ fontWeight: '600', color: '#007AC2' }}>
                        {cadastreData.submarket.logisticsubmarket || 'N/A'}
                      </span>
                    </div>
                    <div className="data-row">
                      <strong>Retail Submarket:</strong>
                      <span style={{ fontWeight: '600', color: '#007AC2' }}>
                        {cadastreData.submarket.retailsubmarket || 'N/A'}
                      </span>
                    </div>
                    <div className="data-row">
                      <strong>Municipality (NL):</strong>
                      <span>{cadastreData.submarket.t_mun_nl || 'N/A'}</span>
                    </div>
                    <div className="data-row">
                      <strong>Municipality (FR):</strong>
                      <span>{cadastreData.submarket.t_mun_fr || 'N/A'}</span>
                    </div>
                    <div className="data-row">
                      <strong>Province (NL):</strong>
                      <span>{cadastreData.submarket.t_provi_nl || 'N/A'}</span>
                    </div>
                    <div className="data-row">
                      <strong>Region (NL):</strong>
                      <span>{cadastreData.submarket.t_regio_nl || 'N/A'}</span>
                    </div>
                    <div className="data-row">
                      <strong>NIS6 Code:</strong>
                      <span style={{ fontFamily: 'monospace' }}>
                        {cadastreData.submarket.c_nis6 || 'N/A'}
                      </span>
                    </div>
                    <div className="data-row">
                      <strong>Submarket Area:</strong>
                      <span style={{ fontWeight: '600', color: '#007AC2' }}>
                        {cadastreData.submarket.m_area_ha 
                          ? `${parseFloat(cadastreData.submarket.m_area_ha).toFixed(2)} hectares`
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="modal-section" style={{ 
                  background: '#fff3cd', 
                  border: '2px solid #ffc107',
                  color: '#856404'
                }}>
                  <h4 style={{ color: '#856404' }}>⚠️ Submarket Information</h4>
                  <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>
                    No submarket data found at this location. This may happen if:
                  </p>
                  <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', fontSize: '0.8rem' }}>
                    <li>The submarket layer is not visible or loaded</li>
                    <li>The point is outside submarket boundaries</li>
                    <li>There's a spatial reference mismatch</li>
                  </ul>
                  <p style={{ margin: '0.5rem 0', fontSize: '0.8rem', fontStyle: 'italic' }}>
                    💡 Try enabling the submarket layer to see coverage areas.
                  </p>
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

              {/* ✅ NEW: Property Creation Result */}
              {creationResult && (
                <div className="modal-section" style={{ 
                  background: creationResult.success 
                    ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)' 
                    : 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
                  border: creationResult.success 
                    ? '2px solid #28a745' 
                    : '2px solid #dc3545',
                  marginTop: '1rem'
                }}>
                  <h4 style={{ 
                    color: creationResult.success ? '#155724' : '#721c24',
                    margin: '0 0 1rem 0'
                  }}>
                    {creationResult.success ? '✅ Property Created Successfully!' : '❌ Property Creation Failed'}
                  </h4>
                  
                  {creationResult.success ? (
                    <div>
                      <p style={{ 
                        color: '#155724', 
                        margin: '0.5rem 0',
                        fontWeight: '600'
                      }}>
                        🎉 Property has been created in Efficy!
                      </p>
                      {creationResult.propertyId && (
                        <div className="data-row">
                          <strong>Property ID:</strong>
                          <span style={{ 
                            fontFamily: 'monospace', 
                            fontWeight: '600',
                            color: '#28a745'
                          }}>
                            {creationResult.propertyId}
                          </span>
                        </div>
                      )}
                      <p style={{ 
                        color: '#155724', 
                        margin: '0.5rem 0',
                        fontSize: '0.9rem'
                      }}>
                        💡 You can now find this property in your Efficy CRM system.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ 
                        color: '#721c24', 
                        margin: '0.5rem 0',
                        fontWeight: '600'
                      }}>
                        Failed to create property in Efficy.
                      </p>
                      <p style={{ 
                        color: '#721c24', 
                        margin: '0.5rem 0',
                        fontSize: '0.9rem',
                        fontFamily: 'monospace',
                        background: 'rgba(220, 53, 69, 0.1)',
                        padding: '0.5rem',
                        borderRadius: '4px'
                      }}>
                        Error: {creationResult.error}
                      </p>
                      <p style={{ 
                        color: '#721c24', 
                        margin: '0.5rem 0',
                        fontSize: '0.8rem'
                      }}>
                        💡 Please check your network connection and try again, or contact your system administrator.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Show data loading errors if any */}
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
              {creationResult?.success ? 'Close' : 'Cancel'}
            </button>
            
            {/* ✅ UPDATED: Dynamic create button based on state */}
            {isCreating ? (
              <button 
                className="modal-btn modal-btn-primary" 
                disabled={true}
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="spinner" style={{ 
                    width: '16px', 
                    height: '16px', 
                    border: '2px solid transparent',
                    borderTop: '2px solid currentColor',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  🏗️ Creating Property...
                </div>
              </button>
            ) : creationResult?.success ? (
              <button 
                className="modal-btn modal-btn-primary" 
                onClick={() => {
                  // Open the created property in Efficy
                  if (creationResult.propertyId) {
                    window.open(`https://efficy.cbre.be/crm/view/Prop/${creationResult.propertyId}`, '_blank');
                  }
                }}
                style={{ 
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
                }}
              >
                🚀 Open in Efficy CRM
              </button>
            ) : creationResult?.success === false ? (
              <button 
                className="modal-btn modal-btn-primary" 
                onClick={handleCreateProperty}
                disabled={!selectedAssetClass}
              >
                🔄 Try Again
              </button>
            ) : (
              <button 
                className="modal-btn modal-btn-primary" 
                onClick={handleCreateProperty}
                disabled={!selectedAssetClass}
              >
                🏗️ Create this property in Efficy
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CadastreModal;