// src/hooks/useMapLayers.js - FIXED VERSION

import { useState, useCallback } from 'react';
import { CONFIG } from '../config/config';
import { getDataQualityLevel, getColorForLevel, createPopupContent, createCadastrePopupContent } from '../utils/dataQuality';
import { CadastreService } from '../services/CadastreService';

export const useMapLayers = () => {
  const [cadastreLayer, setCadastreLayer] = useState(null);
  const [buildingsLayer, setBuildingsLayer] = useState(null);

  // ✅ ENHANCED: Dynamic layer field inspection function with detailed logging
  const inspectLayerFields = useCallback((layer) => {
    console.log('🔍 ============ INSPECTING LAYER ============');
    console.log('🔍 Layer object:', layer);
    console.log('🔍 Layer constructor:', layer?.constructor?.name);
    console.log('🔍 Layer type:', typeof layer);
    
    const layerInfo = {
      title: layer.title,
      id: layer.id,
      url: layer.url,
      type: layer.type,
      fields: [],
      fieldsCount: 0,
      capabilities: layer.capabilities || [],
      extent: layer.fullExtent,
      renderer: layer.renderer
    };

    console.log('🗂️ Basic layer properties:', {
      title: layer.title,
      id: layer.id,
      url: layer.url,
      type: layer.type,
      visible: layer.visible,
      opacity: layer.opacity,
      hasFields: !!(layer.fields),
      fieldsProperty: layer.fields,
      fieldsLength: layer.fields?.length
    });

    if (layer.fields && layer.fields.length > 0) {
      layerInfo.fieldsCount = layer.fields.length;
      layerInfo.fields = layer.fields.map((field, index) => {
        const fieldInfo = {
          name: field.name,
          alias: field.alias,
          type: field.type,
          length: field.length,
          nullable: field.nullable,
          editable: field.editable,
          defaultValue: field.defaultValue
        };
        
        console.log(`📋 Field ${index + 1}/${layer.fields.length}:`, fieldInfo);
        return fieldInfo;
      });
      
      console.log('📋 All Layer Field Definitions:', layerInfo.fields);
      console.log('🎯 Field Names Available:', layer.fields.map(f => f.name));
      console.log('🔧 Field Types:', layer.fields.map(f => `${f.name}: ${f.type}`));
    } else {
      console.warn('⚠️ No fields found in layer');
      console.warn('⚠️ Layer.fields property:', layer.fields);
      console.warn('⚠️ Layer properties:', Object.keys(layer));
    }

    console.log('🎨 Layer renderer:', layer.renderer);
    console.log('🎨 Layer renderer type:', layer.renderer?.type);
    console.log('🎨 Layer renderer symbol:', layer.renderer?.symbol);
    
    console.log('🗂️ Complete Layer Info:', layerInfo);
    console.log('🔍 ==========================================');
    return layerInfo;
  }, []);

  // ✅ NEW: Enhanced dynamic attribute extraction function with detailed logging
  const extractAttributesFromGraphic = useCallback((graphic, layerFields) => {
    console.log('📊 ============ EXTRACTING ATTRIBUTES ============');
    console.log('📊 Input graphic object:', graphic);
    console.log('📊 Input layer fields:', layerFields);
    
    const rawAttributes = graphic.attributes;
    const geometry = graphic.geometry;
    
    console.log('📍 Raw graphic attributes object:', rawAttributes);
    console.log('📍 Raw attributes type:', typeof rawAttributes);
    console.log('📍 Raw attributes keys:', Object.keys(rawAttributes || {}));
    console.log('📍 Raw attributes values:', Object.values(rawAttributes || {}));
    
    console.log('🗺️ Graphic geometry object:', geometry);
    console.log('🗺️ Geometry type:', geometry?.type);
    console.log('🗺️ Geometry properties:', Object.keys(geometry || {}));
    
    // Extract all available attributes dynamically
    const extractedData = {};
    
    if (layerFields && layerFields.length > 0) {
      console.log('🔍 Using layer field definitions for extraction...');
      layerFields.forEach((field, index) => {
        const fieldName = field.name;
        const value = rawAttributes[fieldName];
        extractedData[fieldName] = value;
        
        console.log(`📌 Field ${index + 1}/${layerFields.length}: ${fieldName} (${field.type}) = ${value}`);
        console.log(`   📋 Field details:`, {
          name: field.name,
          alias: field.alias,
          type: field.type,
          length: field.length,
          nullable: field.nullable,
          editable: field.editable,
          value: value,
          valueType: typeof value
        });
      });
    } else {
      // Fallback: extract all attributes as-is
      console.log('⚠️ No field definitions available, extracting all attributes as-is');
      Object.keys(rawAttributes || {}).forEach((key, index) => {
        extractedData[key] = rawAttributes[key];
        console.log(`📌 Attribute ${index + 1}: ${key} = ${rawAttributes[key]} (${typeof rawAttributes[key]})`);
      });
    }
    
    // Add geometry coordinates
    if (geometry) {
      console.log('📐 Processing geometry coordinates...');
      if (geometry.longitude !== undefined && geometry.latitude !== undefined) {
        extractedData.x = geometry.longitude;
        extractedData.y = geometry.latitude;
        console.log(`📐 Coordinates from geometry.longitude/latitude: ${geometry.longitude}, ${geometry.latitude}`);
      } else if (geometry.x !== undefined && geometry.y !== undefined) {
        extractedData.x = geometry.x;
        extractedData.y = geometry.y;
        console.log(`📐 Coordinates from geometry.x/y: ${geometry.x}, ${geometry.y}`);
      } else {
        console.log('⚠️ No recognizable coordinates found in geometry');
      }
      
      // Log all geometry properties
      console.log('🗺️ All geometry properties:');
      Object.keys(geometry).forEach(key => {
        console.log(`   📐 geometry.${key} = ${geometry[key]} (${typeof geometry[key]})`);
      });
    } else {
      console.log('⚠️ No geometry found on graphic');
    }
    
    console.log('✅ ============ FINAL EXTRACTED DATA ============');
    console.log('✅ Extracted data object:', extractedData);
    console.log('✅ Extracted data keys:', Object.keys(extractedData));
    console.log('✅ Extracted data summary:');
    Object.keys(extractedData).forEach(key => {
      console.log(`   ✅ ${key}: ${extractedData[key]} (${typeof extractedData[key]})`);
    });
    console.log('✅ ================================================');
    
    return extractedData;
  }, []);

  // ✅ SIMPLIFIED: Helper function to show immediate point data
  const showImmediatePointData = useCallback((pointAttributes, layerFields) => {
    console.log('📍 Showing immediate point data:', pointAttributes);
    
    // Store basic point data globally
    window.basicPointData = pointAttributes;
    
    // Update Point Information immediately
    const pointDetailsEl = document.getElementById('point-details');
    if (pointDetailsEl && pointAttributes) {
      const address = CadastreService.formatAddress(pointAttributes);
      
      pointDetailsEl.innerHTML = `
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; align-items: center;">
          <strong>📍 Address:</strong><span style="color: #003F2D; font-weight: 500;">${address}</span>
          <strong>🆔 ID:</strong><span>${pointAttributes.id || 'N/A'}</span>
          <strong>🔑 GUID:</strong><span style="font-family: monospace; font-size: 10px;">${pointAttributes.guid || 'N/A'}</span>
          <strong>🌍 Country:</strong><span>${pointAttributes.country || 'N/A'}</span>
          <strong>📮 Postcode:</strong><span>${pointAttributes.postcode || 'N/A'}</span>
          <strong>📐 Coordinates:</strong><span>${pointAttributes.x && pointAttributes.y ? `${pointAttributes.x.toFixed(6)}, ${pointAttributes.y.toFixed(6)}` : 'N/A'}</span>
        </div>
      `;
      
      console.log('✅ Immediate point data displayed');
    }
  }, []);

  // ✅ SIMPLIFIED: Helper function to update cadastre popup with clean data display
  const updateCadastrePopupContent = useCallback((cadastreData) => {
    console.log('📋 Updating popup with data:', cadastreData);
    
    // Hide the loading message
    const additionalLoadingEl = document.getElementById('additional-loading');
    if (additionalLoadingEl) additionalLoadingEl.style.display = 'none';
    
    // Store data globally for the create function
    window.cadastreData = cadastreData;
    
    // Update Point Information - always show
    const pointDetailsEl = document.getElementById('point-details');
    if (pointDetailsEl && cadastreData.point) {
      const point = cadastreData.point;
      const address = CadastreService.formatAddress(point);
      
      pointDetailsEl.innerHTML = `
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; align-items: center;">
          <strong>📍 Address:</strong><span style="color: #003F2D; font-weight: 500;">${address}</span>
          <strong>🆔 ID:</strong><span>${point.id || 'N/A'}</span>
          <strong>🔑 GUID:</strong><span style="font-family: monospace; font-size: 10px;">${point.guid || 'N/A'}</span>
          <strong>🌍 Country:</strong><span>${point.country || 'N/A'}</span>
          <strong>📮 Postcode:</strong><span>${point.postcode || 'N/A'}</span>
          <strong>📐 Coordinates:</strong><span>${point.x && point.y ? `${point.x.toFixed(6)}, ${point.y.toFixed(6)}` : 'N/A'}</span>
        </div>
      `;
    }
    
    // Update Building Information - show if available
    const buildingInfoEl = document.getElementById('building-info');
    const buildingDetailsEl = document.getElementById('building-details');
    if (cadastreData.buildings && cadastreData.buildings.length > 0 && buildingDetailsEl && buildingInfoEl) {
      buildingInfoEl.style.display = 'block';
      
      const building = cadastreData.buildings[0]; // Show first building
      buildingDetailsEl.innerHTML = `
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; align-items: center;">
          <strong>🆔 ID:</strong><span>${building.id || 'N/A'}</span>
          <strong>🔑 GUID:</strong><span style="font-family: monospace; font-size: 10px;">${building.guid || 'N/A'}</span>
          <strong>📐 Building Area:</strong><span style="color: #003F2D; font-weight: 500;">${CadastreService.formatArea(building.area_m2)}</span>
          <strong>🏠 Parcel Link:</strong><span style="font-family: monospace; font-size: 10px;">${building.parcel_guid || 'N/A'}</span>
        </div>
      `;
    } else {
      // Hide building section if no data
      if (buildingInfoEl) buildingInfoEl.style.display = 'none';
    }
    
    // Update Parcel Information - show if available
    const parcelInfoEl = document.getElementById('parcel-info');
    const parcelDetailsEl = document.getElementById('parcel-details');
    if (cadastreData.parcel && parcelDetailsEl && parcelInfoEl) {
      parcelInfoEl.style.display = 'block';
      const parcel = cadastreData.parcel;
      
      parcelDetailsEl.innerHTML = `
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; align-items: center;">
          <strong>📋 Parcel Key:</strong><span style="color: #003F2D; font-weight: 500;">${parcel.parcelkey || 'N/A'}</span>
          <strong>🆔 ID:</strong><span>${parcel.seq || 'N/A'}</span>
          <strong>🔑 GUID:</strong><span style="font-family: monospace; font-size: 10px;">${parcel.guid || 'N/A'}</span>
          <strong>📐 Parcel Area:</strong><span style="color: #003F2D; font-weight: 500;">${CadastreService.formatArea(parcel.area_m2)}</span>
        </div>
      `;
    } else {
      // Hide parcel section if no data
      if (parcelInfoEl) parcelInfoEl.style.display = 'none';
    }
    
    // Show any errors
    if (cadastreData.errors && cadastreData.errors.length > 0) {
      const errorInfoEl = document.getElementById('error-info');
      const errorDetailsEl = document.getElementById('error-details');
      if (errorInfoEl && errorDetailsEl) {
        errorInfoEl.style.display = 'block';
        errorDetailsEl.innerHTML = cadastreData.errors.join('<br>');
      }
    }
    
    console.log('✅ Popup updated with clean data display');
  }, []);

  // ✅ V2 UPDATE: Helper function to show error in cadastre popup
  const showCadastrePopupError = useCallback((errorMessage) => {
    console.error('❌ Showing cadastre popup error:', errorMessage);
    
    const additionalLoadingEl = document.getElementById('additional-loading');
    const errorInfoEl = document.getElementById('error-info');
    const errorDetailsEl = document.getElementById('error-details');
    
    if (additionalLoadingEl) additionalLoadingEl.style.display = 'none';
    if (errorInfoEl) errorInfoEl.style.display = 'block';
    if (errorDetailsEl) errorDetailsEl.innerHTML = errorMessage;
  }, []);

  // ✅ MODAL APPROACH: Set up click handling to open modal for cadastre points
  const setupCadastreClickHandling = useCallback((view, cadastreLayer) => {
    console.log('🎯 Setting up cadastre click handling for modal');
    
    view.on('click', async (event) => {
      try {
        // Perform hit test to see what was clicked
        const response = await view.hitTest(event);
        
        // Check if any results are from our cadastre layer
        const cadastreResults = response.results.filter(result => 
          result.graphic && result.graphic.layer === cadastreLayer
        );
        
        if (cadastreResults.length > 0) {
          const clickedGraphic = cadastreResults[0].graphic;
          
          console.log('🎯 ✅ CADASTRE DOT CLICKED! Opening modal...');
          
          // Extract point data from the clicked graphic
          const pointData = extractAttributesFromGraphic(clickedGraphic, cadastreLayer.fields);
          
          console.log('📍 Extracted point data for modal:', pointData);
          
          // Trigger modal opening with point data
          if (window.openCadastreModal) {
            window.openCadastreModal(pointData);
          } else {
            console.warn('⚠️ Modal handler not available yet');
          }
          
        } else {
          console.log('ℹ️ No cadastre features clicked');
        }
      } catch (error) {
        console.error('❌ Error in cadastre click handling:', error);
      }
    });
    
    console.log('✅ Cadastre click handling set up for modal approach');
  }, [inspectLayerFields, extractAttributesFromGraphic]);

  // ✅ FIXED: Use FeatureLayer instead of MapImageLayer for proper data access
  const createCadastreLayer = useCallback(async () => {
    // Ensure ArcGIS API is loaded
    if (!window.require) {
      throw new Error('ArcGIS API not loaded yet');
    }

    // ✅ FIXED: Use FeatureLayer instead of MapImageLayer
    const { FeatureLayer } = await new Promise((resolve, reject) => {
      window.require([
        'esri/layers/FeatureLayer'
      ], (FeatureLayer) => {
        resolve({ FeatureLayer });
      }, reject);
    });

    // ✅ FIXED: Create the CBRE Belgium Cadastre layer as FeatureLayer using the full URL with layer ID
    const layer = new FeatureLayer({
      url: CONFIG.ARCGIS.CADASTRE_LAYER_URL, // Keep the /2 for the specific layer
      title: 'Belgium Cadastre',
      opacity: 1,
      visible: false, // Start hidden for performance
      // ✅ FIXED: Direct renderer for FeatureLayer
      renderer: {
        type: "simple",
        symbol: {
          type: "simple-marker",
          size: 7, // 7px white dots as requested
          color: [255, 255, 255], // White fill
          outline: {
            width: 1,
            color: [0, 0, 0] // Black outline
          }
        }
      },
      popupTemplate: {
        title: "📍 Cadastre Property",
        content: createCadastrePopupContent()
      },
      // ✅ FIXED: Set outFields to get all fields
      outFields: ["*"],
      // ✅ FIXED: Enable feature querying
      definitionExpression: "1=1" // Show all features
    });

    console.log('🏛️ Cadastre FeatureLayer created with white dots and full data access:', {
      url: layer.url,
      title: layer.title,
      visible: layer.visible,
      type: layer.type,
      symbolColor: 'white with black outline',
      symbolSize: '7px',
      outFields: layer.outFields,
      canQuery: true
    });

    // ✅ FIXED: Wait for layer to load and log field information
    layer.when(() => {
      console.log('✅ Cadastre layer loaded successfully');
      console.log('📋 Available fields:', layer.fields.map(f => f.name));
      console.log('🔗 Layer capabilities:', layer.capabilities);
      console.log('🎯 Layer ready for click handling');
    }).catch(error => {
      console.error('❌ Failed to load cadastre layer:', error);
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

          // ✅ V2 UPDATE: Simplified popup template
          const popupTemplate = new PopupTemplate({
            title: `${building.name}`,
            content: createPopupContent(building, qualityInfo),
            // Remove all actions except close for simplicity
            actions: []
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
        console.log('📊 Loading cadastre FeatureLayer with white dots - this may take a moment...');
        console.log('🎯 When visible, click on any white dot to see complete data!');
        
        // Add event listener to log when layer loads
        const handleLayerLoad = () => {
          setTimeout(() => {
            console.log('📍 Cadastre FeatureLayer is now visible and clickable');
            console.log('🔍 Layer details:', {
              url: cadastreLayer.url,
              title: cadastreLayer.title,
              type: cadastreLayer.type,
              visible: cadastreLayer.visible,
              opacity: cadastreLayer.opacity,
              fieldsCount: cadastreLayer.fields?.length || 0,
              symbolColor: 'white with black outline',
              symbolSize: '7px',
              canQuery: true
            });
            
            if (cadastreLayer.fields) {
              console.log('📋 Available fields for clicking:', cadastreLayer.fields.map(f => f.name));
            }
          }, 1000);
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
    updateCadastreVisibility,
    setupCadastreClickHandling
  };
};