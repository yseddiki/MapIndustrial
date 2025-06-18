import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';
import { mapService } from '../services/mapService';
import { MapConfig, LayerConfig, UseMapReturn } from '../types';

export const useMap = (
  config: MapConfig,
  layers: LayerConfig[],
  onMapClick?: (event: __esri.ViewClickEvent) => void
): UseMapReturn => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const isInitializing = useRef(false);

  const {
    map,
    view,
    isMapReady,
    setMap,
    setView,
    setMapReady,
    setLayerLoading,
    setLayerError,
    layers: layersState
  } = useAppStore();

  const initializeMap = useCallback(async () => {
    if (!mapContainerRef.current || isInitializing.current || map) return;

    isInitializing.current = true;

    try {
      // Set layers as loading
      layers.forEach(layer => setLayerLoading(layer.id, true));

      // Create map with layers
      const mapInstance = await mapService.createMap(config, layers);
      setMap(mapInstance);

      // Create map view
      const viewInstance = await mapService.createMapView(
        mapContainerRef.current,
        mapInstance,
        config
      );
      setView(viewInstance);

      // Add click event listener
      if (onMapClick) {
        viewInstance.on('click', onMapClick);
      }

      // Listen for layer load events
      mapInstance.layers.forEach((layer: __esri.Layer) => {
        layer.when(
          () => {
            setLayerLoading(layer.id, false);
            setLayerError(layer.id, null);
          },
          (error: Error) => {
            setLayerLoading(layer.id, false);
            setLayerError(layer.id, error.message);
          }
        );
      });

      setMapReady(true);
    } catch (error) {
      console.error('Failed to initialize map:', error);
      layers.forEach(layer => {
        setLayerLoading(layer.id, false);
        setLayerError(layer.id, 'Failed to load layer');
      });
    } finally {
      isInitializing.current = false;
    }
  }, [config, layers, onMapClick, map, setMap, setView, setMapReady, setLayerLoading, setLayerError]);

  const addLayer = useCallback(async (layer: __esri.Layer) => {
    if (!map) return;
    
    map.add(layer);
  }, [map]);

  const removeLayer = useCallback((layerId: string) => {
    if (!map) return;

    const layer = mapService.getLayerById(map, layerId);
    if (layer) {
      map.remove(layer);
    }
  }, [map]);

  const toggleLayer = useCallback((layerId: string) => {
    if (!map) return;

    mapService.toggleLayerVisibility(map, layerId);
  }, [map]);

  // Sync layer visibility with store state
  useEffect(() => {
    if (!map || !isMapReady) return;

    Object.entries(layersState).forEach(([layerId, layerState]) => {
      const layer = mapService.getLayerById(map, layerId);
      if (layer) {
        layer.visible = layerState.visible;
        layer.opacity = layerState.opacity;
      }
    });
  }, [map, isMapReady, layersState]);

  // Initialize map on mount
  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (view) {
        view.destroy();
      }
    };
  }, [view]);

  return {
    map,
    view,
    isReady: isMapReady,
    error: null, // Could be enhanced to track initialization errors
    addLayer,
    removeLayer,
    toggleLayer,
    mapContainerRef
  };
};