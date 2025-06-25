// src/services/PropertyService.js - UPDATED TO HANDLE NO ASSET CLASS

import { CONFIG } from '../config/config';

export class PropertyService {
  
  /**
   * Create a new property in Efficy using the Property API
   * @param {Object} cadastreData - Complete cadastre data with point, parcel, building, submarket
   * @param {Array} assetClassIds - Selected asset class IDs (can be null/empty)
   * @param {Array} subAssetClassIds - Selected sub-asset class IDs (can be null/empty)
   * @returns {Promise<Object>} - API response
   */
  static async createProperty(cadastreData, assetClassIds = [], subAssetClassIds = []) {
    try {
      console.log('🏗️ Creating property in Efficy via API with data:', {
        cadastreData,
        assetClassIds,
        subAssetClassIds
      });
      
      // Build the property data structure
      const propertyData = this.buildPropertyData(cadastreData, assetClassIds, subAssetClassIds);
      
      // ✅ REMOVED: Type validation - now handled in safeAddField
      
      console.log('📤 ========== SENDING TO EFFICY API ==========');
      console.log('🌐 API Endpoint:', CONFIG.API_ENDPOINTS.PROPERTY_API);
      console.log('📦 Request Body (JSON):');
      console.log(JSON.stringify(propertyData, null, 2));
      console.log('📊 Request Stats:');
      console.log(`   📌 Field Count: ${Object.keys(propertyData).length}`);
      console.log(`   📌 String Fields: ${Object.keys(propertyData).filter(k => typeof propertyData[k] === 'string').length}`);
      console.log(`   📌 Number Fields: ${Object.keys(propertyData).filter(k => typeof propertyData[k] === 'number').length}`);
      console.log(`   📌 Request Size: ${JSON.stringify(propertyData).length} characters`);
      console.log('📤 ==========================================');
      
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

      console.log('📥 ========== API RESPONSE ==========');
      console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
      console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ API Success Response:', result);
      console.log('📥 ================================');
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
   * ✅ ENHANCED: Helper function to safely add field only if it has a valid value
   * @param {Object} data - Target data object
   * @param {string} fieldName - Field name to add
   * @param {any} value - Value to add
   * @param {string} expectedType - Expected type ('string', 'number')
   */
  static safeAddField(data, fieldName, value, expectedType = 'string') {
    // Check if value exists and is not empty
    if (value === null || value === undefined || value === '') {
      console.log(`🚫 Skipping field '${fieldName}': empty value (${value})`);
      return;
    }

    // For numeric fields, ensure it's a valid number
    if (expectedType === 'number') {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        console.log(`🚫 Skipping field '${fieldName}': invalid number (${value})`);
        return;
      }
      data[fieldName] = numValue;
      console.log(`✅ Added numeric field '${fieldName}': ${numValue}`);
    } else {
      // For string fields, ensure it's not just whitespace
      const strValue = String(value).trim();
      if (strValue === '') {
        console.log(`🚫 Skipping field '${fieldName}': empty string after trim`);
        return;
      }
      data[fieldName] = strValue;
      console.log(`✅ Added string field '${fieldName}': "${strValue}"`);
    }
  }

  /**
   * Build property data structure for Efficy API
   * @param {Object} cadastreData - Cadastre data with point, parcel, building, submarket
   * @param {Array} assetClassIds - Selected asset class IDs
   * @param {Array} subAssetClassIds - Selected sub-asset class IDs
   * @returns {Object} - Formatted property data for API
   */
  static buildPropertyData(cadastreData, assetClassIds = [], subAssetClassIds = []) {
    const { point, parcel, buildings, submarket } = cadastreData;
    
    // Build property name from street + number
    const propertyName = this.buildPropertyName(point);
    
    // ✅ UPDATED: Build comprehensive MEMO with all cadastre data and asset classes
    const memoText = this.buildComprehensiveMemo(cadastreData, assetClassIds, subAssetClassIds);
    
    console.log('🏗️ ========== BUILDING PROPERTY DATA ==========');
    console.log('📋 Base property data:', { NAME: propertyName });
    console.log('📝 MEMO length:', memoText.length, 'characters');
    console.log('🎯 Asset Classes:', assetClassIds);
    console.log('🎯 Sub-Asset Classes:', subAssetClassIds);

    // ✅ SIMPLIFIED: Only include essential fields to avoid validation errors
    const propertyData = {
      NAME: propertyName,
      MEMO: memoText
    };

    // ✅ NEW: Add asset class fields in Efficy format
    if (assetClassIds && assetClassIds.length > 0) {
      // Format: ';id;' for single value or ';id;id;' for multiple values
      propertyData.F_ASSET_CLASSES = ';' + assetClassIds.join(';') + ';';
      console.log(`✅ Added F_ASSET_CLASSES: "${propertyData.F_ASSET_CLASSES}"`);
    }

    if (subAssetClassIds && subAssetClassIds.length > 0) {
      // Format: ';id;id;' for multiple values
      propertyData.F_SUB_ASSET_CLASSES = ';' + subAssetClassIds.join(';') + ';';
      console.log(`✅ Added F_SUB_ASSET_CLASSES: "${propertyData.F_SUB_ASSET_CLASSES}"`);
    }

    // ✅ ESSENTIAL FIELDS ONLY - No risky numeric fields
    if (point) {
      console.log('📍 Processing essential point data only');
      
      // ✅ COMPLETE: All address fields (strings)
      this.safeAddField(propertyData, 'F_ARCGIS_ADDRESS', point.guid, 'string');
      this.safeAddField(propertyData, 'F_CITY_FR', point.town_fr, 'string');
      this.safeAddField(propertyData, 'F_CITY_NL', point.town_nl, 'string');
      this.safeAddField(propertyData, 'F_CITY_DE', point.town_de, 'string');
      this.safeAddField(propertyData, 'F_POSTCODE', point.postcode, 'string');
      this.safeAddField(propertyData, 'F_STREET_FR', point.street_fr, 'string');
      this.safeAddField(propertyData, 'F_STREET_NL', point.street_nl, 'string');
      this.safeAddField(propertyData, 'F_STREET_DE', point.street_de, 'string');
      this.safeAddField(propertyData, 'F_STREET_NUM', point.number, 'string');
      this.safeAddField(propertyData, 'F_ARCGIS_PROPERTY', point.building_guid, 'string');
      
      // Country (special handling for integer conversion)
      if (point.country) {
        const countryId = this.getCountryId(point.country);
        propertyData.F_COUNTRY = countryId;
        console.log(`✅ Added country field 'F_COUNTRY': ${countryId} (from '${point.country}')`);
      }
      
      // ✅ COORDINATES: Only add if they're valid numbers
      if (point.x && point.y && !isNaN(point.x) && !isNaN(point.y)) {
        propertyData.LONGITUDE = Number(point.x);
        propertyData.LATITUDE = Number(point.y);
        console.log(`✅ Added coordinates: ${propertyData.LONGITUDE}, ${propertyData.LATITUDE}`);
      }
    }

    // ✅ COMPLETE: PARCEL DATA MAPPING with validation
    if (parcel) {
      console.log('📋 Processing parcel data');
      this.safeAddField(propertyData, 'F_ARCGIS_PARCEL', parcel.guid, 'string');
      this.safeAddField(propertyData, 'F_ARCGIS_PARCEL_ESTA', parcel.area_m2, 'number');
    }

    // ✅ COMPLETE: BUILDING DATA MAPPING with validation
    if (buildings && buildings.length > 0) {
      console.log('🏢 Processing building data');
      const building = buildings[0]; // Use first building
      this.safeAddField(propertyData, 'F_TOTAL_ARCGIS_B', building.area_m2, 'number');
    }

    // ✅ COMPLETE: SUBMARKET DATA MAPPING with validation
    if (submarket) {
      console.log('🗺️ Processing submarket data');
      
      // Asset class submarkets (strings)
      this.safeAddField(propertyData, 'F_OFFICE_SUBMARKET', submarket.officesubmarket, 'string');
      this.safeAddField(propertyData, 'F_LOG_INDU_SUBMARKET', submarket.logisticsubmarket, 'string');
      this.safeAddField(propertyData, 'F_RETAIL_SUBMARKET', submarket.retailsubmarket, 'string');
      
      // Administrative areas - Arrondissement (strings)
      this.safeAddField(propertyData, 'F_ARRD_NL', submarket.t_arrd_nl, 'string');
      this.safeAddField(propertyData, 'F_ARRD_FR', submarket.t_arrd_fr, 'string');
      this.safeAddField(propertyData, 'F_ARRD_DE', submarket.t_arrd_de, 'string');
      
      // Administrative areas - Municipality (strings)
      this.safeAddField(propertyData, 'F_MUN_NL', submarket.t_mun_nl, 'string');
      this.safeAddField(propertyData, 'F_MUN_FR', submarket.t_mun_fr, 'string');
      this.safeAddField(propertyData, 'F_MUN_DE', submarket.t_mun_de, 'string');
      
      // Administrative areas - Province (strings)
      this.safeAddField(propertyData, 'F_PROVINCE_NL', submarket.t_provi_nl, 'string');
      this.safeAddField(propertyData, 'F_PROVI_FR', submarket.t_provi_fr, 'string');
      this.safeAddField(propertyData, 'F_PROVINCE_DE', submarket.t_provi_de, 'string');
      
      // Administrative areas - Region (strings)
      this.safeAddField(propertyData, 'F_REGION_NL', submarket.t_regio_nl, 'string');
      this.safeAddField(propertyData, 'F_REGION_FR', submarket.t_regio_fr, 'string');
      this.safeAddField(propertyData, 'F_REGION_DE', submarket.t_regio_de, 'string');
      
      // Sector information (strings)
      this.safeAddField(propertyData, 'F_SECTOR_NL', submarket.t_sec_nl, 'string');
      this.safeAddField(propertyData, 'F_SECTOR_FR', submarket.t_sec_fr, 'string');
      this.safeAddField(propertyData, 'F_SECTOR_DE', submarket.t_sec_de, 'string');
      this.safeAddField(propertyData, 'F_MUN_DIST', submarket.mun_distr, 'string');
      
      // NIS6 data (strings)
      this.safeAddField(propertyData, 'F_NIS6_NL', submarket.t_nis6_nl, 'string');
      this.safeAddField(propertyData, 'F_NIS6_FR', submarket.t_nis6_fr, 'string');
      
      // Statistical codes (strings)
      this.safeAddField(propertyData, 'F_C_NIS7', submarket.c_nis7, 'string');
      this.safeAddField(propertyData, 'F_C_NIS6', submarket.c_nis6, 'string');
      this.safeAddField(propertyData, 'F_CNIS5_2022', submarket.cnis5_2022, 'string');
      this.safeAddField(propertyData, 'F_CNIS_ARRD', submarket.cnis_arrd_, 'string');
      this.safeAddField(propertyData, 'F_CNIS_PROVI', submarket.cnis_provi, 'string');
      this.safeAddField(propertyData, 'F_CNIS_REGIO', submarket.cnis_regio, 'string');
      
      // NUTS codes (strings)
      this.safeAddField(propertyData, 'F_NUTS1_2021', submarket.nuts1_2021, 'string');
      this.safeAddField(propertyData, 'F_NUTS2_2021', submarket.nuts2_2021, 'string');
      this.safeAddField(propertyData, 'F_NUTS3_2021', submarket.nuts3_2021, 'string');
      
      // Geographic measurements (numbers) - with safe validation
      this.safeAddField(propertyData, 'F_TOTAL', submarket.m_area_ha, 'number');
    }

    // ✅ MEMO CONTAINS READABLE VERSION - Individual fields contain raw data for Efficy
    console.log('📝 All detailed data stored in both individual fields AND MEMO for complete integration');

    console.log('🏗️ ========== FINAL PROPERTY DATA ==========');
    console.log('📦 Complete property data object:', propertyData);
    console.log('📊 Field count:', Object.keys(propertyData).length);
    console.log('🔍 Fields being sent:', Object.keys(propertyData));
    Object.keys(propertyData).forEach(key => {
      if (key !== 'MEMO') { // Don't log full MEMO as it's long
        const value = propertyData[key];
        console.log(`   📌 ${key}: ${value} (${typeof value})`);
      } else {
        console.log(`   📌 MEMO: ${propertyData[key].length} characters of detailed data`);
      }
    });
    console.log('🏗️ ==========================================');

    return propertyData;
  }

  /**
   * ✅ UPDATED: Build comprehensive MEMO with all cadastre data and asset classes
   * @param {Object} cadastreData - Complete cadastre data
   * @param {Array} assetClassIds - Selected asset class IDs
   * @param {Array} subAssetClassIds - Selected sub-asset class IDs
   * @returns {string} - Formatted MEMO text
   */
  static buildComprehensiveMemo(cadastreData, assetClassIds = [], subAssetClassIds = []) {
    const { point, parcel, buildings, submarket } = cadastreData;
    let memo = [];

    // ✅ UPDATED: Header with asset class information
    memo.push('=== PROPERTY CREATED FROM CADASTRE DATA ===');
    memo.push(`Created on: ${new Date().toLocaleString()}`);
    
    // ✅ NEW: Asset class information
    if (assetClassIds && assetClassIds.length > 0) {
      const assetClassNames = this.getAssetClassNames(assetClassIds);
      memo.push(`Asset Classes: ${assetClassNames.join(', ')}`);
    }
    
    if (subAssetClassIds && subAssetClassIds.length > 0) {
      const subAssetClassNames = this.getSubAssetClassNames(subAssetClassIds);
      memo.push(`Sub-Asset Classes: ${subAssetClassNames.join(', ')}`);
    }
    
    memo.push('');

    // ✅ POINT/ADDRESS INFORMATION
    if (point) {
      memo.push('📍 ADDRESS INFORMATION:');
      point.guid && memo.push(`GUID: ${point.guid}`);
      point.id && memo.push(`ID: ${point.id}`);
      
      // Address
      const address = this.formatAddress(point);
      memo.push(`Address: ${address}`);
      
      // Detailed address components
      point.street_fr && memo.push(`Street (FR): ${point.street_fr}`);
      point.street_nl && memo.push(`Street (NL): ${point.street_nl}`);
      point.street_de && memo.push(`Street (DE): ${point.street_de}`);
      point.number && memo.push(`Number: ${point.number}`);
      point.postcode && memo.push(`Postcode: ${point.postcode}`);
      point.town_fr && memo.push(`City (FR): ${point.town_fr}`);
      point.town_nl && memo.push(`City (NL): ${point.town_nl}`);
      point.town_de && memo.push(`City (DE): ${point.town_de}`);
      point.country && memo.push(`Country: ${point.country}`);
      
      // Coordinates
      if (point.x && point.y) {
        memo.push(`Coordinates: ${point.x}, ${point.y}`);
      }
      
      // Building reference
      point.building_guid && memo.push(`Building GUID: ${point.building_guid}`);
      memo.push('');
    }

    // ✅ BUILDING INFORMATION
    if (buildings && buildings.length > 0) {
      memo.push('🏢 BUILDING INFORMATION:');
      buildings.forEach((building, index) => {
        memo.push(`Building ${index + 1}:`);
        building.id && memo.push(`  ID: ${building.id}`);
        building.guid && memo.push(`  GUID: ${building.guid}`);
        building.area_m2 && memo.push(`  Area: ${this.formatArea(building.area_m2)}`);
        building.parcel_guid && memo.push(`  Parcel GUID: ${building.parcel_guid}`);
      });
      memo.push('');
    }

    // ✅ PARCEL INFORMATION
    if (parcel) {
      memo.push('📋 PARCEL INFORMATION:');
      parcel.parcelkey && memo.push(`Parcel Key: ${parcel.parcelkey}`);
      parcel.seq && memo.push(`ID: ${parcel.seq}`);
      parcel.guid && memo.push(`GUID: ${parcel.guid}`);
      parcel.area_m2 && memo.push(`Area: ${this.formatArea(parcel.area_m2)}`);
      memo.push('');
    }

    // ✅ SUBMARKET INFORMATION
    if (submarket) {
      memo.push('🗺️ SUBMARKET INFORMATION:');
      
      // Asset class submarkets
      memo.push('Asset Class Submarkets:');
      submarket.officesubmarket && memo.push(`  Office: ${submarket.officesubmarket}`);
      submarket.logisticsubmarket && memo.push(`  Logistics: ${submarket.logisticsubmarket}`);
      submarket.retailsubmarket && memo.push(`  Retail: ${submarket.retailsubmarket}`);
      
      // Administrative areas
      memo.push('Administrative Areas:');
      submarket.t_mun_nl && memo.push(`  Municipality (NL): ${submarket.t_mun_nl}`);
      submarket.t_mun_fr && memo.push(`  Municipality (FR): ${submarket.t_mun_fr}`);
      submarket.t_mun_de && memo.push(`  Municipality (DE): ${submarket.t_mun_de}`);
      submarket.t_arrd_nl && memo.push(`  Arrondissement (NL): ${submarket.t_arrd_nl}`);
      submarket.t_arrd_fr && memo.push(`  Arrondissement (FR): ${submarket.t_arrd_fr}`);
      submarket.t_arrd_de && memo.push(`  Arrondissement (DE): ${submarket.t_arrd_de}`);
      submarket.t_provi_nl && memo.push(`  Province (NL): ${submarket.t_provi_nl}`);
      submarket.t_provi_fr && memo.push(`  Province (FR): ${submarket.t_provi_fr}`);
      submarket.t_provi_de && memo.push(`  Province (DE): ${submarket.t_provi_de}`);
      submarket.t_regio_nl && memo.push(`  Region (NL): ${submarket.t_regio_nl}`);
      submarket.t_regio_fr && memo.push(`  Region (FR): ${submarket.t_regio_fr}`);
      submarket.t_regio_de && memo.push(`  Region (DE): ${submarket.t_regio_de}`);
      
      // Sector information
      if (submarket.t_sec_nl || submarket.t_sec_fr || submarket.t_sec_de) {
        memo.push('Sector Information:');
        submarket.t_sec_nl && memo.push(`  Sector (NL): ${submarket.t_sec_nl}`);
        submarket.t_sec_fr && memo.push(`  Sector (FR): ${submarket.t_sec_fr}`);
        submarket.t_sec_de && memo.push(`  Sector (DE): ${submarket.t_sec_de}`);
        submarket.mun_distr && memo.push(`  Municipal District: ${submarket.mun_distr}`);
      }
      
      // Statistical codes
      memo.push('Statistical Codes:');
      submarket.c_nis6 && memo.push(`  NIS6: ${submarket.c_nis6}`);
      submarket.c_nis7 && memo.push(`  NIS7: ${submarket.c_nis7}`);
      submarket.cnis5_2022 && memo.push(`  NIS5 2022: ${submarket.cnis5_2022}`);
      submarket.nuts1_2021 && memo.push(`  NUTS1 2021: ${submarket.nuts1_2021}`);
      submarket.nuts2_2021 && memo.push(`  NUTS2 2021: ${submarket.nuts2_2021}`);
      submarket.nuts3_2021 && memo.push(`  NUTS3 2021: ${submarket.nuts3_2021}`);
      
      // Geographic measurements
      if (submarket.m_area_ha || submarket.m_peri_m) {
        memo.push('Geographic Measurements:');
        submarket.m_area_ha && memo.push(`  Area: ${parseFloat(submarket.m_area_ha).toFixed(2)} hectares`);
        submarket.m_peri_m && memo.push(`  Perimeter: ${parseFloat(submarket.m_peri_m).toFixed(2)} meters`);
        submarket.shape_leng && memo.push(`  Shape Length: ${parseFloat(submarket.shape_leng).toFixed(2)}`);
        submarket.SHAPE__Area && memo.push(`  Shape Area: ${parseFloat(submarket.SHAPE__Area).toFixed(2)}`);
        submarket.SHAPE__Length && memo.push(`  Shape Length (Alt): ${parseFloat(submarket.SHAPE__Length).toFixed(2)}`);
      }
      
      memo.push('');
    }

    // Footer
    memo.push('=== END CADASTRE DATA ===');
    memo.push('This property was automatically created from Belgian cadastre data.');
    memo.push('All available information has been preserved in this memo.');

    return memo.join('\n');
  }

  /**
   * ✅ ENHANCED: Helper function to safely format area
   * @param {any} areaM2 - Area in square meters
   * @returns {string} - Formatted area string
   */
  static formatArea(areaM2) {
    if (!areaM2 || isNaN(areaM2)) return 'N/A';
    
    const area = parseFloat(areaM2);
    if (area >= 10000) {
      return `${(area / 10000).toFixed(2)} hectares (${area.toLocaleString()} m²)`;
    } else {
      return `${area.toLocaleString()} m²`;
    }
  }

  /**
   * ✅ NEW: Get asset class names by IDs
   * @param {Array} assetClassIds - Asset class IDs
   * @returns {Array} - Asset class names
   */
  static getAssetClassNames(assetClassIds) {
    const assetClassMap = {
      1: 'Office',
      2: 'Retail',
      3: 'Residential',
      4: 'Industrial & Logistics'
    };
    
    return assetClassIds.map(id => assetClassMap[id] || `Unknown (${id})`);
  }

  /**
   * ✅ NEW: Get sub-asset class names by IDs
   * @param {Array} subAssetClassIds - Sub-asset class IDs
   * @returns {Array} - Sub-asset class names
   */
  static getSubAssetClassNames(subAssetClassIds) {
    const subAssetClassMap = {
      1: 'Highstreet',
      2: 'Out-of-town stand-alone',
      3: 'Shopping centre',
      4: 'Senior living',
      5: 'Student housing',
      6: 'Residential care centre',
      7: 'Multifamily',
      8: 'Income-producing residential',
      9: 'Industrial',
      10: 'Semi-industrial',
      11: 'Logistics',
      12: 'Leisure',
      13: 'Hospital',
      14: 'School',
      15: 'Parking',
      16: 'Data centre',
      17: 'Life Science',
      18: 'Apartment',
      19: 'Co-living',
      20: 'House',
      21: 'Bloc sales',
      22: 'Land',
      23: 'Hotel',
      24: 'Office',
      25: 'Retail (others)',
      26: 'Supermarket',
      27: 'Out-of-town retail park',
      28: 'Service flats',
      29: 'Co-living',
      30: 'Life science',
      31: 'Horeca',
      32: 'SME business unit',
      33: 'Undefined'
    };
    
    return subAssetClassIds.map(id => subAssetClassMap[id] || `Unknown (${id})`);
  }

  /**
   * Convert country code to display name
   * @param {string} countryCode - Country code (BEL, LUX, etc.)
   * @returns {string} - Country display name
   */
  static getCountryName(countryCode) {
    const countryNames = {
      'BEL': 'Belgium',
      'LUX': 'Luxembourg', 
      'FRA': 'France',
      'NLD': 'Netherlands',
      'DEU': 'Germany'
    };
    
    const upperCode = countryCode.toString().toUpperCase();
    return countryNames[upperCode] || countryCode;
  }

  /**
   * Convert country code to Efficy integer ID
   * @param {string} countryCode - Country code (BEL, LUX, etc.)
   * @returns {number} - Efficy country ID
   */
  static getCountryId(countryCode) {
    const countryMap = {
      'BEL': 25,    // Belgium
      'LUX': 128,   // Luxembourg
      'FRA': 76,    // France (if needed)
      'NLD': 158,   // Netherlands (if needed)
      'DEU': 57     // Germany (if needed)
    };
    
    // Convert to uppercase for comparison
    const upperCode = countryCode.toString().toUpperCase();
    
    // Return mapped ID or default to Belgium if unknown
    const countryId = countryMap[upperCode] || 25;
    
    console.log(`🌍 Converting country code '${countryCode}' to ID: ${countryId}`);
    return countryId;
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
    
    // Country - display friendly name, not the code
    if (point.country && point.country !== 'BEL') {
      const countryName = this.getCountryName(point.country);
      address += `, ${countryName}`;
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

    // Note: Asset class validation is now handled in the UI
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}