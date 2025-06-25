// src/components/LayerControl.js - UPDATED WITH SUBMARKET CONTROLS

import React from 'react';

const LayerControl = ({
  isProcessing,
  searchTerm,
  searchInput,
  isSearching,
  onSearchChange,
  onClearSearch,
  buildings,
  allBuildings,
  qualityFilters,
  qualityDistribution,
  onQualityFilterToggle,
  onSelectAllQualities,
  onDeselectAllQualities,
  loadingBuildings,
  buildingsLayer,
  // ✅ NEW: Submarket layer controls
  submarketLayer,
  submarketVisible,
  onSubmarketVisibilityToggle
}) => {
  return (
    <div className={`layer-control ${isProcessing ? 'processing' : ''}`}>
      <h3>Map Controls</h3>
      
      {/* Search Section */}
      <div className="layer-item">
        <h4 className="section-title">Search Buildings</h4>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by name, address, ID..."
            value={searchInput}
            onChange={onSearchChange}
            className="search-input"
          />
          {searchInput && (
            <button onClick={onClearSearch} className="clear-search-btn">
              ✕
            </button>
          )}
        </div>
        {isSearching && searchInput && (
          <p className="search-results" style={{ color: '#DBD99A', fontStyle: 'italic' }}>
            ⏳ Searching...
          </p>
        )}
        {!isSearching && searchTerm && (
          <p className="search-results">
            Found {buildings.length} building{buildings.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ✅ NEW: Map Layers Section */}
      <div className="layer-item">
        <h4 className="section-title">Map Layers</h4>
        
        {/* Submarket Layer Toggle */}
        <div className="quality-filter-item">
          <label>
            <input
              type="checkbox"
              checked={submarketVisible}
              onChange={onSubmarketVisibilityToggle}
            />
            <div className="quality-dot" style={{ 
              backgroundColor: '#007AC2', 
              opacity: 0.3,
              border: '2px solid #007AC2'
            }}></div>
            <span className="quality-label">
              🗺️ Submarkets Layer
            </span>
          </label>
          {submarketVisible && (
            <div style={{ 
              fontSize: '0.7rem', 
              color: '#17E88F', 
              marginLeft: '1.5rem', 
              marginTop: '0.25rem',
              fontWeight: '500'
            }}>
              💡 Click any submarket area to view details
            </div>
          )}
        </div>

        {/* Buildings Layer Info */}
        <div className="quality-filter-item">
          <label style={{ cursor: 'default' }}>
            <input
              type="checkbox"
              checked={true}
              disabled={true}
              style={{ opacity: 0.5 }}
            />
            <div className="quality-dot" style={{ 
              backgroundColor: '#17E88F'
            }}></div>
            <span className="quality-label" style={{ opacity: 0.7 }}>
              🏢 Buildings Layer (Always On)
            </span>
          </label>
        </div>
      </div>

      {/* Quality Filters Section */}
      <div className="layer-item">
        <h4 className="section-title">
          Data Quality Filters
          <span className="filter-count">({buildings.length}/{allBuildings.length})</span>
        </h4>
        
        <div className="filter-controls">
          <button onClick={onSelectAllQualities} className="filter-btn">
            Select All
          </button>
          <button onClick={onDeselectAllQualities} className="filter-btn">
            Clear All
          </button>
        </div>

        <div className="quality-filters">
          <div className="quality-filter-item">
            <label>
              <input
                type="checkbox"
                checked={qualityFilters.GREEN}
                onChange={() => onQualityFilterToggle('GREEN')}
              />
              <div className="quality-dot" style={{ backgroundColor: '#17E88F' }}></div>
              <span className="quality-label">
                Excellent ({qualityDistribution.GREEN})
              </span>
            </label>
          </div>
          
          <div className="quality-filter-item">
            <label>
              <input
                type="checkbox"
                checked={qualityFilters.YELLOW}
                onChange={() => onQualityFilterToggle('YELLOW')}
              />
              <div className="quality-dot" style={{ backgroundColor: '#DBD99A' }}></div>
              <span className="quality-label">
                Good ({qualityDistribution.YELLOW})
              </span>
            </label>
          </div>
          
          <div className="quality-filter-item">
            <label>
              <input
                type="checkbox"
                checked={qualityFilters.ORANGE}
                onChange={() => onQualityFilterToggle('ORANGE')}
              />
              <div className="quality-dot" style={{ backgroundColor: '#D2785A' }}></div>
              <span className="quality-label">
                OK ({qualityDistribution.ORANGE})
              </span>
            </label>
          </div>
          
          <div className="quality-filter-item">
            <label>
              <input
                type="checkbox"
                checked={qualityFilters.RED}
                onChange={() => onQualityFilterToggle('RED')}
              />
              <div className="quality-dot" style={{ backgroundColor: '#AD2A2A' }}></div>
              <span className="quality-label">
                Bad ({qualityDistribution.RED})
              </span>
            </label>
          </div>
          
          <div className="quality-filter-item">
            <label>
              <input
                type="checkbox"
                checked={qualityFilters.PURPLE}
                onChange={() => onQualityFilterToggle('PURPLE')}
              />
              <div className="quality-dot" style={{ backgroundColor: '#885073' }}></div>
              <span className="quality-label">
                Catastrophic ({qualityDistribution.PURPLE})
              </span>
            </label>
          </div>

          <div className="quality-filter-item">
            <label>
              <input
                type="checkbox"
                checked={qualityFilters.GREY}
                onChange={() => onQualityFilterToggle('GREY')}
              />
              <div className="quality-dot" style={{ 
                backgroundColor: '#FFFFFF', 
                border: '1px solid #000000',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.3)' 
              }}></div>
              <span className="quality-label">
                Not in Efficy ! ({qualityDistribution.GREY})
              </span>
            </label>
            {qualityFilters.GREY && (
              <div style={{ 
                fontSize: '0.7rem', 
                color: '#17E88F', 
                marginLeft: '1.5rem', 
                marginTop: '0.25rem',
                fontWeight: '500'
              }}>
                💡 Click any white dot to view details and create property
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="api-status">
        <p className="status-text">
          {loadingBuildings ? '⏳ Loading buildings...' : 
           allBuildings.length > 0 ? `🟢 ${allBuildings.length} buildings total` : 
           '🟡 No buildings found'}
        </p>
        {buildingsLayer && (
          <p className="status-text" style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
            Showing: {buildingsLayer.graphics.length} buildings
          </p>
        )}
        {submarketLayer && (
          <p className="status-text" style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
            Submarket Layer: {submarketVisible ? '✅ Visible' : '❌ Hidden'}
          </p>
        )}
      </div>
    </div>
  );
};

export default LayerControl;