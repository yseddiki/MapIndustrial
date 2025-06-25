// src/components/CadastreModal.js - WITHOUT ASSET CLASS SELECTION UI

import React, { useState, useEffect } from 'react';
import { CadastreService } from '../services/CadastreService';
import { PropertyService } from '../services/PropertyService';

const CadastreModal = ({ isOpen, onClose, cadastrePoint, preSelectedAssetClass, preSelectedSubAssetClass }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [cadastreData, setCadastreData] = useState(null);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [creationResult, setCreationResult] = useState(null);

  // ✅ UPDATED: Asset class data for reference only (no UI selection)
  const assetClasses = [
    { id: 1, name: 'Office' },
    { id: 2, name: 'Retail' },
    { id: 3, name: 'Residential' },
    { id: 4, name: 'Industrial & Logistics' }
  ];

  // ✅ UPDATED: Sub-asset class data for reference only (no UI selection)
  const subAssetClasses = [
    { id: 1, assetClassId: 2, name: 'Highstreet' },
    { id: 2, assetClassId: 2, name: 'Out-of-town stand-alone' },
    { id: 3, assetClassId: 2, name: 'Shopping centre' },
    { id: 4, assetClassId: 3, name: 'Senior living' },
    { id: 5, assetClassId: 3, name: 'Student housing' },
    { id: 6, assetClassId: 9, name: 'Residential care centre' },
    { id: 7, assetClassId: 3, name: 'Multifamily' },
    { id: 8, assetClassId: 3, name: 'Income-producing residential' },
    { id: 9, assetClassId: 4, name: 'Industrial' },
    { id: 10, assetClassId: 4, name: 'Semi-industrial' },
    { id: 11, assetClassId: 4, name: 'Logistics' },
    { id: 12, assetClassId: 5, name: 'Leisure' },
    { id: 13, assetClassId: 9, name: 'Hospital' },
    { id: 14, assetClassId: 7, name: 'School' },
    { id: 15, assetClassId: 7, name: 'Parking' },
    { id: 16, assetClassId: 7, name: 'Data centre' },
    { id: 17, assetClassId: 7, name: 'Life Science' },
    { id: 18, assetClassId: 3, name: 'Apartment' },
    { id: 19, assetClassId: 3, name: 'Co-living' },
    { id: 20, assetClassId: 3, name: 'House' },
    { id: 21, assetClassId: 3, name: 'Bloc sales' },
    { id: 22, assetClassId: 6, name: 'Land' },
    { id: 23, assetClassId: 5, name: 'Hotel' },
    { id: 24, assetClassId: 1, name: 'Office' },
    { id: 25, assetClassId: 2, name: 'Retail (others)' },
    { id: 26, assetClassId: 2, name: 'Supermarket' },
    { id: 27, assetClassId: 2, name: 'Out-of-town retail park' },
    { id: 28, assetClassId: 3, name: 'Service flats' },
    { id: 29, assetClassId: 3, name: 'Co-living' },
    { id: 30, assetClassId: 10, name: 'Life science' },
    { id: 31, assetClassId: 2, name: 'Horeca' },
    { id: 32, assetClassId: 4, name: 'SME business unit' },
    { id: 33, assetClassId: 12, name: 'Undefined' }
  ];

  // ✅ UPDATED: Asset class name to ID mapping for URL parameters
  const assetClassNameToId = {
    'office': 1,
    'retail': 2,
    'residential': 3,
    'industrial': 4
  };

  // ✅ UPDATED: Get asset class and sub-asset class IDs from URL parameters
  const getAssetClassesFromURL = () => {
    let assetClassIds = [];
    let subAssetClassIds = [];

    // Convert asset class name to ID
    if (preSelectedAssetClass) {
      const assetClassId = assetClassNameToId[preSelectedAssetClass.toLowerCase()];
      if (assetClassId) {
        assetClassIds = [assetClassId];
        console.log(`✅ Asset class from URL: ${preSelectedAssetClass} (ID: ${assetClassId})`);
      }
    }

    // Convert sub-asset class ID
    if (preSelectedSubAssetClass) {
      const subAssetClassId = parseInt(preSelectedSubAssetClass);
      if (!isNaN(subAssetClassId)) {
        subAssetClassIds = [subAssetClassId];
        console.log(`✅ Sub-asset class from URL: ID ${subAssetClassId}`);
      }
    }

    return { assetClassIds, subAssetClassIds };
  };

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
      setIsLoading(false);
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
      
      // Include submarket data from intersection if available
      const completeData = {
        ...data,
        point: { ...cadastrePoint, ...data.point },
        submarket: cadastrePoint.submarketData || data.submarket
      };
      
      setCadastreData(completeData);
      console.log('✅ Cadastre data loaded with submarket intersection:', completeData);
      
    } catch (err) {
      console.error('❌ Error loading cadastre data:', err);
      setError(err.message);
      window.alert(`Failed to load cadastre data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ UPDATED: Create property using URL parameters (no user selection required)
  const handleCreateProperty = async () => {
    const { assetClassIds, subAssetClassIds } = getAssetClassesFromURL();

    // ✅ UPDATED: Validate URL parameters are present
    if (!preSelectedAssetClass && !preSelectedSubAssetClass) {
      window.alert('⚠️ No asset class information provided in URL. Please access this page with proper URL parameters.');
      return;
    }

    if (!cadastreData || !cadastreData.point) {
      window.alert('❌ Property data not available. Please try again.');
      return;
    }

    // Validate property data
    const validation = PropertyService.validatePropertyData(cadastreData);
    if (!validation.isValid) {
      const errorMessage = `Cannot create property:\n• ${validation.errors.join('\n• ')}`;
      window.alert(`❌ Validation Error:\n\n${errorMessage}`);
      return;
    }

    // ✅ UPDATED: Build confirmation message with URL parameters
    const address = PropertyService.formatAddress(cadastreData.point);
    const assetClassNames = assetClassIds.map(id => 
      assetClasses.find(ac => ac.id === id)?.name
    ).filter(Boolean).join(', ');
    const subAssetClassNames = subAssetClassIds.map(id => 
      subAssetClasses.find(sac => sac.id === id)?.name
    ).filter(Boolean).join(', ');
    
    let confirmMessage = `🏗️ Create Property in Efficy?\n\nAddress: ${address}`;
    
    if (assetClassNames) {
      confirmMessage += `\nAsset Classes: ${assetClassNames}`;
    }
    
    if (subAssetClassNames) {
      confirmMessage += `\nSub-Asset Classes: ${subAssetClassNames}`;
    }
    
    confirmMessage += `\n\nThis will create a new property in your Efficy CRM system.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsCreating(true);
    setCreationResult(null);

    try {
      console.log('🏗️ Creating property via PropertyService API with URL parameters:', {
        cadastreData,
        assetClasses: assetClassIds,
        subAssetClasses: subAssetClassIds,
        urlParams: { assetClass: preSelectedAssetClass, subAssetClass: preSelectedSubAssetClass }
      });

      // ✅ UPDATED: Create property with URL parameter asset classes
      const result = await PropertyService.createProperty(
        cadastreData, 
        assetClassIds, 
        subAssetClassIds
      );

      setCreationResult(result);

      if (result.success) {
        console.log('✅ Property created successfully:', result);
        
        // Success alert with property details
        let successMessage = `🎉 Property Created Successfully!\n\nProperty ID: ${result.propertyId || 'Generated'}\nAddress: ${address}`;
        
        if (assetClassNames) {
          successMessage += `\nAsset Classes: ${assetClassNames}`;
        }
        
        successMessage += `\n\nThe property has been added to your Efficy CRM system.`;
        window.alert(successMessage);
        
        // Auto-open in Efficy after a brief delay
        if (result.propertyId && result.propertyId !== 'Unknown') {
          setTimeout(() => {
            if (window.confirm('🚀 Would you like to open the new property in Efficy CRM now?')) {
              const efficyUrl = `https://efficy.cbre.be/crm/view/Prop/${result.propertyId}`;
              console.log('🌐 Opening Efficy URL:', efficyUrl);
              window.open(efficyUrl, '_blank');
            }
          }, 1000);
        }

      } else {
        console.error('❌ Property creation failed:', result.error);
        
        // Detailed error alert
        const errorMessage = `❌ Failed to Create Property\n\nError: ${result.error}\n\nPlease check your network connection and try again, or contact your system administrator.`;
        window.alert(errorMessage);
      }

    } catch (error) {
      console.error('💥 Unexpected error creating property:', error);
      
      const unexpectedErrorResult = {
        success: false,
        error: error.message || 'Unexpected error occurred'
      };
      setCreationResult(unexpectedErrorResult);
      
      // Unexpected error alert
      const errorMessage = `💥 Unexpected Error\n\nSomething went wrong while creating the property:\n\n${error.message || 'Unknown error'}\n\nPlease try again or contact technical support.`;
      window.alert(errorMessage);
      
    } finally {
      setIsCreating(false);
    }
  };

  // Retry function with reset
  const handleRetryCreation = () => {
    setCreationResult(null);
    setIsCreating(false);
  };

  // Open in Efficy with confirmation
  const handleOpenInEfficy = () => {
    if (creationResult?.propertyId && creationResult.propertyId !== 'Unknown') {
      const url = `https://efficy.cbre.be/crm/view/Prop/${creationResult.propertyId}`;
      console.log('🚀 Opening property in Efficy:', url);
      console.log('🆔 Using property ID:', creationResult.propertyId);
      window.open(url, '_blank');
    } else {
      console.error('❌ No valid property ID available:', creationResult?.propertyId);
      window.alert('❌ Property ID not available. Cannot open in Efficy.');
    }
  };

  const formatAddress = (pointData) => {
    if (!pointData) return 'N/A';
    
    let address = '';
    
    const street = pointData.street_fr || pointData.street_nl || pointData.street_de;
    if (street && pointData.number) {
      address = `${street} ${pointData.number}`;
    } else if (street) {
      address = street;
    }
    
    const city = pointData.town_fr || pointData.town_nl || pointData.town_de;
    if (city) {
      if (address) address += ', ';
      if (pointData.postcode) {
        address += `${pointData.postcode} ${city}`;
      } else {
        address += city;
      }
    }
    
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

  // ✅ NEW: Helper function to get display names for URL parameters
  const getDisplayNames = () => {
    const { assetClassIds, subAssetClassIds } = getAssetClassesFromURL();
    
    const assetClassNames = assetClassIds.map(id => 
      assetClasses.find(ac => ac.id === id)?.name
    ).filter(Boolean);
    
    const subAssetClassNames = subAssetClassIds.map(id => 
      subAssetClasses.find(sac => sac.id === id)?.name
    ).filter(Boolean);
    
    return { assetClassNames, subAssetClassNames };
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

              {/* ✅ NEW: URL Parameter Information */}
              {(preSelectedAssetClass || preSelectedSubAssetClass) && (
                <div className="modal-section" style={{ 
                  background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)', 
                  border: '2px solid #17E88F',
                  marginBottom: '1.5rem'
                }}>
                  <h4 style={{ color: '#003F2D' }}>🎯 Property Configuration</h4>
                  <div style={{ 
                    background: 'rgba(23, 232, 143, 0.1)', 
                    padding: '0.75rem', 
                    borderRadius: '6px', 
                    marginBottom: '1rem',
                    border: '1px solid rgba(23, 232, 143, 0.3)'
                  }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#003F2D', marginBottom: '0.5rem' }}>
                      🔗 Configuration from URL Parameters
                    </div>
                    {(() => {
                      const { assetClassNames, subAssetClassNames } = getDisplayNames();
                      return (
                        <div style={{ fontSize: '0.9rem', color: '#435254' }}>
                          {assetClassNames.length > 0 && (
                            <div>
                              <strong>Asset Class:</strong> {assetClassNames.join(', ')}
                            </div>
                          )}
                          {subAssetClassNames.length > 0 && (
                            <div>
                              <strong>Sub-Asset Class:</strong> {subAssetClassNames.join(', ')}
                            </div>
                          )}
                          {assetClassNames.length === 0 && subAssetClassNames.length === 0 && (
                            <div style={{ color: '#999', fontStyle: 'italic' }}>
                              No asset class configuration provided
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>
                    💡 Asset class configuration is determined by URL parameters and cannot be changed here.
                  </div>
                </div>
              )}

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

              {/* Submarket Information */}
              {cadastreData.submarket ? (
                <div className="modal-section" style={{ 
                  background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)', 
                  border: '2px solid #007AC2' 
                }}>
                  <h4 style={{ color: '#007AC2' }}>🗺️ Submarket Information</h4>
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
                      <strong>Municipality:</strong>
                      <span>{cadastreData.submarket.t_mun_nl || cadastreData.submarket.t_mun_fr || 'N/A'}</span>
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
                    No submarket data found at this location.
                  </p>
                </div>
              )}

              {/* Building Information */}
              {cadastreData.buildings && cadastreData.buildings.length > 0 && (
                <div className="modal-section">
                  <h4>🏢 Building Information</h4>
                  {cadastreData.buildings.map((building, index) => (
                    <div key={index} className="data-grid" style={{ marginBottom: index < cadastreData.buildings.length - 1 ? '1rem' : '0' }}>
                      <div className="data-row">
                        <strong>Building Area:</strong>
                        <span style={{ fontWeight: '600', color: '#003F2D' }}>
                          {formatArea(building.area_m2)}
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
                      <strong>Parcel Area:</strong>
                      <span style={{ fontWeight: '600', color: '#003F2D' }}>
                        {formatArea(cadastreData.parcel.area_m2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Property Creation Result Display */}
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
                    {creationResult.success ? '🎉 Property Created Successfully!' : '❌ Property Creation Failed'}
                  </h4>
                  
                  {creationResult.success ? (
                    <div>
                      <p style={{ color: '#155724', margin: '0.5rem 0', fontWeight: '600' }}>
                        Property has been created in Efficy CRM!
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
                      <p style={{ color: '#155724', margin: '0.5rem 0', fontSize: '0.9rem' }}>
                        💡 The property is now available in your Efficy CRM system.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ color: '#721c24', margin: '0.5rem 0', fontWeight: '600' }}>
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
                    </div>
                  )}
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
            
            {/* ✅ UPDATED: Dynamic Action Button - uses URL parameters */}
            {isCreating ? (
              <button 
                className="modal-btn modal-btn-primary" 
                disabled={true}
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="btn-spinner"></div>
                  🏗️ Creating Property...
                </div>
              </button>
            ) : creationResult?.success ? (
              <button 
                className="modal-btn modal-btn-success" 
                onClick={handleOpenInEfficy}
                style={{ 
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  color: 'white'
                }}
                disabled={!creationResult.propertyId || creationResult.propertyId === 'Unknown'}
              >
                🚀 Open in Efficy CRM
              </button>
            ) : creationResult?.success === false ? (
              <button 
                className="modal-btn modal-btn-retry" 
                onClick={handleRetryCreation}
                style={{ 
                  background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
                  color: '#212529'
                }}
              >
                🔄 Try Again
              </button>
            ) : (
              <button 
                className="modal-btn modal-btn-primary" 
                onClick={handleCreateProperty}
                disabled={!preSelectedAssetClass && !preSelectedSubAssetClass}
              >
                🏗️ Create Property in Efficy
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CadastreModal;