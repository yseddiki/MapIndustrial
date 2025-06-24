// src/utils/dataQuality.js

export const getDataQualityLevel = (building) => {
  // Check if building is from Efficy (has K_PROPERTY)
  if (!building.K_PROPERTY && !building.propertyId) {
    return { level: 'GREY', label: 'Not in Efficy ! (From cadastre)' };
  }

  // Check if has basic data (always true if we have the building)
  const hasBasicData = true;
  
  // Check if has cadastre data (F_ARCGIS_ADDRESS must be non-empty)
  const hasCadastre = building.F_ARCGIS_ADDRESS && building.F_ARCGIS_ADDRESS.trim() !== "";
  
  // Check if has surface data (TOTALSURFACE must be different from 0 or null)
  const hasSurface = building.TOTALSURFACE && building.TOTALSURFACE !== 0;
  
  // Check if has tenants (TENANTS must be non-empty)
  const hasTenants = building.TENANTS && building.TENANTS.trim() !== "";
  
  // Check if has owner (OWNER must be non-empty)
  const hasOwner = building.OWNER && building.OWNER.trim() !== "";
  
  if (hasBasicData && hasCadastre && hasSurface && hasTenants && hasOwner) {
    return { level: 'GREEN', label: 'Excellent' };
  } else if (hasBasicData && hasCadastre && hasSurface && hasTenants) {
    return { level: 'YELLOW', label: 'Good' };
  } else if (hasBasicData && hasCadastre && hasSurface) {
    return { level: 'ORANGE', label: 'OK' };
  } else if (hasBasicData && hasCadastre) {
    return { level: 'RED', label: 'Bad' };
  } else {
    return { level: 'PURPLE', label: 'Catastrophic' };
  }
};

export const getColorForLevel = (level) => {
  switch (level) {
    case 'GREEN': return [23, 232, 143]; // Accent Green #17E88F
    case 'YELLOW': return [219, 217, 154]; // Wheat #DBD99A
    case 'ORANGE': return [210, 120, 90]; // Data Orange #D2785A
    case 'RED': return [173, 42, 42]; // Negative Red #AD2A2A
    case 'PURPLE': return [136, 80, 115]; // Data Purple #885073
    case 'GREY': return [255, 255, 255]; // ✅ V2 UPDATE: White color for "Not in Efficy"
    default: return [128, 128, 128]; // Gray fallback
  }
};

export const getQualityIcon = (level) => {
  switch (level) {
    case 'GREEN': return '🌟';
    case 'YELLOW': return '👍';
    case 'ORANGE': return '⚠️';
    case 'RED': return '❌';
    case 'PURPLE': return '💀';
    case 'GREY': return '📍';
    default: return '❓';
  }
};

export const getQualityColor = (level) => {
  switch (level) {
    case 'GREEN': return '#17E88F';
    case 'YELLOW': return '#DBD99A';
    case 'ORANGE': return '#D2785A';
    case 'RED': return '#AD2A2A';
    case 'PURPLE': return '#885073';
    case 'GREY': return '#FFFFFF'; // ✅ V2 UPDATE: White hex color for "Not in Efficy"
    default: return '#999999';
  }
};

export const createPopupContent = (building) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.4; color: #2c3e50; font-size: 14px; padding: 8px;">
      
      <!-- Building Name -->
      <div style="margin-bottom: 12px;">
        <strong style="color: #003F2D; font-size: 16px;">${building.name || 'N/A'}</strong>
      </div>

      <!-- Address -->
      <div style="margin-bottom: 8px;">
        <strong>📍 Address:</strong> ${building.address || 'N/A'}
      </div>

      <!-- Owner -->
      <div style="margin-bottom: 8px;">
        <strong>👤 Owner:</strong> ${building.OWNER || 'N/A'}
      </div>

      <!-- Tenant -->
      <div style="margin-bottom: 8px;">
        <strong>🏢 Tenant:</strong> ${building.TENANTS || 'N/A'}
      </div>
        ${building.propertyId ? `
      <!-- CRM Action Button -->
      <div style="text-align: center; margin-top: 8px;">
        <a href="https://efficy.cbre.be/crm/view/Prop/${building.propertyId}" 
           target="_blank" 
           style="display: inline-block; background: linear-gradient(135deg, #17E88F 0%, #00C896 100%); 
                  color: #003F2D; padding: 8px 16px; text-decoration: none; border-radius: 20px; 
                  font-weight: bold; font-size: 11px; box-shadow: 0 3px 6px rgba(23, 232, 143, 0.3); 
                  transition: all 0.3s ease; border: none;">
          🚀 Open in CRM
        </a>
      </div>
      ` : ''}

    </div>
  `;
};

export const createCadastrePopupContent = () => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.2; color: #2c3e50; font-size: 12px;">
      
      <!-- Content Container (visible immediately) -->
      <div id="cadastre-content"
        
        <!-- Quality Status Header -->
        <div style="background: linear-gradient(135deg, #003F2D 0%, #012A2D 100%); color: white; padding: 8px; margin: -10px -10px 8px -10px; border-radius: 6px; text-align: center;">
          <div style="font-size: 18px; margin-bottom: 4px;">📍</div>
          <div style="font-size: 12px; font-weight: bold; color: #FFFFFF;">Not in Efficy ! (From cadastre)</div>
        </div>

        <!-- Point Information -->
        <div id="point-info" style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
          <h4 style="margin: 0 0 6px 0; color: #003F2D; font-size: 11px; font-weight: bold;">📍 Point Details</h4>
          <div id="point-details" style="font-size: 11px;"></div>
        </div>

        <!-- Parcel Information -->
        <div id="parcel-info" style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin-bottom: 8px; display: none;">
          <h4 style="margin: 0 0 6px 0; color: #003F2D; font-size: 11px; font-weight: bold;">📋 Parcel Details</h4>
          <div id="parcel-details" style="font-size: 11px;"></div>
        </div>

        <!-- Building Information -->
        <div id="building-info" style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin-bottom: 8px; display: none;">
          <h4 style="margin: 0 0 6px 0; color: #003F2D; font-size: 11px; font-weight: bold;">🏢 Building Details</h4>
          <div id="building-details" style="font-size: 11px;"></div>
        </div>

        <!-- Asset Class Selection -->
        <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
          <h4 style="margin: 0 0 6px 0; color: #003F2D; font-size: 11px; font-weight: bold;">🏗️ Create in Efficy</h4>
          <div style="margin-bottom: 6px;">
            <label style="font-size: 11px; font-weight: bold; color: #435254;">Detailed Asset Class:</label>
            <select id="assetClassDropdown" style="width: 100%; padding: 4px; margin-top: 2px; border: 1px solid #CAD1D3; border-radius: 3px; font-size: 11px; background: white;">
              <option value="">Select Asset Class...</option>
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
        </div>

        <!-- Create Button -->
        <div style="text-align: center; margin-top: 8px;">
          <button onclick="createInEfficy()" 
             style="display: inline-block; background: linear-gradient(135deg, #17E88F 0%, #00C896 100%); 
                    color: #003F2D; padding: 8px 16px; border: none; border-radius: 20px; 
                    font-weight: bold; font-size: 11px; box-shadow: 0 3px 6px rgba(23, 232, 143, 0.3); 
                    transition: all 0.3s ease; cursor: pointer;">
            🏗️ Create in Efficy
          </button>
        </div>

        <!-- Error Display -->
        <div id="error-info" style="display: none; background: #fee2e2; border: 1px solid #fecaca; padding: 8px; border-radius: 4px; margin-top: 8px;">
          <h4 style="margin: 0 0 6px 0; color: #dc2626; font-size: 11px; font-weight: bold;">⚠️ Data Loading Issues</h4>
          <div id="error-details" style="font-size: 10px; color: #dc2626;"></div>
        </div>
      </div>

      <script>
        // Global variables to store fetched data
        window.cadastreData = null;
        
        function createInEfficy() {
          const assetClass = document.getElementById('assetClassDropdown').value;
          if (!assetClass) {
            alert('Please select an Asset Class first!');
            return;
          }
          
          if (!window.cadastreData) {
            alert('Cadastre data not loaded yet. Please wait.');
            return;
          }
          
          const pointData = window.cadastreData.point;
          const parcelData = window.cadastreData.parcel;
          
          console.log('🏗️ Creating in Efficy with comprehensive data:', {
            pointData,
            parcelData,
            assetClass
          });
          
          // Use the formatted address and other comprehensive data
          const address = pointData ? formatAddress(pointData) : 'N/A';
          const parcelKey = parcelData ? parcelData.parcelkey : '';
          const area = parcelData ? parcelData.area_m2 : '';
          
          // Construct URL with comprehensive parameters
          const efficyUrl = 'https://efficy.cbre.be/crm/view/Prop/new?' + 
            'guid=' + encodeURIComponent(pointData?.guid || '') +
            '&address=' + encodeURIComponent(address) +
            '&parcelkey=' + encodeURIComponent(parcelKey) +
            '&area=' + encodeURIComponent(area) +
            '&postcode=' + encodeURIComponent(pointData?.postcode || '') +
            '&country=' + encodeURIComponent(pointData?.country || '') +
            '&assetClass=' + encodeURIComponent(assetClass);
          
          window.open(efficyUrl, '_blank');
        }
        
        function formatAddress(pointData) {
          if (!pointData) return 'N/A';
          
          let address = '';
          
          // Street
          const street = pointData.street_nl || pointData.street_fr || pointData.street_de;
          if (street && pointData.number) {
            address = street + ' ' + pointData.number;
          } else if (street) {
            address = street;
          }
          
          // City and postcode
          const city = pointData.town_nl || pointData.town_fr || pointData.town_de;
          if (city) {
            if (address) address += ', ';
            if (pointData.postcode) {
              address += pointData.postcode + ' ' + city;
            } else {
              address += city;
            }
          }
          
          return address || 'Address not available';
        }
        
        function formatArea(areaM2) {
          if (!areaM2) return 'N/A';
          
          if (areaM2 >= 10000) {
            return (areaM2 / 10000).toFixed(2) + ' hectares';
          } else {
            return areaM2.toLocaleString() + ' m²';
          }
        }
      </script>
    </div>
  `;
};