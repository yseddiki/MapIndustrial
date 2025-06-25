// src/services/PropertyService.js - EFFICY PROPERTY CREATION SERVICE

import { CONFIG } from '../config/config';

export class PropertyService {
  
  /**
   * Create a new property in Efficy using the Property API
   * @param {Object} cadastreData - Complete cadastre data with point, parcel, building, submarket
   * @param {string} assetClass - Selected asset class
   * @returns {Promise<Object>} - API response
   */
  static async createProperty(cadastreData, assetClass) {
    try {
      console.log('🏗️ Creating property in Efficy via API with data:', cadastreData);
      
      // Build the property data structure
      const propertyData = this.buildPropertyData(cadastreData, assetClass);
      
      console.log('📤 Sending property data to Efficy:', propertyData);
      
      // Make API call to create property
      const response = await fetch(CONFIG.API_ENDPOINTS.PROPERTY_API, {
        method: "POST",
        headers: {
          accept: "*/*",
          "pw-database-env": "prod",
          "pw-efficy-key": CONFIG.API_KEYS.PROPERTY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(propertyData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Property created successfully:', result);
      
      return {
        success: true,
        data: result,
        propertyId: result.K_PROPERTY || result.id || 'Unknown'
      };

    } catch (error) {
      console.error('❌ Error creating property:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build property data structure for Efficy API
   * @param {Object} cadastreData - Cadastre data with point, parcel, building, submarket
   * @param {string} assetClass - Selected asset class
   * @returns {Object} - Formatted property data for API
   */
  static buildPropertyData(cadastreData, assetClass) {
    const { point, parcel, buildings, submarket } = cadastreData;
    
    // Build property name from street + number
    const propertyName = this.buildPropertyName(point);
    
    // Start with basic property structure
    const propertyData = {
      NAME: propertyName,
      MEMO: `Property created from cadastre data - Asset Class: ${assetClass}`
    };

    // ✅ POINT/ADDRESS DATA MAPPING
    if (point) {
      // Basic address fields
      point.guid && (propertyData.F_ARCGIS_ADDRESS = point.guid);
      point.country && (propertyData.F_COUNTRY = point.country);
      point.town_fr && (propertyData.F_CITY_FR = point.town_fr);
      point.town_nl && (propertyData.F_CITY_NL = point.town_nl);
      point.town_de && (propertyData.F_CITY_DE = point.town_de);
      point.postcode && (propertyData.F_POSTCODE = point.postcode);
      point.street_fr && (propertyData.F_STREET_FR = point.street_fr);
      point.street_nl && (propertyData.F_STREET_NL = point.street_nl);
      point.street_de && (propertyData.F_STREET_DE = point.street_de);
      point.number && (propertyData.F_STREET_NUM = point.number);
      
      // Coordinates
      point.x && (propertyData.LONGITUDE = point.x);
      point.y && (propertyData.LATITUDE = point.y);
      
      // Building reference
      point.building_guid && (propertyData.F_ARCGIS_PROPERTY = point.building_guid);
    }

    // ✅ PARCEL DATA MAPPING
    if (parcel) {
      parcel.guid && (propertyData.F_ARCGIS_PARCEL = parcel.guid);
      parcel.area_m2 && (propertyData.F_ARCGIS_PARCEL_ESTA = parcel.area_m2);
    }

    // ✅ BUILDING DATA MAPPING
    if (buildings && buildings.length > 0) {
      const building = buildings[0]; // Use first building
      building.area_m2 && (propertyData.F_TOTAL_ARCGIS_B = building.area_m2);
    }

    // ✅ SUBMARKET DATA MAPPING
    if (submarket) {
      // Asset class submarkets
      submarket.officesubmarket && (propertyData.F_OFFICE_SUBMARKET = submarket.officesubmarket);
      submarket.logisticsubmarket && (propertyData.F_LOG_INDU_SUBMARKET = submarket.logisticsubmarket);
      submarket.retailsubmarket && (propertyData.F_RETAIL_SUBMARKET = submarket.retailsubmarket);
      
      // Administrative areas - Arrondissement
      submarket.t_arrd_nl && (propertyData.F_ARRD_NL = submarket.t_arrd_nl);
      submarket.t_arrd_fr && (propertyData.F_ARRD_FR = submarket.t_arrd_fr);
      submarket.t_arrd_de && (propertyData.F_ARRD_DE = submarket.t_arrd_de);
      
      // Administrative areas - Municipality
      submarket.t_mun_nl && (propertyData.F_MUN_NL = submarket.t_mun_nl);
      submarket.t_mun_fr && (propertyData.F_MUN_FR = submarket.t_mun_fr);
      submarket.t_mun_de && (propertyData.F_MUN_DE = submarket.t_mun_de);
      
      // Administrative areas - Province
      submarket.t_provi_nl && (propertyData.F_PROVI_NL = submarket.t_provi_nl);
      submarket.t_provi_fr && (propertyData.F_PROVI_FR = submarket.t_provi_fr);
      submarket.t_provi_de && (propertyData.F_PROVI_DE = submarket.t_provi_de);
      
      // Administrative areas - Region
      submarket.t_regio_nl && (propertyData.F_REGION_NL = submarket.t_regio_nl);
      submarket.t_regio_fr && (propertyData.F_REGION_FR = submarket.t_regio_fr);
      submarket.t_regio_de && (propertyData.F_REGION_DE = submarket.t_regio_de);
      
      // Sector information
      submarket.t_sec_nl && (propertyData.F_SEC_NL = submarket.t_sec_nl);
      submarket.t_sec_fr && (propertyData.F_SEC_FR = submarket.t_sec_fr);
      submarket.t_sec_de && (propertyData.F_SEC_DE = submarket.t_sec_de);
      submarket.mun_distr && (propertyData.F_MUN_DIST = submarket.mun_distr);
      
      // NIS6 data (special handling)
      submarket.t_nis6_nl && (propertyData.F_NIS6_NL = submarket.t_nis6_nl);
      submarket.t_nis6_fr && (propertyData.F_NIS6_FR = submarket.t_nis6_fr);
      
      // Statistical codes
      submarket.c_nis7 && (propertyData.F_C_NIS7 = submarket.c_nis7);
      submarket.c_nis6 && (propertyData.F_C_NIS6 = submarket.c_nis6);
      submarket.cnis5_2022 && (propertyData.F_CNIS5_2022 = submarket.cnis5_2022);
      submarket.cnis_arrd_ && (propertyData.F_CNIS_ARRD = submarket.cnis_arrd_);
      submarket.cnis_provi && (propertyData.F_CNIS_PROVI = submarket.cnis_provi);
      submarket.cnis_regio && (propertyData.F_CNIS_REGIO = submarket.cnis_regio);
      
      // NUTS codes
      submarket.nuts1_2021 && (propertyData.F_NUTS1_2021 = submarket.nuts1_2021);
      submarket.nuts2_2021 && (propertyData.F_NUTS2_2021 = submarket.nuts2_2021);
      submarket.nuts3_2021 && (propertyData.F_NUTS3_2021 = submarket.nuts3_2021);
      
      // Geographic measurements
      submarket.m_area_ha && (propertyData.F_M_AREA_HA = submarket.m_area_ha);
      submarket.m_peri_m && (propertyData.F_M_PERI_M = submarket.m_peri_m);
      submarket.shape_leng && (propertyData.F_SHAPE_LENGTH = submarket.shape_leng);
      submarket.SHAPE__Length && (propertyData.F_SHAPE__LENGTH = submarket.SHAPE__Length);
      submarket.SHAPE__Area && (propertyData.F_SHAPE__AREA = submarket.SHAPE__Area);
    }

    return propertyData;
  }

  /**
   * Build property name from street and number
   * @param {Object} point - Point data with street and number info
   * @returns {string} - Formatted property name
   */
  static buildPropertyName(point) {
    if (!point) return 'Cadastre Property';
    
    // Get best available street name (prioritize FR, then NL, then DE)
    const street = point.street_fr || point.street_nl || point.street_de;
    
    if (street && point.number) {
      return `${street} ${point.number}`;
    } else if (street) {
      return street;
    } else if (point.number) {
      return `Property ${point.number}`;
    } else {
      return 'Cadastre Property';
    }
  }

  /**
   * Format address for display/logging
   * @param {Object} point - Point data
   * @returns {string} - Formatted address
   */
  static formatAddress(point) {
    if (!point) return 'N/A';
    
    let address = '';
    
    // Street and number
    const street = point.street_fr || point.street_nl || point.street_de;
    if (street && point.number) {
      address = `${street} ${point.number}`;
    } else if (street) {
      address = street;
    }
    
    // City and postcode
    const city = point.town_fr || point.town_nl || point.town_de;
    if (city) {
      if (address) address += ', ';
      if (point.postcode) {
        address += `${point.postcode} ${city}`;
      } else {
        address += city;
      }
    }
    
    // Country
    if (point.country && point.country !== 'BEL') {
      address += `, ${point.country}`;
    }
    
    return address || 'Address not available';
  }

  /**
   * Validate that we have minimum required data for property creation
   * @param {Object} cadastreData - Cadastre data
   * @returns {Object} - Validation result
   */
  static validatePropertyData(cadastreData) {
    const errors = [];
    
    if (!cadastreData || !cadastreData.point) {
      errors.push('No cadastre point data available');
    } else {
      const { point } = cadastreData;
      
      // Check for minimum required fields
      if (!point.x || !point.y) {
        errors.push('Missing coordinates');
      }
      
      if (!point.street_fr && !point.street_nl && !point.street_de) {
        errors.push('Missing street information');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}