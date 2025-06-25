// src/config/config.js - UPDATED WITH BELGIUM CENTER

export const CONFIG = {
  API_ENDPOINTS: {
    EFFICY_CRM: "https://efficy.cbre.be/crm/json",
    PROPERTY_API: "https://propertywebservice-rq67n.ondigitalocean.app/efficy/entity/Prop?key=0"
  },
  API_KEYS: {
    EFFICY: "65D8CAECB10F43809F938ECB571EDADF",
    PROPERTY: "B4B1BE19638C4028A956AE78B443FF96"
  },
  MAP: {
    // ✅ UPDATED: Center on middle of Belgium instead of Brussels
    CENTER: [4.5, 50.5], // Middle of Belgium [longitude, latitude]
    ZOOM: 8, // ✅ UPDATED: Slightly zoomed out to show more of Belgium
    BASEMAP: 'satellite'
  },
  ARCGIS: {
    API_URL: 'https://js.arcgis.com/4.28/',
    CSS_URL: 'https://js.arcgis.com/4.28/esri/themes/light/main.css',
    // ✅ FIXED: Use FeatureServer instead of MapServer for proper data access
    CADASTRE_LAYER_URL: 'https://arcgiscenter.cbre.eu/arcgis/rest/services/Belgium/Cadastre/FeatureServer/2'
  },
  // ✅ NEW: Coordinate system configuration
  COORDINATES: {
    // Belgian Lambert 72 (EPSG:31370) - Used by cadastre data
    LAMBERT_72_WKID: 31370,
    // WGS84 (EPSG:4326) - Used by web maps
    WGS84_WKID: 4326
  }
};