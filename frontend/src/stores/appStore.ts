import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { AppState, Place, SearchFilters, LayersState, MapViewState } from '../types';
import { appConfig } from '../config/app.config';

interface AppStore extends AppState {
  // Map actions
  setMap: (map: __esri.Map) => void;
  setView: (view: __esri.MapView) => void;
  setMapReady: (ready: boolean) => void;
  updateViewState: (state: Partial<MapViewState>) => void;

  // Layer actions
  toggleLayer: (layerId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  setLayerLoading: (layerId: string, loading: boolean) => void;
  setLayerError: (layerId: string, error: string | null) => void;

  // Search actions
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: Place[]) => void;
  setSearchLoading: (loading: boolean) => void;
  setSearchError: (error: string | null) => void;
  setSelectedPlace: (place: Place | null) => void;
  clearSearch: () => void;

  // Filter actions
  updateFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
}

const initialLayersState: LayersState = appConfig.layers.reduce((acc, layer) => {
  acc[layer.id] = {
    visible: layer.visible,
    opacity: layer.opacity || 1.0,
    loading: false,
    error: null
  };
  return acc;
}, {} as LayersState);

const initialFilters: SearchFilters = {
  radius: appConfig.search.defaultRadius,
  openNow: false
};

export const useAppStore = create<AppStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      map: null,
      view: null,
      isMapReady: false,
      layers: initialLayersState,
      search: {
        query: '',
        results: [],
        isLoading: false,
        error: null,
        selectedPlace: null
      },
      filters: initialFilters,

      // Map actions
      setMap: (map) => set({ map }),
      setView: (view) => set({ view }),
      setMapReady: (ready) => set({ isMapReady: ready }),
      updateViewState: (state) => {
        // This could be used to persist view state or trigger other actions
        console.log('View state updated:', state);
      },

      // Layer actions
      toggleLayer: (layerId) =>
        set((state) => ({
          layers: {
            ...state.layers,
            [layerId]: {
              ...state.layers[layerId],
              visible: !state.layers[layerId]?.visible
            }
          }
        })),

      setLayerOpacity: (layerId, opacity) =>
        set((state) => ({
          layers: {
            ...state.layers,
            [layerId]: {
              ...state.layers[layerId],
              opacity
            }
          }
        })),

      setLayerLoading: (layerId, loading) =>
        set((state) => ({
          layers: {
            ...state.layers,
            [layerId]: {
              ...state.layers[layerId],
              loading
            }
          }
        })),

      setLayerError: (layerId, error) =>
        set((state) => ({
          layers: {
            ...state.layers,
            [layerId]: {
              ...state.layers[layerId],
              error
            }
          }
        })),

      // Search actions
      setSearchQuery: (query) =>
        set((state) => ({
          search: { ...state.search, query }
        })),

      setSearchResults: (results) =>
        set((state) => ({
          search: { ...state.search, results }
        })),

      setSearchLoading: (isLoading) =>
        set((state) => ({
          search: { ...state.search, isLoading }
        })),

      setSearchError: (error) =>
        set((state) => ({
          search: { ...state.search, error }
        })),

      setSelectedPlace: (selectedPlace) =>
        set((state) => ({
          search: { ...state.search, selectedPlace }
        })),

      clearSearch: () =>
        set((state) => ({
          search: {
            ...state.search,
            query: '',
            results: [],
            selectedPlace: null,
            error: null
          }
        })),

      // Filter actions
      updateFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters }
        })),

      resetFilters: () => set({ filters: initialFilters })
    })),
    {
      name: 'app-store'
    }
  )
);

// Selectors for optimized subscriptions
export const selectMap = (state: AppStore) => state.map;
export const selectView = (state: AppStore) => state.view;
export const selectIsMapReady = (state: AppStore) => state.isMapReady;
export const selectLayers = (state: AppStore) => state.layers;
export const selectSearch = (state: AppStore) => state.search;
export const selectFilters = (state: AppStore) => state.filters;