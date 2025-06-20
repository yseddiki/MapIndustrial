// src/hooks/useMapLayers.js

import { useState, useCallback } from 'react';
import { CONFIG } from '../config/config';
import { getDataQualityLevel, getColorForLevel, createPopupContent, createCadastrePopupContent } from '../utils/dataQuality';

export const useMapLayers = () => {
  const [cadastreLayer, setCadastreLayer] = useState(null);
  const [buildingsLayer, setBuildingsLayer] = useState(null);

  const createCadastreLayer = useCallback(async () => {
    // Ensure ArcGIS API is loaded
    if (!window.require) {
      throw new Error('ArcGIS API not loaded yet');
    }

    const { FeatureLayer, SimpleRenderer } = await new Promise((resolve, reject) => {
      window.require([
        'esri/layers/FeatureLayer',
        'esri/renderers/SimpleRenderer'
      ], (FeatureLayer, SimpleRenderer) => {
        resolve({ FeatureLayer, SimpleRenderer });
      }, reject);
    });

    // Create custom renderer for small gray dots
    const cadastreRenderer = new SimpleRenderer({
      symbol: {
        type: "simple-marker",
        size: 4, // ✅ Small dots (2px) as requested
        color: [128, 128, 128], // ✅ Gray color (128,128,128) as requested
        outline: {
          width: 1,
          color: [128, 128, 128] // Gray outline
        }
      }
    });

    // Create popup template for cadastre points
    const cadastrePopupTemplate = {
      title: "📍 Cadastre Property",
      content: createCadastrePopupContent()
    };

    // Create the CBRE Belgium Cadastre layer as FeatureLayer
    const layer = new FeatureLayer({
      url: CONFIG.ARCGIS.CADASTRE_LAYER_URL,
      title: 'Belgium Cadastre',
      opacity: 1,
      visible: false, // Start hidden for performance
      renderer: cadastreRenderer,
      popupTemplate: cadastrePopupTemplate,
      // Performance optimizations
      maxScale: 0, // No maximum scale limit
      minScale: 100000, // Only show when zoomed in enough (better performance)
      refreshInterval: 0, // Don't auto-refresh
      // Optimize feature display
      featureReduction: {
        type: "cluster",
        clusterRadius: "20px",
        clusterMinSize: "16px",
        clusterMaxSize: "30px"
      }
    });

    console.log('🏛️ Cadastre layer created:', {
      url: layer.url,
      title: layer.title,
      visible: layer.visible,
      minScale: layer.minScale
    });

    // Add event listener for when cadastre features are clicked
    layer.on('layerview-create', (event) => {
      console.log('🗺️ Cadastre layer view created');
      
      // Listen for clicks on the layer
      event.layerView.on('click', (clickEvent) => {
        if (clickEvent.graphic) {
          console.log('📍 Cadastre feature clicked:', {
            graphic: clickEvent.graphic,
            attributes: clickEvent.graphic.attributes,
            geometry: clickEvent.graphic.geometry
          });
        }
      });
    });

    setCadastreLayer(layer);
    return layer;
  }, []);

  const createBuildingsLayer = useCallback(async () => {
    // Ensure ArcGIS API is loaded
    if (!window.require) {
      throw new Error('ArcGIS API not loaded yet');
    }

    const { GraphicsLayer } = await new Promise((resolve, reject) => {
      window.require([
        'esri/layers/GraphicsLayer'
      ], (GraphicsLayer) => {
        resolve({ GraphicsLayer });
      }, reject);
    });

    // Create buildings layer
    const layer = new GraphicsLayer({
      title: 'Buildings',
      visible: true,
      listMode: 'show'
    });

    setBuildingsLayer(layer);
    return layer;
  }, []);

  const addBuildingsToMap = useCallback(async (buildingData, targetLayer) => {
    if (!targetLayer || !buildingData || buildingData.length === 0) {
      console.error('❌ CRITICAL: Invalid parameters for addBuildingsToMap');
      return;
    }

    // Ensure ArcGIS API is loaded
    if (!window.require) {
      console.error('❌ CRITICAL: ArcGIS API not loaded yet');
      return;
    }

    try {
      const { Graphic, Point, SimpleMarkerSymbol, PopupTemplate } = await new Promise((resolve, reject) => {
        window.require([
          'esri/Graphic',
          'esri/geometry/Point',
          'esri/symbols/SimpleMarkerSymbol',
          'esri/PopupTemplate'
        ], (Graphic, Point, SimpleMarkerSymbol, PopupTemplate) => {
          resolve({ Graphic, Point, SimpleMarkerSymbol, PopupTemplate });
        }, reject);
      });

      // Clear existing graphics
      targetLayer.removeAll();
      targetLayer.visible = true;

      let addedCount = 0;
      buildingData.forEach((building, index) => {
        try {
          // Assess data quality
          const qualityInfo = getDataQualityLevel(building);
          const markerColor = getColorForLevel(qualityInfo.level);

          // Create point geometry
          const point = new Point({
            longitude: building.longitude,
            latitude: building.latitude,
            spatialReference: { wkid: 4326 }
          });

          // Create smaller, color-coded symbol
          const symbol = new SimpleMarkerSymbol({
            color: markerColor,
            outline: {
              color: markerColor,
              width: 1
            },
            size: '10px'
          });

          // Create enhanced popup template with quality info
          const popupTemplate = new PopupTemplate({
            title: `🏢 ${building.name}`,
            content: createPopupContent(building, qualityInfo)
          });

          // Create graphic with quality info in attributes
          const graphic = new Graphic({
            geometry: point,
            symbol: symbol,
            attributes: {
              ...building,
              dataQuality: qualityInfo.level,
              dataQualityLabel: qualityInfo.label
            },
            popupTemplate: popupTemplate
          });

          // Add to layer
          targetLayer.add(graphic);
          addedCount++;
          
        } catch (buildingError) {
          console.error(`❌ ERROR adding building ${building.name}:`, buildingError);
        }
      });

      // Force layer refresh
      targetLayer.refresh();
      
      console.log(`🎉 Added ${addedCount}/${buildingData.length} buildings to map`);

    } catch (error) {
      console.error('💥 CRITICAL ERROR in addBuildingsToMap:', error);
    }
  }, []);

  const updateCadastreVisibility = useCallback((visible) => {
    if (cadastreLayer) {
      console.log(`🟫 Cadastre layer visibility changing to: ${visible}`);
      
      if (visible) {
        console.log('📊 Loading cadastre layer - this may take a moment due to many points...');
        
        // Add event listener to log graphics when layer loads
        const handleLayerLoad = () => {
          setTimeout(() => {
            if (cadastreLayer.source && cadastreLayer.source.length > 0) {
              console.log(`📍 Cadastre layer loaded with ${cadastreLayer.source.length} features`);
              console.log('📋 Sample cadastre feature:', cadastreLayer.source.items[0]);
            } else {
              // For feature layers, we can't easily access all graphics
              console.log('📍 Cadastre layer is visible - features will load dynamically based on map extent');
              console.log('🗺️ Cadastre layer details:', {
                url: cadastreLayer.url,
                title: cadastreLayer.title,
                type: cadastreLayer.type,
                visible: cadastreLayer.visible,
                opacity: cadastreLayer.opacity
              });
            }
          }, 2000); // Give it time to load
        };

        // Set up one-time event listener for when layer becomes visible
        if (!cadastreLayer.visible) {
          cadastreLayer.watch('visible', (newVisible) => {
            if (newVisible) {
              handleLayerLoad();
            }
          });
        } else {
          handleLayerLoad();
        }
      } else {
        console.log('🙈 Hiding cadastre layer to improve performance');
      }
      
      cadastreLayer.visible = visible;
    } else {
      console.log('❌ Cadastre layer not available yet');
    }
  }, [cadastreLayer]);

  return {
    cadastreLayer,
    buildingsLayer,
    createCadastreLayer,
    createBuildingsLayer,
    addBuildingsToMap,
    updateCadastreVisibility
  };
};