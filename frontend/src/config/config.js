// src/config/config.js - FIXED VERSION

export const CONFIG = {
  API_ENDPOINTS: {
    EFFICY_CRM: "https://efficy.cbre.be/crm/json"
  },
  API_KEYS: {
    EFFICY: "65D8CAECB10F43809F938ECB571EDADF"
  },
  MAP: {
    CENTER: [4.3517, 50.8503], // Brussels, Belgium [longitude, latitude]
    ZOOM: 10,
    BASEMAP: 'satellite'
  },
  ARCGIS: {
    API_URL: 'https://js.arcgis.com/4.28/',
    CSS_URL: 'https://js.arcgis.com/4.28/esri/themes/light/main.css',
    // ✅ FIXED: Use FeatureServer instead of MapServer for proper data access
    CADASTRE_LAYER_URL: 'https://arcgiscenter.cbre.eu/arcgis/rest/services/Belgium/Cadastre/FeatureServer/2'
  }
};