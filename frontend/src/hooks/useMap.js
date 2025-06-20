// src/hooks/useMap.js

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

  const initializeMap = useCallback(async (cadastreLayer, buildingsLayer) => {
    try {
      setError(null);
      
      // Load ArcGIS modules
      const { Map, MapView } = await loadArcGISModules();

      // Create map with layers - PUT BUILDINGS LAYER ON TOP
      const map = new Map({
        basemap: CONFIG.MAP.BASEMAP,
        layers: [cadastreLayer, buildingsLayer]
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

      // Store view reference
      viewRef.current = view;

      // Handle view ready event
      view.when(() => {
        console.log('Map loaded successfully');
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
      
      // Set popup behavior on the view
      view.popup.dockEnabled = false;
      view.popup.collapseEnabled = false;


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