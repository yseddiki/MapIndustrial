// src/hooks/useMap.js - UPDATED TO SUPPORT MULTIPLE LAYERS

import { useState, useEffect, useRef, useCallback } from 'react';
import { CONFIG } from '../config/config';

export const useMap = (mapContainerRef) => {
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const viewRef = useRef(null);

  const loadArcGISModules = useCallback(() => {
    return new Promise((resolve, reject) => {
      // Load the ArcGIS API script
      if (!window.require) {
        const script = document.createElement('script');
        script.src = CONFIG.ARCGIS.API_URL;
        script.onload = () => {
          window.require([
            'esri/Map',
            'esri/views/MapView',
            'esri/layers/FeatureLayer',
            'esri/layers/GraphicsLayer',
            'esri/Graphic',
            'esri/geometry/Point',
            'esri/symbols/SimpleMarkerSymbol',
            'esri/PopupTemplate',
            'esri/renderers/SimpleRenderer'
          ], (Map, MapView, FeatureLayer, GraphicsLayer, Graphic, Point, SimpleMarkerSymbol, PopupTemplate, SimpleRenderer) => {
            resolve({ Map, MapView, FeatureLayer, GraphicsLayer, Graphic, Point, SimpleMarkerSymbol, PopupTemplate, SimpleRenderer });
          }, reject);
        };
        script.onerror = reject;
        document.head.appendChild(script);
      } else {
        window.require([
          'esri/Map',
          'esri/views/MapView',
          'esri/layers/FeatureLayer',
          'esri/layers/GraphicsLayer',
          'esri/Graphic',
          'esri/geometry/Point',
          'esri/symbols/SimpleMarkerSymbol',
          'esri/PopupTemplate',
          'esri/renderers/SimpleRenderer'
        ], (Map, MapView, FeatureLayer, GraphicsLayer, Graphic, Point, SimpleMarkerSymbol, PopupTemplate, SimpleRenderer) => {
          resolve({ Map, MapView, FeatureLayer, GraphicsLayer, Graphic, Point, SimpleMarkerSymbol, PopupTemplate, SimpleRenderer });
        }, reject);
      }
    });
  }, []);

  // ✅ UPDATED: Initialize map with multiple layers in correct order
  const initializeMap = useCallback(async (...layers) => {
    try {
      setError(null);
      
      // Load ArcGIS modules
      const { Map, MapView } = await loadArcGISModules();

      // ✅ UPDATED: Create map with layers in the order they were passed
      // Expected order: submarketLayer, cadastreLayer, buildingsLayer (bottom to top)
      const validLayers = layers.filter(layer => layer !== null && layer !== undefined);
      
      console.log('🗺️ Initializing map with layers:', validLayers.map(layer => ({
        title: layer.title,
        type: layer.type,
        visible: layer.visible
      })));

      const map = new Map({
        basemap: CONFIG.MAP.BASEMAP,
        layers: validLayers // Add all layers in order
      });

      // Create map view
      const view = new MapView({
        container: mapContainerRef.current,
        map: map,
        center: CONFIG.MAP.CENTER,
        zoom: CONFIG.MAP.ZOOM,
        constraints: {
          snapToZoom: false
        }
      });

      // ✅ FIXED: Disable all popups completely - only use modals
      view.popup.dockEnabled = false;  // No docking
      view.popup.collapseEnabled = false;  // No collapse
      view.popup.spinnerEnabled = false;  // No loading spinner
      view.popup.highlightEnabled = false;  // No highlight
      view.popup.autoOpenEnabled = false;  // Never auto open popups
      view.popup.actions = [];  // Remove all actions
      view.popup.visible = false;  // Hide popup completely
      
      // ✅ ADDITIONAL: Ensure popup never shows
      view.popup.close();

      console.log('✅ V2: Popups completely disabled - modal only approach:', {
        dockEnabled: view.popup.dockEnabled,
        collapseEnabled: view.popup.collapseEnabled,
        spinnerEnabled: view.popup.spinnerEnabled,
        autoOpenEnabled: view.popup.autoOpenEnabled,
        visible: view.popup.visible,
        actionsCount: view.popup.actions.length,
        layersCount: validLayers.length
      });

      // Store view reference
      viewRef.current = view;

      // Handle view ready event
      view.when(() => {
        console.log('Map loaded successfully with simplified popups and', validLayers.length, 'layers');
        setIsMapReady(true);
      }, (error) => {
        console.error('Map view failed to load:', error);
        setError('Failed to initialize map view: ' + error.message);
      });

      // Handle map errors
      map.watch('loadStatus', (status) => {
        if (status === 'failed') {
          setError('Map failed to load. Trying alternative basemap...');
          setTimeout(() => {
            map.basemap = 'gray-vector';
          }, 1000);
        }
      });

      return { map, view };

    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to load map components: ' + err.message);
      throw err;
    }
  }, [mapContainerRef, loadArcGISModules]);

  const zoomToBuildings = useCallback((buildingsLayer) => {
    if (viewRef.current && buildingsLayer && buildingsLayer.graphics.length > 0) {
      setTimeout(() => {
        viewRef.current.goTo(buildingsLayer.graphics.items).catch(err => {
          console.log('Could not zoom to buildings:', err);
        });
      }, 1000);
    }
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsMapReady(false);
    window.location.reload();
  }, []);

  const handleTryDifferentBasemap = useCallback(async () => {
    setError(null);
    setIsMapReady(false);
    
    try {
      const { Map, MapView } = await loadArcGISModules();

      const map = new Map({
        basemap: 'gray'
      });

      const view = new MapView({
        container: mapContainerRef.current,
        map: map,
        center: CONFIG.MAP.CENTER,
        zoom: CONFIG.MAP.ZOOM
      });
      
      // ✅ FIXED: Disable all popups for fallback map too
      view.popup.dockEnabled = false;
      view.popup.collapseEnabled = false;
      view.popup.spinnerEnabled = false;
      view.popup.highlightEnabled = false;
      view.popup.autoOpenEnabled = false;
      view.popup.actions = [];
      view.popup.visible = false;
      view.popup.close();

      console.log('✅ V2: Popups completely disabled for fallback map - modal only');

      view.when(() => {
        setIsMapReady(true);
      });

    } catch (err) {
      setError('All basemap options failed: ' + err.message);
    }
  }, [mapContainerRef, loadArcGISModules]);

  const setProcessing = useCallback((processing, step = '') => {
    setIsProcessing(processing);
    setProcessingStep(step);
  }, []);

  // Add CSS for ArcGIS
  useEffect(() => {
    if (!document.querySelector('link[href*="arcgis"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = CONFIG.ARCGIS.CSS_URL;
      document.head.appendChild(link);
    }
  }, []);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
      }
      viewRef.current = null;
    };
  }, []);

  return {
    isMapReady,
    error,
    isProcessing,
    processingStep,
    viewRef,
    initializeMap,
    zoomToBuildings,
    handleRetry,
    handleTryDifferentBasemap,
    setProcessing
  };
};