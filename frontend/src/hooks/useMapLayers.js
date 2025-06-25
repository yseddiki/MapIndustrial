// src/hooks/useMapLayers.js - FIXED TO USE GRAPHIC GEOMETRY COORDINATES

import { useState, useCallback } from 'react';
import { CONFIG } from '../config/config';
import { getDataQualityLevel, getColorForLevel, createPopupContent } from '../utils/dataQuality';
import { CadastreService } from '../services/CadastreService';

export const useMapLayers = () => {
  const [cadastreLayer, setCadastreLayer] = useState(null);
  const [buildingsLayer, setBuildingsLayer] = useState(null);
  const [submarketLayer, setSubmarketLayer] = useState(null);

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

  // ✅ FIXED: Extract attributes and FORCE use of graphic geometry coordinates
  const extractAttributesFromGraphic = useCallback((graphic, layerFields) => {
    console.log('📊 ============ EXTRACTING ATTRIBUTES ============');
    console.log('📊 Input graphic object:', graphic);
    console.log('📊 Input layer fields:', layerFields);
    
    const rawAttributes = graphic.attributes;
    const geometry = graphic.geometry;
    
    console.log('📍 Raw graphic attributes object:', rawAttributes);
    console.log('🗺️ Graphic geometry object:', geometry);
    
    // Extract all available attributes dynamically
    const extractedData = {};
    
    if (layerFields && layerFields.length > 0) {
      console.log('🔍 Using layer field definitions for extraction...');
      layerFields.forEach((field, index) => {
        const fieldName = field.name;
        const value = rawAttributes[fieldName];
        extractedData[fieldName] = value;
        
        console.log(`📌 Field ${index + 1}/${layerFields.length}: ${fieldName} (${field.type}) = ${value}`);
      });
    } else {
      // Fallback: extract all attributes as-is
      console.log('⚠️ No field definitions available, extracting all attributes as-is');
      Object.keys(rawAttributes || {}).forEach((key, index) => {
        extractedData[key] = rawAttributes[key];
        console.log(`📌 Attribute ${index + 1}: ${key} = ${rawAttributes[key]} (${typeof rawAttributes[key]})`);
      });
    }
    
    // ✅ CRITICAL FIX: FORCE use of graphic geometry coordinates (WGS84)
    if (geometry) {
      console.log('📐 Processing geometry coordinates...');
      
      // ✅ FORCE: Use geometry.longitude and geometry.latitude (these are WGS84)
      if (geometry.longitude !== undefined && geometry.latitude !== undefined) {
        extractedData.x = geometry.longitude;  // WGS84 longitude
        extractedData.y = geometry.latitude;   // WGS84 latitude
        
        console.log(`✅ FORCED WGS84 coordinates from geometry:`, {
          longitude: geometry.longitude,
          latitude: geometry.latitude,
          x: extractedData.x,
          y: extractedData.y
        });
        
        // ✅ VALIDATION: Ensure these are Belgium WGS84 coordinates
        if (geometry.longitude >= 2.5 && geometry.longitude <= 6.4 && 
            geometry.latitude >= 49.5 && geometry.latitude <= 51.6) {
          console.log('✅ Coordinates validated as Belgium WGS84');
        } else {
          console.warn('⚠️ Coordinates outside Belgium bounds but proceeding');
        }
        
      } else {
        console.warn('⚠️ No longitude/latitude in geometry, cannot extract coordinates');
      }
    } else {
      console.log('⚠️ No geometry found on graphic');
    }
    
    console.log('✅ ============ FINAL EXTRACTED DATA ============');
    console.log('✅ Extracted data object:', extractedData);
    console.log('✅ Coordinates that will be used:', {
      x: extractedData.x,
      y: extractedData.y,
      source: 'graphic.geometry.longitude/latitude'
    });
    console.log('✅ ================================================');
    
    return extractedData;
  }, []);

  // ✅ FIXED: Set up click handling for cadastre points with graphic geometry coordinates
  const setupCadastreClickHandling = useCallback((view, cadastreLayer, submarketLayerRef = null) => {
    console.log('🎯 Setting up enhanced cadastre click handling with graphic geometry coordinates');
    
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
          
          console.log('🎯 ✅ CADASTRE DOT CLICKED! Using graphic geometry coordinates...');
          
          // ✅ CRITICAL: Extract point data using graphic geometry coordinates
          const pointData = extractAttributesFromGraphic(clickedGraphic, cadastreLayer.fields);
          
          console.log('📍 Point data with WGS84 coordinates:', pointData);
          
          // ✅ VALIDATION: Ensure we have WGS84 coordinates
          if (pointData.x && pointData.y) {
            console.log('✅ WGS84 coordinates extracted successfully:', {
              longitude: pointData.x,
              latitude: pointData.y
            });
          } else {
            console.error('❌ Failed to extract coordinates from graphic geometry');
            return;
          }
          
          // ✅ FIXED: Perform submarket intersection using the click coordinates directly
          let submarketData = null;
          if (submarketLayerRef) {
            try {
              console.log('🗺️ Performing submarket intersection for click coordinates:', event.mapPoint);
              
              // ✅ FIXED: Use the actual click coordinates from the event
              const clickPoint = event.mapPoint;
              
              // Create query for submarket layer using the click point
              const submarketQuery = submarketLayerRef.createQuery();
              submarketQuery.geometry = clickPoint; // Use the click point directly
              submarketQuery.spatialRelationship = 'intersects';
              submarketQuery.returnGeometry = false;
              submarketQuery.outFields = ['*'];
              submarketQuery.maxRecordCount = 1; // We only need one result
              
              console.log('🗺️ Submarket query details:', {
                geometry: clickPoint,
                spatialRelationship: submarketQuery.spatialRelationship,
                outFields: submarketQuery.outFields
              });
              
              const submarketQueryResult = await submarketLayerRef.queryFeatures(submarketQuery);
              
              console.log('🗺️ Submarket query result:', submarketQueryResult);
              
              if (submarketQueryResult.features && submarketQueryResult.features.length > 0) {
                submarketData = submarketQueryResult.features[0].attributes;
                console.log('✅ Submarket intersection successful:', submarketData);
              } else {
                console.log('⚠️ No submarket found at click location');
              }
              
            } catch (submarketError) {
              console.error('❌ Error performing submarket intersection:', submarketError);
            }
          } else {
            console.log('⚠️ Submarket layer not available for intersection');
          }
          
          // ✅ ENHANCED: Include submarket data in the point data
          const enhancedPointData = {
            ...pointData,
            submarketData: submarketData
          };
          
          // ✅ CRITICAL: Override any Lambert 72 coordinates with our WGS84 coordinates
          console.log('🔧 ========== FORCING WGS84 COORDINATES ==========');
          console.log('🔧 Before override:', enhancedPointData);
          
          // Force the coordinates to be WGS84 from graphic geometry
          enhancedPointData.x = pointData.x; // WGS84 longitude
          enhancedPointData.y = pointData.y; // WGS84 latitude
          
          console.log('🔧 After WGS84 override:', {
            x: enhancedPointData.x,
            y: enhancedPointData.y,
            source: 'graphic.geometry WGS84'
          });
          console.log('🔧 ===============================================');
          
          // Trigger modal opening with enhanced point data including submarket
          if (window.openCadastreModal) {
            window.openCadastreModal(enhancedPointData);
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
    
    console.log('✅ Enhanced cadastre click handling set up with WGS84 coordinates');
  }, [extractAttributesFromGraphic]);

  // ✅ FIXED: Set up click handling for submarket layer (modal only, no popup)
  const setupSubmarketClickHandling = useCallback((view, submarketLayerRef) => {
    console.log('🗺️ Setting up submarket click handling for modal');
    
    view.on('click', async (event) => {
      try {
        // Perform hit test to see what was clicked
        const response = await view.hitTest(event);
        
        // Check if any results are from our submarket layer
        const submarketResults = response.results.filter(result => 
          result.graphic && result.graphic.layer === submarketLayerRef
        );
        
        if (submarketResults.length > 0) {
          const clickedGraphic = submarketResults[0].graphic;
          
          console.log('🗺️ ✅ SUBMARKET CLICKED! Opening modal...');
          
          // Extract submarket data from the clicked graphic
          const submarketData = extractAttributesFromGraphic(clickedGraphic, submarketLayerRef.fields);
          
          console.log('🗺️ Extracted submarket data:', submarketData);
          
          // Trigger submarket modal opening
          if (window.openSubmarketModal) {
            window.openSubmarketModal(submarketData);
          } else {
            console.warn('⚠️ Submarket modal handler not available yet');
          }
          
        } else {
          console.log('ℹ️ No submarket features clicked');
        }
      } catch (error) {
        console.error('❌ Error in submarket click handling:', error);
      }
    });
    
    console.log('✅ Submarket click handling set up for modal only');
  }, [extractAttributesFromGraphic]);

  // ✅ FIXED: Use FeatureLayer without popup (modal only)
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
      // ✅ REMOVED: No popup template - modal only
      popupTemplate: null,
      // ✅ FIXED: Set outFields to get all fields
      outFields: ["*"],
      // ✅ FIXED: Enable feature querying
      definitionExpression: "1=1" // Show all features
    });

    console.log('🏛️ Cadastre FeatureLayer created (modal only, no popup):', {
      url: layer.url,
      title: layer.title,
      visible: layer.visible,
      type: layer.type,
      symbolColor: 'white with black outline',
      symbolSize: '7px',
      outFields: layer.outFields,
      canQuery: true,
      popupEnabled: false
    });

    // ✅ FIXED: Wait for layer to load and log field information
    layer.when(() => {
      console.log('✅ Cadastre layer loaded successfully (modal only)');
      console.log('📋 Available fields:', layer.fields.map(f => f.name));
      console.log('🔗 Layer capabilities:', layer.capabilities);
      console.log('🎯 Layer ready for click handling (modal only)');
    }).catch(error => {
      console.error('❌ Failed to load cadastre layer:', error);
    });

    setCadastreLayer(layer);
    return layer;
  }, []);

  // ✅ FIXED: Create submarket layer without popup (modal only)
  const createSubmarketLayer = useCallback(async () => {
    // Ensure ArcGIS API is loaded
    if (!window.require) {
      throw new Error('ArcGIS API not loaded yet');
    }

    const { FeatureLayer } = await new Promise((resolve, reject) => {
      window.require([
        'esri/layers/FeatureLayer'
      ], (FeatureLayer) => {
        resolve({ FeatureLayer });
      }, reject);
    });

    // Create the submarket layer
    const layer = new FeatureLayer({
      url: CadastreService.LAYERS.SUBMARKETS,
      title: 'Submarkets',
      opacity: 0.3, // Semi-transparent so buildings show through
      visible: false, // Start hidden
      renderer: {
        type: "simple",
        symbol: {
          type: "simple-fill",
          color: [0, 122, 194, 0.2], // Light blue with transparency
          outline: {
            color: [0, 122, 194, 0.8], // Darker blue outline
            width: 2
          }
        }
      },
      // ✅ REMOVED: No popup template - modal only
      popupTemplate: null,
      outFields: ["*"],
      definitionExpression: "1=1"
    });

    console.log('🗺️ Submarket FeatureLayer created (modal only, no popup):', {
      url: layer.url,
      title: layer.title,
      visible: layer.visible,
      type: layer.type,
      opacity: layer.opacity,
      popupEnabled: false
    });

    // Wait for layer to load and log field information
    layer.when(() => {
      console.log('✅ Submarket layer loaded successfully (modal only)');
      console.log('📋 Available submarket fields:', layer.fields.map(f => f.name));
      console.log('🎯 Submarket layer ready for click handling (modal only)');
    }).catch(error => {
      console.error('❌ Failed to load submarket layer:', error);
    });

    setSubmarketLayer(layer);
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

      // ✅ FIXED: Don't call refresh on GraphicsLayer (it doesn't have this method)
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

  // ✅ NEW: Update submarket layer visibility
  const updateSubmarketVisibility = useCallback((visible) => {
    if (submarketLayer) {
      console.log(`🗺️ Submarket layer visibility changing to: ${visible}`);
      
      if (visible) {
        console.log('📊 Loading submarket layer - this may take a moment...');
        console.log('🎯 When visible, click on any submarket area to see data!');
        
        const handleLayerLoad = () => {
          setTimeout(() => {
            console.log('🗺️ Submarket layer is now visible and clickable');
            console.log('🔍 Submarket layer details:', {
              url: submarketLayer.url,
              title: submarketLayer.title,
              type: submarketLayer.type,
              visible: submarketLayer.visible,
              opacity: submarketLayer.opacity,
              fieldsCount: submarketLayer.fields?.length || 0
            });
            
            if (submarketLayer.fields) {
              console.log('📋 Available submarket fields:', submarketLayer.fields.map(f => f.name));
            }
          }, 1000);
        };

        if (!submarketLayer.visible) {
          submarketLayer.watch('visible', (newVisible) => {
            if (newVisible) {
              handleLayerLoad();
            }
          });
        } else {
          handleLayerLoad();
        }
      } else {
        console.log('🙈 Hiding submarket layer');
      }
      
      submarketLayer.visible = visible;
    } else {
      console.log('❌ Submarket layer not available yet');
    }
  }, [submarketLayer]);

  return {
    cadastreLayer,
    buildingsLayer,
    submarketLayer,
    createCadastreLayer,
    createBuildingsLayer,
    createSubmarketLayer,
    addBuildingsToMap,
    updateCadastreVisibility,
    updateSubmarketVisibility,
    setupCadastreClickHandling,
    setupSubmarketClickHandling
  };
};