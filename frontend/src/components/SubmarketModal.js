// src/components/SubmarketModal.js

import React from 'react';

const SubmarketModal = ({ isOpen, onClose, submarketData }) => {

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, #007AC2 0%, #005B94 100%)' }}>
          <h3>🗺️ Submarket Information</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          
          {/* Data Display */}
          {submarketData && (
            <>
              {/* Status Header */}
              <div style={{ 
                background: 'linear-gradient(135deg, #007AC2 0%, #005B94 100%)', 
                color: 'white', 
                padding: '1rem', 
                borderRadius: '8px', 
                textAlign: 'center',
                marginBottom: '1.5rem'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '0.5rem' }}>🗺️</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Submarket Details</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>Geographic and Administrative Data</div>
              </div>

              {/* Submarket Information */}
              <div className="modal-section">
                <h4>🏢 Asset Class Submarkets</h4>
                <div className="data-grid">
                  <div className="data-row">
                    <strong>Office Submarket:</strong>
                    <span style={{ fontWeight: '600', color: '#007AC2' }}>
                      {submarketData.officesubmarket || 'N/A'}
                    </span>
                  </div>
                  <div className="data-row">
                    <strong>Logistics Submarket:</strong>
                    <span style={{ fontWeight: '600', color: '#007AC2' }}>
                      {submarketData.logisticsubmarket || 'N/A'}
                    </span>
                  </div>
                  <div className="data-row">
                    <strong>Retail Submarket:</strong>
                    <span style={{ fontWeight: '600', color: '#007AC2' }}>
                      {submarketData.retailsubmarket || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Administrative Areas */}
              <div className="modal-section">
                <h4>🏛️ Administrative Areas</h4>
                <div className="data-grid">
                  <div className="data-row">
                    <strong>Municipality (NL):</strong>
                    <span>{submarketData.t_mun_nl || 'N/A'}</span>
                  </div>
                  <div className="data-row">
                    <strong>Municipality (FR):</strong>
                    <span>{submarketData.t_mun_fr || 'N/A'}</span>
                  </div>
                  <div className="data-row">
                    <strong>Municipality (DE):</strong>
                    <span>{submarketData.t_mun_de || 'N/A'}</span>
                  </div>
                  <div className="data-row">
                    <strong>Arrondissement (NL):</strong>
                    <span>{submarketData.t_arrd_nl || 'N/A'}</span>
                  </div>
                  <div className="data-row">
                    <strong>Arrondissement (FR):</strong>
                    <span>{submarketData.t_arrd_fr || 'N/A'}</span>
                  </div>
                  <div className="data-row">
                    <strong>Province (NL):</strong>
                    <span>{submarketData.t_provi_nl || 'N/A'}</span>
                  </div>
                  <div className="data-row">
                    <strong>Province (FR):</strong>
                    <span>{submarketData.t_provi_fr || 'N/A'}</span>
                  </div>
                  <div className="data-row">
                    <strong>Region (NL):</strong>
                    <span>{submarketData.t_regio_nl || 'N/A'}</span>
                  </div>
                  <div className="data-row">
                    <strong>Region (FR):</strong>
                    <span>{submarketData.t_regio_fr || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Statistical Codes */}
              <div className="modal-section">
                <h4>📊 Statistical Codes</h4>
                <div className="data-grid">
                  <div className="data-row">
                    <strong>NIS6 Code:</strong>
                    <span style={{ fontFamily: 'monospace' }}>{submarketData.c_nis6 || 'N/A'}</span>
                  </div>
                  <div className="data-row">
                    <strong>NIS7 Code:</strong>
                    <span style={{ fontFamily: 'monospace' }}>{submarketData.c_nis7 || 'N/A'}</span>
                  </div>
                  <div className="data-row">
                    <strong>NIS5 2022:</strong>
                    <span style={{ fontFamily: 'monospace' }}>{submarketData.cnis5_2022 || 'N/A'}</span>
                  </div>
                  <div className="data-row">
                    <strong>NUTS1 2021:</strong>
                    <span style={{ fontFamily: 'monospace' }}>{submarketData.nuts1_2021 || 'N/A'}</span>
                  </div>
                  <div className="data-row">
                    <strong>NUTS2 2021:</strong>
                    <span style={{ fontFamily: 'monospace' }}>{submarketData.nuts2_2021 || 'N/A'}</span>
                  </div>
                  <div className="data-row">
                    <strong>NUTS3 2021:</strong>
                    <span style={{ fontFamily: 'monospace' }}>{submarketData.nuts3_2021 || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Geographic Measurements */}
              <div className="modal-section">
                <h4>📏 Geographic Measurements</h4>
                <div className="data-grid">
                  <div className="data-row">
                    <strong>Area (hectares):</strong>
                    <span style={{ fontWeight: '600', color: '#007AC2' }}>
                      {submarketData.m_area_ha ? `${parseFloat(submarketData.m_area_ha).toFixed(2)} ha` : 'N/A'}
                    </span>
                  </div>
                  <div className="data-row">
                    <strong>Perimeter (meters):</strong>
                    <span>
                      {submarketData.m_peri_m ? `${parseFloat(submarketData.m_peri_m).toFixed(2)} m` : 'N/A'}
                    </span>
                  </div>
                  <div className="data-row">
                    <strong>Shape Length:</strong>
                    <span>
                      {submarketData.shape_leng ? parseFloat(submarketData.shape_leng).toFixed(2) : 'N/A'}
                    </span>
                  </div>
                  <div className="data-row">
                    <strong>Shape Area:</strong>
                    <span>
                      {submarketData.SHAPE__Area ? parseFloat(submarketData.SHAPE__Area).toFixed(2) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sector Information */}
              {(submarketData.t_sec_nl || submarketData.t_sec_fr || submarketData.t_sec_de) && (
                <div className="modal-section">
                  <h4>🏙️ Sector Information</h4>
                  <div className="data-grid">
                    {submarketData.t_sec_nl && (
                      <div className="data-row">
                        <strong>Sector (NL):</strong>
                        <span>{submarketData.t_sec_nl}</span>
                      </div>
                    )}
                    {submarketData.t_sec_fr && (
                      <div className="data-row">
                        <strong>Sector (FR):</strong>
                        <span>{submarketData.t_sec_fr}</span>
                      </div>
                    )}
                    {submarketData.t_sec_de && (
                      <div className="data-row">
                        <strong>Sector (DE):</strong>
                        <span>{submarketData.t_sec_de}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Debug: All Data */}
              <div className="modal-section" style={{ background: '#f1f3f4' }}>
                <h4>🔍 Debug: All Available Fields</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '0.8rem' }}>
                  {Object.keys(submarketData).map(key => (
                    <div key={key} className="debug-field">
                      <strong>{key}:</strong> 
                      <span className={submarketData[key] ? 'debug-value' : 'debug-null'}>
                        {submarketData[key] !== null && submarketData[key] !== undefined 
                          ? String(submarketData[key]) 
                          : 'null'
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!submarketData && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🗺️</div>
              <h4>No submarket data available</h4>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Click on a submarket area to view data.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="modal-btn modal-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmarketModal;