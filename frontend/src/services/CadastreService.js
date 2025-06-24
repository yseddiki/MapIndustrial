// src/services/CadastreService.js - FIXED VERSION

export class CadastreService {
  // ✅ SIMPLIFIED: Use correct URL structure for FeatureServer endpoints (cadastre only)
  static CADASTRE_BASE_URL = 'https://arcgiscenter.cbre.eu/arcgis/rest/services/Belgium/Cadastre/FeatureServer';
  
  // ✅ UPDATED: Layer endpoints using FeatureServer for cadastre layers only
  static LAYERS = {
    PARCELS: `${this.CADASTRE_BASE_URL}/0`,      // Parcel data
    BUILDINGS: `${this.CADASTRE_BASE_URL}/1`,    // Building data  
    POINTS: `${this.CADASTRE_BASE_URL}/2`        // Point data (what we click on)
  };

  /**
   * Fetch comprehensive cadastre data when a point is clicked (simplified - no submarket)
   * @param {string} pointGuid - The GUID from the clicked cadastre point
   * @returns {Promise<Object>} - Combined cadastre data
   */
  static async fetchCadastreDataByGuid(pointGuid) {
    try {
      console.log('🔍 Fetching cadastre data for GUID:', pointGuid);
      
      // Step 1: Get point/address data (immediate)
      const pointData = await this.queryPointData(pointGuid);
      
      const result = {
        point: pointData,
        buildings: [],
        parcel: null,
        errors: []
      };

      if (pointData) {
        // Step 2: Get building data if building_guid exists
        if (pointData.building_guid) {
          try {
            const buildingData = await this.queryBuildingData(pointData.building_guid);
            result.buildings = buildingData;
            
            // Step 3: Get parcel data using building's parcel_guid
            if (buildingData.length > 0 && buildingData[0].parcel_guid) {
              try {
                const parcelData = await this.queryParcelData(buildingData[0].parcel_guid);
                result.parcel = parcelData;
              } catch (error) {
                result.errors.push(`Parcel data: ${error.message}`);
              }
            }
          } catch (error) {
            result.errors.push(`Building data: ${error.message}`);
          }
        }
      }

      console.log('📊 Cadastre data fetched:', result);
      return result;

    } catch (error) {
      console.error('❌ Error fetching cadastre data:', error);
      throw error;
    }
  }

  /**
   * Query point data from Layer 2
   */
  static async queryPointData(guid) {
    const query = {
      where: `guid = '${guid}'`,
      outFields: '*',
      f: 'json',
      returnGeometry: true
    };

    const url = `${this.LAYERS.POINTS}/query?${new URLSearchParams(query)}`;
    console.log('🗺️ Querying point data:', url);

    try {
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📍 Point query response:', data);
      
      if (data.error) {
        throw new Error(`Point query error: ${data.error.message || data.error}`);
      }
      
      if (data.features && data.features.length > 0) {
        const pointData = data.features[0].attributes;
        
        // Add geometry coordinates if available
        if (data.features[0].geometry) {
          const geom = data.features[0].geometry;
          pointData.x = geom.x;
          pointData.y = geom.y;
        }
        
        console.log('✅ Point data extracted:', pointData);
        return pointData;
      }
      
      console.warn('⚠️ No point features found for GUID:', guid);
      return null;
    } catch (error) {
      console.error('❌ Error querying point data:', error);
      throw error;
    }
  }

  /**
   * Query building data from Layer 1 using building_guid (matches Efficy backend)
   */
  static async queryBuildingData(buildingGuid) {
    const query = {
      where: `guid = '${buildingGuid}'`,
      outFields: 'seq,id,guid,parcel_guid,area_m2', // Match your backend outFields
      f: 'json',
      returnGeometry: true
    };

    const url = `${this.LAYERS.BUILDINGS}/query?${new URLSearchParams(query)}`;
    console.log('🏢 Querying building data by building_guid:', url);

    try {
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('🏢 Building query response:', data);
      
      if (data.error) {
        throw new Error(`Building query error: ${data.error.message || data.error}`);
      }
      
      if (data.features && data.features.length > 0) {
        const buildings = data.features.map(feature => feature.attributes);
        console.log('✅ Building data extracted:', buildings);
        return buildings;
      }
      
      console.warn('⚠️ No building features found for GUID:', buildingGuid);
      return [];
    } catch (error) {
      console.error('❌ Error querying building data:', error);
      throw error;
    }
  }

  /**
   * Query parcel data from Layer 0
   */
  static async queryParcelData(guid) {
    const query = {
      where: `guid = '${guid}'`,
      outFields: '*',
      f: 'json', 
      returnGeometry: true
    };

    const url = `${this.LAYERS.PARCELS}/query?${new URLSearchParams(query)}`;
    console.log('📋 Querying parcel data:', url);

    try {
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📋 Parcel query response:', data);
      
      if (data.error) {
        throw new Error(`Parcel query error: ${data.error.message || data.error}`);
      }
      
      if (data.features && data.features.length > 0) {
        const parcelData = data.features[0].attributes;
        console.log('✅ Parcel data extracted:', parcelData);
        return parcelData;
      }
      
      console.warn('⚠️ No parcel features found for GUID:', guid);
      return null;
    } catch (error) {
      console.error('❌ Error querying parcel data:', error);
      throw error;
    }
  }

  /**
   * Format area in square meters to a readable format
   */
  static formatArea(areaM2) {
    if (!areaM2) return 'N/A';
    
    if (areaM2 >= 10000) {
      return `${(areaM2 / 10000).toFixed(2)} hectares`;
    } else {
      return `${areaM2.toLocaleString()} m²`;
    }
  }

  /**
   * Get the best available address from point data (using actual cadastre field names)
   */
  static formatAddress(pointData) {
    if (!pointData) return 'N/A';
    
    console.log('🏠 Formatting address from point data:', pointData);
    
    let address = '';
    
    // Street - prioritize NL, then FR, then DE
    const street = pointData.street_nl || pointData.street_fr || pointData.street_de;
    if (street && pointData.number) {
      address = `${street} ${pointData.number}`;
    } else if (street) {
      address = street;
    }
    
    // City and postcode - prioritize NL, then FR, then DE
    const city = pointData.town_nl || pointData.town_fr || pointData.town_de;
    if (city) {
      if (address) {
        address += `, `;
      }
      if (pointData.postcode) {
        address += `${pointData.postcode} ${city}`;
      } else {
        address += city;
      }
    }
    
    // Country
    if (pointData.country && pointData.country !== 'Belgium' && pointData.country !== 'BEL') {
      address += `, ${pointData.country}`;
    }
    
    const formattedAddress = address || 'Address not available';
    console.log('📍 Formatted address:', formattedAddress);
    
    return formattedAddress;
  }

  /**
   * ✅ SIMPLIFIED: Test connection to cadastre services
   */
  static async testConnection() {
    console.log('🔍 Testing cadastre service connections...');
    
    const tests = [
      { name: 'Points Layer', url: `${this.LAYERS.POINTS}/query?where=1=1&returnCountOnly=true&f=json` },
      { name: 'Buildings Layer', url: `${this.LAYERS.BUILDINGS}/query?where=1=1&returnCountOnly=true&f=json` },
      { name: 'Parcels Layer', url: `${this.LAYERS.PARCELS}/query?where=1=1&returnCountOnly=true&f=json` }
    ];

    const results = [];
    
    for (const test of tests) {
      try {
        console.log(`🧪 Testing ${test.name}...`);
        const response = await fetch(test.url);
        const data = await response.json();
        
        if (data.error) {
          results.push({ name: test.name, status: 'ERROR', error: data.error.message });
          console.error(`❌ ${test.name} failed:`, data.error);
        } else {
          results.push({ name: test.name, status: 'OK', count: data.count });
          console.log(`✅ ${test.name} OK - ${data.count} features`);
        }
      } catch (error) {
        results.push({ name: test.name, status: 'FAILED', error: error.message });
        console.error(`💥 ${test.name} failed:`, error);
      }
    }
    
    console.log('🧪 Connection test results:', results);
    return results;
  }
}