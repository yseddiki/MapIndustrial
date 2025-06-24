// src/services/CadastreService.js

export class CadastreService {
  static CADASTRE_BASE_URL = 'https://arcgiscenter.cbre.eu/arcgis/rest/services/Belgium/Cadastre/FeatureServer';
  static SUBMARKET_BASE_URL = 'https://arcgiscenter.cbre.eu/arcgis/rest/services/Hosted/Submarkets_Arrondissements_Provinces/FeatureServer';
  
  // Layer endpoints (matches your Efficy backend)
  static LAYERS = {
    PARCELS: `${this.CADASTRE_BASE_URL}/0`,      // Parcel data
    BUILDINGS: `${this.CADASTRE_BASE_URL}/1`,    // Building data  
    POINTS: `${this.CADASTRE_BASE_URL}/2`,       // Point data (what we click on)
    SUBMARKETS: `${this.SUBMARKET_BASE_URL}/0`   // Submarket data
  };

  /**
   * Fetch comprehensive cadastre data when a point is clicked (matches Efficy backend pattern)
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
        submarket: null,
        errors: []
      };

      if (pointData) {
        // Step 2: Get building data if building_guid exists (matches your backend logic)
        if (pointData.building_guid) {
          try {
            const buildingData = await this.queryBuildingDataByGuid(pointData.building_guid);
            result.buildings = buildingData;
            
            // Step 3: Get parcel data using building's parcel_guid (matches your backend)
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

        // Step 4: Get submarket data using coordinates (matches your backend)
        if (pointData.x && pointData.y) {
          try {
            const submarketData = await this.querySubmarketData(pointData.x, pointData.y);
            result.submarket = submarketData;
          } catch (error) {
            result.errors.push(`Submarket data: ${error.message}`);
          }
        }
      }

      console.log('📊 Cadastre data fetched (Efficy pattern):', result);
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

    const response = await fetch(url);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features[0].attributes;
    }
    return null;
  }

  /**
   * Query building data from Layer 1 using building_guid (matches Efficy backend)
   */
  static async queryBuildingData(buildingGuid) {
    // Use building_guid instead of parcel_guid to match your backend logic
    const query = {
      where: `guid = '${buildingGuid}'`,
      outFields: 'seq,id,guid,parcel_guid,area_m2', // Match your backend outFields
      f: 'json',
      returnGeometry: true
    };

    const url = `${this.LAYERS.BUILDINGS}/query?${new URLSearchParams(query)}`;
    console.log('🏢 Querying building data by building_guid:', url);

    const response = await fetch(url);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features.map(feature => feature.attributes);
    }
    return [];
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

    const response = await fetch(url);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features[0].attributes;
    }
    return null;
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
}