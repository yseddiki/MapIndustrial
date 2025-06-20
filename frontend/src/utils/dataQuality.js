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
    case 'GREY': return [202, 209, 211]; // Light Grey #CAD1D3
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
    case 'GREY': return '#CAD1D3';
    default: return '#999999';
  }
};

export const createPopupContent = (building, qualityInfo) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.2; color: #2c3e50; font-size: 12px;">
      
      <!-- Quality Status Header -->
      <div style="background: linear-gradient(135deg, #003F2D 0%, #012A2D 100%); color: white; padding: 8px; margin: -10px -10px 8px -10px; border-radius: 6px; text-align: center;">
        <div style="font-size: 18px; margin-bottom: 4px;">${getQualityIcon(qualityInfo.level)}</div>
        <div style="font-size: 12px; font-weight: bold; color: ${getQualityColor(qualityInfo.level)};">${qualityInfo.label}</div>
      </div>

      <!-- Property Information -->
      <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
        <h4 style="margin: 0 0 6px 0; color: #003F2D; font-size: 11px; font-weight: bold;">📋 Property Details</h4>
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px; font-size: 11px;">
          <strong>📍 Address:</strong><span>${building.address || 'N/A'}</span>
          <strong>🗺️ Coordinates:</strong><span>${building.latitude?.toFixed(4) || 'N/A'}, ${building.longitude?.toFixed(4) || 'N/A'}</span>
        </div>
      </div>

      <!-- Data Information -->
      <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
        <h4 style="margin: 0 0 6px 0; color: #003F2D; font-size: 11px; font-weight: bold;">📊 Data Information</h4>
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px; font-size: 11px;">
          <strong>🏛️ Cadastre:</strong><span>${building.F_ARCGIS_ADDRESS || 'Not available'}</span>
          <strong>📐 Surface:</strong><span>${building.TOTALSURFACE ? building.TOTALSURFACE + ' m²' : 'Not available'}</span>
          <strong>🏢 Tenants:</strong><span>${building.TENANTS || 'Not available'}</span>
          <strong>👤 Owner:</strong><span>${building.OWNER || 'Not available'}</span>
        </div>
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
      
      <!-- Quality Status Header -->
      <div style="background: linear-gradient(135deg, #003F2D 0%, #012A2D 100%); color: white; padding: 8px; margin: -10px -10px 8px -10px; border-radius: 6px; text-align: center;">
        <div style="font-size: 18px; margin-bottom: 4px;">📍</div>
        <div style="font-size: 12px; font-weight: bold; color: #CAD1D3;">Not in Efficy ! (From cadastre)</div>
      </div>

      <!-- Cadastre Information -->
      <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
        <h4 style="margin: 0 0 6px 0; color: #003F2D; font-size: 11px; font-weight: bold;">🏛️ Cadastre Details</h4>
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px; font-size: 11px;">
          <strong>📋 Cadastre ID:</strong><span>{CAPAKEY}</span>
          <strong>📍 Address:</strong><span>{ADRES}</span>
          <strong>🏘️ Municipality:</strong><span>{GEMEENTE}</span>
          <strong>📐 Surface:</strong><span>{OPPERVL} m²</span>
          <strong>🏢 Nature:</strong><span>{AARD}</span>
          <strong>💰 Cadastral Income:</strong><span>€{KADINKO}</span>
        </div>
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

      <script>
        function createInEfficy() {
          const assetClass = document.getElementById('assetClassDropdown').value;
          if (!assetClass) {
            alert('Please select an Asset Class first!');
            return;
          }
          
          // Get cadastre details from the popup
          const capakey = '{CAPAKEY}';
          const address = '{ADRES}';
          const municipality = '{GEMEENTE}';
          const surface = '{OPPERVL}';
          
          // Construct URL with parameters for creating new property in Efficy
          const efficyUrl = 'https://efficy.cbre.be/crm/view/Prop/new?' + 
            'capakey=' + encodeURIComponent(capakey) +
            '&address=' + encodeURIComponent(address) +
            '&municipality=' + encodeURIComponent(municipality) +
            '&surface=' + encodeURIComponent(surface) +
            '&assetClass=' + encodeURIComponent(assetClass);
          
          window.open(efficyUrl, '_blank');
        }
      </script>
    </div>
  `;
};