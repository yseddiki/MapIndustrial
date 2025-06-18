import { AppConfig } from '../types';

export const appConfig: AppConfig = {
  map: {
    center: [4.3517, 50.8503], // Brussels, Belgium
    zoom: 10,
    basemap: 'streets-navigation-vector'
  },
  
  layers: [
    {
      id: 'cadastreMap',
      title: 'Cadastre Map Service',
      url: 'https://arcgiscenter.cbre.eu/arcgis/rest/services/Belgium/Cadastre/MapServer',
      type: 'MapImageLayer',
      visible: true,
      opacity: 0.8
    },
    {
      id: 'cadastreFeature',
      title: 'Cadastre Feature Service', 
      url: 'https://arcgiscenter.cbre.eu/arcgis/rest/services/Belgium/Cadastre/FeatureServer/0',
      type: 'FeatureLayer',
      visible: true,
      opacity: 1.0
    },
    {
      id: 'searchResults',
      title: 'Search Results',
      url: '',
      type: 'GraphicsLayer',
      visible: true,
      opacity: 1.0
    }
  ],

  googleMaps: {
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'geometry']
  },

  search: {
    defaultRadius: 1000, // meters
    maxResults: 20
  }
};

export const layerIds = {
  CADASTRE_MAP: 'cadastreMap',
  CADASTRE_FEATURE: 'cadastreFeature', 
  SEARCH_RESULTS: 'searchResults'
} as const;

export const searchTypes = {
  RESTAURANT: 'restaurant',
  HOTEL: 'lodging',
  SHOPPING: 'shopping_mall',
  HOSPITAL: 'hospital',
  SCHOOL: 'school',
  BANK: 'bank',
  GAS_STATION: 'gas_station'
} as const;

export const mapSettings = {
  MIN_ZOOM: 5,
  MAX_ZOOM: 20,
  DEFAULT_SEARCH_RADIUS: 1000,
  MAX_SEARCH_RADIUS: 5000
} as const;