// src/hooks/useArcGISAPI.js

import { useState, useEffect, useCallback } from 'react';
import { CONFIG } from '../config/config';

export const useArcGISAPI = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  const loadArcGISAPI = useCallback(() => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.require && isLoaded) {
        resolve();
        return;
      }

      // Load the ArcGIS API script if not already loaded
      if (!window.require) {
        const script = document.createElement('script');
        script.src = CONFIG.ARCGIS.API_URL;
        script.onload = () => {
          console.log('✅ ArcGIS API script loaded');
          setIsLoaded(true);
          resolve();
        };
        script.onerror = (err) => {
          console.error('❌ Failed to load ArcGIS API script');
          setError('Failed to load ArcGIS API');
          reject(err);
        };
        document.head.appendChild(script);
      } else {
        setIsLoaded(true);
        resolve();
      }
    });
  }, [isLoaded]);

  // Load CSS
  useEffect(() => {
    if (!document.querySelector('link[href*="arcgis"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = CONFIG.ARCGIS.CSS_URL;
      document.head.appendChild(link);
    }
  }, []);

  const requireModules = useCallback((modules) => {
    return new Promise((resolve, reject) => {
      if (!window.require) {
        reject(new Error('ArcGIS API not loaded'));
        return;
      }

      window.require(modules, (...loadedModules) => {
        resolve(loadedModules);
      }, reject);
    });
  }, []);

  return {
    isLoaded,
    error,
    loadArcGISAPI,
    requireModules
  };
};