// src/components/LayerControl.js

import React from 'react';

const LayerControl = ({
  isProcessing,
  searchTerm,
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
  buildingsLayer
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
            value={searchTerm}
            onChange={onSearchChange}
            className="search-input"
          />
          {searchTerm && (
            <button onClick={onClearSearch} className="clear-search-btn">
              ✕
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="search-results">
            Found {buildings.length} building{buildings.length !== 1 ? 's' : ''}
          </p>
        )}
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
              <div className="quality-dot" style={{ backgroundColor: '#CAD1D3' }}></div>
              <span className="quality-label">
                Not in Efficy ! ({qualityDistribution.GREY})
              </span>
            </label>
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
      </div>
    </div>
  );
};

export default LayerControl;