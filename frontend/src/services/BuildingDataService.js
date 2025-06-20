// src/services/BuildingDataService.js

import { CONFIG } from '../config/config';

export class BuildingDataService {
  static async fetchBuildings() {
    try {
      const response = await fetch(CONFIG.API_ENDPOINTS.EFFICY_CRM, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Efficy-ApiKey": CONFIG.API_KEYS.EFFICY,
          "X-Efficy-Logoff": "True"
        },
        body: JSON.stringify([
          {
            "@name": "api",
            commit: false,
            closecontext: true,
            "@func": [
              {
                "@name": "query",
                key: 3618 // Updated to use the correct query ID
              }
            ]
          }
        ])
      });
      
      const raw = await response.json();
      console.log('Raw API response:', raw);
      const data = raw[0]["@func"][0]['#result']['#data'];

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return this.parseBuildings(data);
    } catch (error) {
      console.error('Error fetching building data:', error);
      throw error;
    }
  }

  static parseBuildings(apiData) {
    if (!apiData || !Array.isArray(apiData)) {
      return [];
    }

    const buildings = [];
    
    apiData.forEach(record => {
      const latitude = record.LATITUDE;
      const longitude = record.LONGITUDE;
      const buildingName = record.NAME || `Property ${record.K_PROPERTY}`;
      const propertyId = record.K_PROPERTY;
      
      let address = '';
      if (record.F_STREET_NL && record.F_STREET_NUM) {
        address = `${record.F_STREET_NL} ${record.F_STREET_NUM}`;
        if (record.F_CITY_NL || record.F_CITY_FR) {
          address += `, ${record.F_CITY_NL || record.F_CITY_FR}`;
        }
      } else if (record.F_CITY_NL || record.F_CITY_FR) {
        address = record.F_CITY_NL || record.F_CITY_FR;
      }

      if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
        buildings.push({
          id: propertyId || Math.random().toString(36),
          name: buildingName,
          address: address,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          cityFR: record.F_CITY_FR,
          cityNL: record.F_CITY_NL,
          streetNL: record.F_STREET_NL,
          streetNumber: record.F_STREET_NUM,
          propertyId: record.K_PROPERTY,
          assetClasses: record.F_ASSET_CLASSES,
          ...record
        });
      }
    });

    console.log(`Parsed ${buildings.length} valid buildings from ${apiData.length} records`);
    return buildings;
  }

  // Fallback mock data for testing (matching your API structure)
  static getMockBuildings() {
    return [
      {
        id: '27899',
        name: 'Langveld Park',
        address: 'Petrus Basteleusstraat 2, Sint-Pieters-Leeuw',
        latitude: 50.78771,
        longitude: 4.27725,
        propertyId: '27899',
        cityFR: 'Sint-Pieters-Leeuw',
        cityNL: 'Sint-Pieters-Leeuw',
        streetNL: 'Petrus Basteleusstraat',
        streetNumber: '2',
        assetClasses: ';4;',
        F_ARCGIS_ADDRESS: 'Petrus Basteleusstraat 2, 1600 Sint-Pieters-Leeuw',
        TOTALSURFACE: 5000,
        TENANTS: 'Company A',
        OWNER: 'Owner A'
      },
      {
        id: '27900',
        name: 'CBRE Brussels Office',
        address: 'Rue de la Loi 227, Brussels',
        latitude: 50.8454,
        longitude: 4.3695,
        propertyId: '27900',
        cityFR: 'Bruxelles',
        cityNL: 'Brussel',
        streetNL: 'Wetstraat',
        streetNumber: '227',
        assetClasses: ';1;',
        F_ARCGIS_ADDRESS: 'Rue de la Loi 227, 1040 Brussels',
        TOTALSURFACE: 10000,
        TENANTS: 'CBRE',
        OWNER: ''
      },
      {
        id: '27901',
        name: 'Antwerp Business Center',
        address: 'Meir 24, Antwerp',
        latitude: 51.2194,
        longitude: 4.4025,
        propertyId: '27901',
        cityFR: 'Anvers',
        cityNL: 'Antwerpen',
        streetNL: 'Meir',
        streetNumber: '24',
        assetClasses: ';2;3;',
        F_ARCGIS_ADDRESS: '',
        TOTALSURFACE: 0,
        TENANTS: '',
        OWNER: ''
      }
    ];
  }
}