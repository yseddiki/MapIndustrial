// Map Types
export interface MapConfig {
  center: [number, number];
  zoom: number;
  basemap: string;
}

export interface LayerConfig {
  id: string;
  title: string;
  url: string;
  type: 'MapImageLayer' | 'FeatureLayer' | 'GraphicsLayer';
  visible: boolean;
  opacity?: number;
}

export interface MapViewState {
  center: [number, number];
  zoom: number;
  extent?: __esri.Extent;
}

// Places Types
export interface Place {
  place_id: string;
  name: string;
  vicinity: string;
  formatted_address?: string;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  price_level?: number;
  photos?: PlacePhoto[];
  opening_hours?: {
    open_now: boolean;
  };
}

export interface PlacePhoto {
  height: number;
  width: number;
  photo_reference: string;
}

export interface PlaceSearchRequest {
  location: {
    lat: number;
    lng: number;
  };
  radius: number;
  type?: string;
  keyword?: string;
}

export interface PlaceSearchResponse {
  results: Place[];
  status: string;
  next_page_token?: string;
}

// Search Types
export interface SearchState {
  query: string;
  results: Place[];
  isLoading: boolean;
  error: string | null;
  selectedPlace: Place | null;
}

export interface SearchFilters {
  type?: string;
  radius: number;
  priceLevel?: number[];
  rating?: number;
  openNow?: boolean;
}

// Layer Management Types
export interface LayerState {
  visible: boolean;
  opacity: number;
  loading: boolean;
  error: string | null;
}

export interface LayersState {
  [layerId: string]: LayerState;
}

// App State Types
export interface AppState {
  map: __esri.Map | null;
  view: __esri.MapView | null;
  isMapReady: boolean;
  layers: LayersState;
  search: SearchState;
  filters: SearchFilters;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
}

// Component Props Types
export interface MapComponentProps {
  config: MapConfig;
  layers: LayerConfig[];
  onMapReady?: (map: __esri.Map, view: __esri.MapView) => void;
  onMapClick?: (event: __esri.ViewClickEvent) => void;
}

export interface SearchPanelProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  results: Place[];
  isLoading: boolean;
  error: string | null;
  onPlaceSelect: (place: Place) => void;
  selectedPlace: Place | null;
}

export interface LayerControlProps {
  layers: LayerConfig[];
  layersState: LayersState;
  onLayerToggle: (layerId: string) => void;
  onOpacityChange: (layerId: string, opacity: number) => void;
}

// Hook Return Types
export interface UseMapReturn {
  map: __esri.Map | null;
  view: __esri.MapView | null;
  isReady: boolean;
  error: string | null;
  addLayer: (layer: __esri.Layer) => void;
  removeLayer: (layerId: string) => void;
  toggleLayer: (layerId: string) => void;
}

export interface UsePlacesSearchReturn {
  search: (location: { lat: number; lng: number }, query?: string, filters?: SearchFilters) => Promise<void>;
  results: Place[];
  isLoading: boolean;
  error: string | null;
  clearResults: () => void;
}

// Configuration Types
export interface AppConfig {
  map: MapConfig;
  layers: LayerConfig[];
  googleMaps: {
    apiKey: string;
    libraries: string[];
  };
  search: {
    defaultRadius: number;
    maxResults: number;
  };
}

// Event Types
export interface MapClickEvent {
  coordinates: [number, number];
  mapPoint: __esri.Point;
  screenPoint: __esri.ScreenPoint;
}

export interface LayerLoadEvent {
  layer: __esri.Layer;
  status: 'loading' | 'loaded' | 'error';
  error?: Error;
}