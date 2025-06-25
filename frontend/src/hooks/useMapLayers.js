// src/hooks/useMapLayers.js - ENHANCED COORDINATE EXTRACTION FROM GRAPHIC

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

  // ✅ ENHANCED: Extract attributes and coordinates from multiple sources
  const extractAttributesFromGraphic = useCallback((graphic, layerFields) => {
    console.log('📊 ============ EXTRACTING ATTRIBUTES ============');
    console.log('📊 Input graphic object:', graphic);
    console.log('📊 Input layer fields:', layerFields);
    
    const rawAttributes = graphic.attributes;
    const geometry = graphic.geometry;
    
    console.log('📍 Raw graphic attributes object:', rawAttributes);
    console.log('🗺️ Graphic geometry object:', geometry);
    console.log('🎯 Graphic direct properties check:');
    console.log('   - graphic.longitude:', graphic.longitude);
    console.log('   - graphic.latitude:', graphic.latitude);
    
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
    
    // ✅ ENHANCED: Extract coordinates from multiple sources (priority order)
    let longitude = null;
    let latitude = null;
    let coordinateSource = 'unknown';
    
    // Priority 1: Direct graphic properties (as shown in your log)
    if (graphic.longitude !== undefined && graphic.latitude !== undefined) {
      longitude = graphic.longitude;
      latitude = graphic.latitude;
      coordinateSource = 'graphic.longitude/latitude';
      console.log('✅ Found coordinates directly on graphic object');
    }
    // Priority 2: Geometry properties
    else if (geometry && geometry.longitude !== undefined && geometry.latitude !== undefined) {
      longitude = geometry.longitude;
      latitude = geometry.latitude;
      coordinateSource = 'geometry.longitude/latitude';
      console.log('✅ Found coordinates in geometry object');
    }
    // Priority 3: Geometry x/y (might be in different coordinate system)
    else if (geometry && geometry.x !== undefined && geometry.y !== undefined) {
      longitude = geometry.x;
      latitude = geometry.y;
      coordinateSource = 'geometry.x/y';
      console.log('⚠️ Using geometry.x/y as fallback coordinates');
    }
    
    if (longitude !== null && latitude !== null) {
      // ✅ FORCE: Set the coordinates in the standard format
      extractedData.x = longitude;
      extractedData.y = latitude;
      
      console.log(`✅ COORDINATES EXTRACTED:`, {
        longitude: longitude,
        latitude: latitude,
        x: extractedData.x,
        y: extractedData.y,
        source: coordinateSource
      });
      
      // ✅ VALIDATION: Check if coordinates are reasonable for Belgium
      if (longitude >= 2.5 && longitude <= 6.4 && latitude >= 49.5 && latitude <= 51.6) {
        console.log('✅ Coordinates validated as Belgium WGS84');
      } else {
        console.warn('⚠️ Coordinates outside typical Belgium bounds but proceeding:', {
          longitude,
          latitude,
          expectedLon: '2.5-6.4',
          expectedLat: '49.5-51.6'
        });
      }
    } else {
      console.error('❌ CRITICAL: No coordinates found in any source!');
      console.error('   - graphic.longitude:', graphic.longitude);
      console.error('   - graphic.latitude:', graphic.latitude);
      console.error('   - geometry?.longitude:', geometry?.longitude);
      console.error('   - geometry?.latitude:', geometry?.latitude);
      console.error('   - geometry?.x:', geometry?.x);
      console.error('   - geometry?.y:', geometry?.y);
    }
    
    console.log('✅ ============ FINAL EXTRACTED DATA ============');
    console.log('✅ Extracted data object:', extractedData);
    console.log('✅ Coordinates that will be used:', {
      x: extractedData.x,
      y: extractedData.y,
      source: coordinateSource
    });
    console.log('✅ ================================================');
    
    return extractedData;
  }, []);

  // ✅ ENHANCED: Set up click handling for cadastre points with robust coordinate extraction
  const setupCadastreClickHandling = useCallback((view, cadastreLayer, submarketLayerRef = null) => {
    console.log('🎯 Setting up enhanced cadastre click handling with robust coordinate extraction');
    
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
          
          console.log('🎯 ✅ CADASTRE DOT CLICKED! Extracting data with enhanced coordinate handling...');
          console.log('🗺️ Raw clicked graphic:', clickedGraphic);
          
          // ✅ ENHANCED: Extract point data with robust coordinate extraction
          const pointData = extractAttributesFromGraphic(clickedGraphic, cadastreLayer.fields);
          
          console.log('📍 Point data with extracted coordinates:', pointData);
          
          // ✅ VALIDATION: Ensure we have coordinates
          if (pointData.x && pointData.y) {
            console.log('✅ Coordinates extracted successfully:', {
              longitude: pointData.x,
              latitude: pointData.y
            });
          } else {
            console.error('❌ Failed to extract coordinates from graphic');
            console.error('❌ Point data received:', pointData);
            console.error('❌ Original graphic:', clickedGraphic);
            return;
          }
          
          // ✅ ENHANCED: Perform submarket intersection using the click coordinates
          let submarketData = null;
          if (submarketLayerRef) {
            try {
              console.log('🗺️ Performing submarket intersection for click coordinates:', event.mapPoint);
              
              // ✅ Use the actual click coordinates from the event
              const clickPoint = event.mapPoint;
              
              // Create query for submarket layer using the click point
              const submarketQuery = submarketLayerRef.createQuery();
              submarketQuery.geometry = clickPoint;
              submarketQuery.spatialRelationship = 'intersects';
              submarketQuery.returnGeometry = false;
              submarketQuery.outFields = ['*'];
              submarketQuery.maxRecordCount = 1;
              
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
          
          console.log('🎯 ========== FINAL ENHANCED POINT DATA ==========');
          console.log('🎯 Complete point data with coordinates and submarket:', enhancedPointData);
          console.log('📍 Final coordinates to be used:', {
            x: enhancedPointData.x,
            y: enhancedPointData.y,
            hasSubmarket: !!submarketData
          });
          console.log('🎯 ===============================================');
          
          // Trigger modal opening with enhanced point data
          if (window.openCadastreModal) {
            console.log('🚀 Opening cadastre modal with enhanced data...');
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
    
    console.log('✅ Enhanced cadastre click handling set up with robust coordinate extraction');
  }, [extractAttributesFromGraphic]);

  // ✅ ENHANCED: Set up click handling for submarket layer
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

  // ✅ Create cadastre layer with enhanced configuration
  const createCadastreLayer = useCallback(async () => {
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

    // Create the CBRE Belgium Cadastre layer as FeatureLayer
    const layer = new FeatureLayer({
      url: CONFIG.ARCGIS.CADASTRE_LAYER_URL,
      title: 'Belgium Cadastre',
      opacity: 1,
      visible: false, // Start hidden for performance
      renderer: {
        type: "simple",
        symbol: {
          type: "simple-marker",
          size: 7,
          color: [255, 255, 255], // White fill
          outline: {
            width: 1,
            color: [0, 0, 0] // Black outline
          }
        }
      },
      popupTemplate: null, // Modal only
      outFields: ["*"],
      definitionExpression: "1=1"
    });

    console.log('🏛️ Cadastre FeatureLayer created (enhanced coordinate extraction):', {
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

    // Wait for layer to load and log field information
    layer.when(() => {
      console.log('✅ Cadastre layer loaded successfully (enhanced coordinate extraction)');
      console.log('📋 Available fields:', layer.fields.map(f => f.name));
      console.log('🔗 Layer capabilities:', layer.capabilities);
      console.log('🎯 Layer ready for enhanced click handling');
    }).catch(error => {
      console.error('❌ Failed to load cadastre layer:', error);
    });

    setCadastreLayer(layer);
    return layer;
  }, []);

  // Create submarket layer
  const createSubmarketLayer = useCallback(async () => {
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

    const layer = new FeatureLayer({
      url: CadastreService.LAYERS.SUBMARKETS,
      title: 'Submarkets',
      opacity: 0.3,
      visible: false,
      renderer: {
        type: "simple",
        symbol: {
          type: "simple-fill",
          color: [0, 122, 194, 0.2],
          outline: {
            color: [0, 122, 194, 0.8],
            width: 2
          }
        }
      },
      popupTemplate: null,
      outFields: ["*"],
      definitionExpression: "1=1"
    });

    console.log('🗺️ Submarket FeatureLayer created:', {
      url: layer.url,
      title: layer.title,
      visible: layer.visible,
      type: layer.type,
      opacity: layer.opacity,
      popupEnabled: false
    });

    layer.when(() => {
      console.log('✅ Submarket layer loaded successfully');
      console.log('📋 Available submarket fields:', layer.fields.map(f => f.name));
      console.log('🎯 Submarket layer ready for click handling');
    }).catch(error => {
      console.error('❌ Failed to load submarket layer:', error);
    });

    setSubmarketLayer(layer);
    return layer;
  }, []);

  const createBuildingsLayer = useCallback(async () => {
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

          // Create color-coded symbol
          const symbol = new SimpleMarkerSymbol({
            color: markerColor,
            outline: {
              color: markerColor,
              width: 1
            },
            size: '10px'
          });

          // Create popup template
          const popupTemplate = new PopupTemplate({
            title: `${building.name}`,
            content: createPopupContent(building, qualityInfo),
            actions: []
          });

          // Create graphic
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

      console.log(`🎉 Added ${addedCount}/${buildingData.length} buildings to map`);

    } catch (error) {
      console.error('💥 CRITICAL ERROR in addBuildingsToMap:', error);
    }
  }, []);

  const updateCadastreVisibility = useCallback((visible) => {
    if (cadastreLayer) {
      console.log(`🟫 Cadastre layer visibility changing to: ${visible}`);
      
      if (visible) {
        console.log('📊 Loading cadastre FeatureLayer with enhanced coordinate extraction - this may take a moment...');
        console.log('🎯 When visible, click on any white dot to see complete data with precise coordinates!');
        
        const handleLayerLoad = () => {
          setTimeout(() => {
            console.log('📍 Cadastre FeatureLayer is now visible and clickable with enhanced coordinate extraction');
            console.log('🔍 Layer details:', {
              url: cadastreLayer.url,
              title: cadastreLayer.title,
              type: cadastreLayer.type,
              visible: cadastreLayer.visible,
              opacity: cadastreLayer.opacity,
              fieldsCount: cadastreLayer.fields?.length || 0,
              symbolColor: 'white with black outline',
              symbolSize: '7px',
              canQuery: true,
              coordinateExtraction: 'enhanced multi-source'
            });
            
            if (cadastreLayer.fields) {
              console.log('📋 Available fields for clicking:', cadastreLayer.fields.map(f => f.name));
            }
          }, 1000);
        };

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