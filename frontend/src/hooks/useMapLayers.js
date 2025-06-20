// src/hooks/useMapLayers.js

import { useState, useCallback } from 'react';
import { CONFIG } from '../config/config';
import { getDataQualityLevel, getColorForLevel, createPopupContent, createCadastrePopupContent } from '../utils/dataQuality';

export const useMapLayers = () => {
  const [cadastreLayer, setCadastreLayer] = useState(null);
  const [buildingsLayer, setBuildingsLayer] = useState(null);

  const createCadastreLayer = useCallback(async () => {
    const { FeatureLayer, SimpleRenderer } = await new Promise((resolve, reject) => {
      window.require([
        'esri/layers/FeatureLayer',
        'esri/renderers/SimpleRenderer'
      ], (FeatureLayer, SimpleRenderer) => {
        resolve({ FeatureLayer, SimpleRenderer });
      }, reject);
    });

    // Create custom renderer for larger grey dots
    const cadastreRenderer = new SimpleRenderer({
      symbol: {
        type: "simple-marker",
        size: 8, // Bigger dots (8px)
        color: [202, 209, 211], // Grey color #CAD1D3
        outline: {
          width: 1,
          color: [202, 209, 211] // Grey outline
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
      visible: true,
      renderer: cadastreRenderer,
      popupTemplate: cadastrePopupTemplate
    });

    setCadastreLayer(layer);
    return layer;
  }, []);

  const createBuildingsLayer = useCallback(async () => {
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
      cadastreLayer.visible = visible;
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