// src/hooks/useMapLayers.js

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

  // ✅ UPDATED: Enhanced helper function to show immediate point data
  const showImmediatePointData = useCallback((pointAttributes, layerFields) => {
    console.log('📍 Showing immediate point data:', pointAttributes);
    
    // Store basic point data globally
    window.basicPointData = pointAttributes;
    
    // Update Point Information immediately
    const pointDetailsEl = document.getElementById('point-details');
    if (pointDetailsEl && pointAttributes) {
      const address = CadastreService.formatAddress(pointAttributes);
      
      // Build dynamic HTML based on available fields
      let fieldsHtml = '';
      
      // Define display order and labels for known fields
      const fieldDisplay = [
        { name: 'seq', label: '🔢 SEQ', priority: 1 },
        { name: 'id', label: '🆔 ID', priority: 2 },
        { name: 'guid', label: '🔑 GUID', priority: 3 },
        { name: 'country', label: '🌍 Country', priority: 4 },
        { name: 'town_nl', label: '🏘️ City (NL)', priority: 5 },
        { name: 'town_fr', label: '🏘️ City (FR)', priority: 6 },
        { name: 'town_de', label: '🏘️ City (DE)', priority: 7 },
        { name: 'postcode', label: '📮 Postcode', priority: 8 },
        { name: 'street_nl', label: '🛣️ Street (NL)', priority: 9 },
        { name: 'street_fr', label: '🛣️ Street (FR)', priority: 10 },
        { name: 'street_de', label: '🛣️ Street (DE)', priority: 11 },
        { name: 'number', label: '🔢 Number', priority: 12 },
        { name: 'building_guid', label: '🏗️ Building GUID', priority: 13 },
        { name: 'x', label: '📐 Longitude', priority: 14 },
        { name: 'y', label: '📐 Latitude', priority: 15 }
      ];
      
      // Add formatted address first
      fieldsHtml += `<strong>📍 Address:</strong><span>${address}</span>`;
      
      // Add all fields in display order
      fieldDisplay.forEach(fieldDef => {
        const value = pointAttributes[fieldDef.name];
        if (value !== undefined && value !== null && value !== '') {
          fieldsHtml += `<strong>${fieldDef.label}:</strong><span>${value}</span>`;
        } else {
          fieldsHtml += `<strong>${fieldDef.label}:</strong><span>N/A</span>`;
        }
      });
      
      // Add any additional fields not in the display list
      Object.keys(pointAttributes).forEach(key => {
        if (!fieldDisplay.find(f => f.name === key) && key !== 'x' && key !== 'y') {
          const value = pointAttributes[key];
          fieldsHtml += `<strong>📋 ${key}:</strong><span>${value || 'N/A'}</span>`;
        }
      });
      
      pointDetailsEl.innerHTML = `
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px;">
          ${fieldsHtml}
        </div>
      `;
      
      console.log('✅ Immediate point data displayed');
    }
  }, []);

  // ✅ V2 UPDATE: Helper function to update cadastre popup with comprehensive data
  const updateCadastrePopupContent = useCallback((cadastreData) => {
    console.log('📋 Updating popup with comprehensive data:', cadastreData);
    
    // Hide the additional loading message
    const additionalLoadingEl = document.getElementById('additional-loading');
    if (additionalLoadingEl) additionalLoadingEl.style.display = 'none';
    
    // Store data globally for the create function
    window.cadastreData = cadastreData;
    
    // Update Parcel Information
    const parcelInfoEl = document.getElementById('parcel-info');
    const parcelDetailsEl = document.getElementById('parcel-details');
    if (cadastreData.parcel && parcelDetailsEl && parcelInfoEl) {
      const parcel = cadastreData.parcel;
      parcelInfoEl.style.display = 'block';
      parcelDetailsEl.innerHTML = `
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px;">
          <strong>📋 Parcel Key:</strong><span>${parcel.parcelkey || 'N/A'}</span>
          <strong>🆔 GUID:</strong><span>${parcel.guid || 'N/A'}</span>
          <strong>📐 Area:</strong><span>${CadastreService.formatArea(parcel.area_m2)}</span>
        </div>
      `;
    }
    
    // Update Building Information
    const buildingInfoEl = document.getElementById('building-info');
    const buildingDetailsEl = document.getElementById('building-details');
    if (cadastreData.buildings && cadastreData.buildings.length > 0 && buildingDetailsEl && buildingInfoEl) {
      buildingInfoEl.style.display = 'block';
      
      let buildingHtml = '';
      cadastreData.buildings.forEach((building, index) => {
        buildingHtml += `
          <div style="margin-bottom: 8px; padding: 6px; background: #fff; border-radius: 3px; border-left: 3px solid #17E88F;">
            <div style="font-weight: bold; margin-bottom: 4px;">Building ${index + 1}</div>
            <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px; font-size: 10px;">
              <strong>🆔 GUID:</strong><span>${building.guid || 'N/A'}</span>
              <strong>🏠 Parcel GUID:</strong><span>${building.parcel_guid || 'N/A'}</span>
              <strong>📐 Area:</strong><span>${CadastreService.formatArea(building.area_m2)}</span>
            </div>
          </div>
        `;
      });
      
      buildingDetailsEl.innerHTML = buildingHtml;
    }
    
    // Update Submarket Information (matches your Efficy backend data)
    const submarketInfoEl = document.getElementById('submarket-info');
    const submarketDetailsEl = document.getElementById('submarket-details');
    if (cadastreData.submarket && submarketDetailsEl && submarketInfoEl) {
      submarketInfoEl.style.display = 'block';
      const submarket = cadastreData.submarket;
      
      submarketDetailsEl.innerHTML = `
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px;">
          <strong>🏢 Office Submarket:</strong><span>${submarket.officesubmarket || 'N/A'}</span>
          <strong>🏭 Logistics Submarket:</strong><span>${submarket.logisticsubmarket || 'N/A'}</span>
          <strong>🛍️ Retail Submarket:</strong><span>${submarket.retailsubmarket || 'N/A'}</span>
          <strong>🏘️ Municipality (NL):</strong><span>${submarket.t_mun_nl || 'N/A'}</span>
          <strong>🏘️ Municipality (FR):</strong><span>${submarket.t_mun_fr || 'N/A'}</span>
          <strong>🗺️ Arrondissement (NL):</strong><span>${submarket.t_arrd_nl || 'N/A'}</span>
          <strong>🗺️ Arrondissement (FR):</strong><span>${submarket.t_arrd_fr || 'N/A'}</span>
          <strong>🌍 Province (NL):</strong><span>${submarket.t_provi_nl || 'N/A'}</span>
          <strong>🌍 Province (FR):</strong><span>${submarket.t_provi_fr || 'N/A'}</span>
        </div>
      `;
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

  // ✅ UPDATED: Set up click handling with comprehensive graphic and layer logging
  const setupCadastreClickHandling = useCallback((view, cadastreLayer) => {
    console.log('🎯 Setting up cadastre click handling on map view');
    
    // First, inspect the layer fields when setting up
    const layerInfo = inspectLayerFields(cadastreLayer);
    
    view.on('click', async (event) => {
      console.log('🖱️ Map clicked, checking for cadastre features...');
      console.log('📍 Click event details:', {
        x: event.x,
        y: event.y,
        button: event.button,
        mapPoint: event.mapPoint
      });
      
      try {
        // Perform hit test to see what was clicked
        const response = await view.hitTest(event);
        
        console.log('🎯 Hit test results:', response);
        console.log('📊 Hit test summary:', {
          totalResults: response.results.length,
          resultsTypes: response.results.map(r => r.type),
          hasGraphics: response.results.filter(r => r.graphic).length
        });
        
        // ✅ LOG ALL CLICKED GRAPHICS (not just cadastre)
        response.results.forEach((result, index) => {
          console.log(`🔍 Result ${index + 1}:`, {
            type: result.type,
            hasGraphic: !!result.graphic,
            hasLayer: !!result.graphic?.layer
          });
          
          if (result.graphic) {
            const graphic = result.graphic;
            const layer = graphic.layer;
            
            console.log(`📍 GRAPHIC ${index + 1} DETAILS:`, {
              graphic: graphic,
              graphicType: typeof graphic,
              graphicConstructor: graphic.constructor.name,
              hasAttributes: !!graphic.attributes,
              hasGeometry: !!graphic.geometry,
              hasSymbol: !!graphic.symbol,
              hasPopupTemplate: !!graphic.popupTemplate
            });
            
            console.log(`🗂️ LAYER ${index + 1} DETAILS:`, {
              layer: layer,
              layerTitle: layer?.title,
              layerId: layer?.id,
              layerUrl: layer?.url,
              layerType: layer?.type,
              layerConstructor: layer?.constructor?.name,
              hasFields: !!(layer?.fields && layer.fields.length > 0),
              fieldsCount: layer?.fields?.length || 0,
              isOurCadastreLayer: layer === cadastreLayer
            });
            
            console.log(`📋 ATTRIBUTES ${index + 1}:`, graphic.attributes);
            console.log(`🗺️ GEOMETRY ${index + 1}:`, {
              geometry: graphic.geometry,
              geometryType: graphic.geometry?.type,
              hasCoordinates: !!(graphic.geometry?.x !== undefined || graphic.geometry?.longitude !== undefined),
              x: graphic.geometry?.x || graphic.geometry?.longitude,
              y: graphic.geometry?.y || graphic.geometry?.latitude,
              spatialReference: graphic.geometry?.spatialReference
            });
            
            console.log(`🎨 SYMBOL ${index + 1}:`, {
              symbol: graphic.symbol,
              symbolType: graphic.symbol?.type,
              symbolColor: graphic.symbol?.color,
              symbolSize: graphic.symbol?.size
            });
          }
        });
        
        // Check if any results are from our cadastre layer
        const cadastreResults = response.results.filter(result => 
          result.graphic && result.graphic.layer === cadastreLayer
        );
        
        console.log('🔍 CADASTRE LAYER FILTER RESULTS:', {
          totalResults: response.results.length,
          cadastreResults: cadastreResults.length,
          cadastreLayer: cadastreLayer,
          cadastreLayerTitle: cadastreLayer?.title,
          cadastreLayerId: cadastreLayer?.id
        });
        
        if (cadastreResults.length > 0) {
          const clickedGraphic = cadastreResults[0].graphic;
          const layer = clickedGraphic.layer;
          
          console.log('🎯 ✅ CADASTRE DOT CLICKED!');
          console.log('📍 CLICKED CADASTRE GRAPHIC:', clickedGraphic);
          console.log('🏷️ CADASTRE GRAPHIC PROPERTIES:', {
            attributes: clickedGraphic.attributes,
            geometry: clickedGraphic.geometry,
            symbol: clickedGraphic.symbol,
            popupTemplate: clickedGraphic.popupTemplate,
            layer: clickedGraphic.layer,
            visible: clickedGraphic.visible
          });
          
          console.log('🗂️ CADASTRE LAYER PROPERTIES:', {
            title: layer.title,
            id: layer.id,
            url: layer.url,
            type: layer.type,
            visible: layer.visible,
            opacity: layer.opacity,
            fieldsCount: layer.fields?.length || 0,
            capabilities: layer.capabilities,
            renderer: layer.renderer,
            popupTemplate: layer.popupTemplate
          });
          
          // ✅ Dynamic attribute extraction using layer field definitions
          const extractedData = extractAttributesFromGraphic(clickedGraphic, layer.fields);
          
          console.log('✅ Successfully extracted cadastre data:', extractedData);

          // ✅ SHOW IMMEDIATE POINT DATA using extracted data
          showImmediatePointData(extractedData, layer.fields);

          // ✅ Try to fetch additional data if GUID is available
          const guid = extractedData.guid;
          if (guid) {
            console.log('🔍 Fetching additional cadastre data for GUID:', guid);
            
            try {
              // Fetch additional comprehensive data using the GUID (in background)
              const additionalData = await CadastreService.fetchCadastreDataByGuid(guid);
              
              // Update the popup content with additional fetched data
              updateCadastrePopupContent(additionalData);
              
            } catch (error) {
              console.error('❌ Error fetching additional cadastre data:', error);
              showCadastrePopupError(error.message);
            }
          } else {
            console.warn('⚠️ No GUID found for clicked cadastre point - only showing basic data');
            console.warn('⚠️ Available fields:', Object.keys(extractedData));
            // Hide the loading message since we won't fetch additional data
            setTimeout(() => {
              const additionalLoadingEl = document.getElementById('additional-loading');
              if (additionalLoadingEl) additionalLoadingEl.style.display = 'none';
            }, 100);
          }
        } else {
          console.log('ℹ️ No cadastre features clicked');
          
          // ✅ LOG OTHER CLICKED FEATURES (building points, etc.)
          if (response.results.length > 0) {
            console.log('🔍 OTHER FEATURES CLICKED (not cadastre):');
            response.results.forEach((result, index) => {
              if (result.graphic && result.graphic.layer !== cadastreLayer) {
                console.log(`🏢 NON-CADASTRE GRAPHIC ${index + 1}:`, {
                  layer: result.graphic.layer,
                  layerTitle: result.graphic.layer?.title,
                  layerType: result.graphic.layer?.type,
                  attributes: result.graphic.attributes,
                  geometry: result.graphic.geometry
                });
              }
            });
          } else {
            console.log('ℹ️ No features clicked at all');
          }
        }
      } catch (error) {
        console.error('❌ Error in hit test:', error);
      }
    });
    
    console.log('✅ Cadastre click handling set up successfully with comprehensive graphic logging');
  }, [inspectLayerFields, extractAttributesFromGraphic, showImmediatePointData, updateCadastrePopupContent, showCadastrePopupError]);

  const createCadastreLayer = useCallback(async () => {
    // Ensure ArcGIS API is loaded
    if (!window.require) {
      throw new Error('ArcGIS API not loaded yet');
    }

    // ✅ UPDATED: Use MapImageLayer for MapServer instead of FeatureLayer
    const { MapImageLayer } = await new Promise((resolve, reject) => {
      window.require([
        'esri/layers/MapImageLayer'
      ], (MapImageLayer) => {
        resolve({ MapImageLayer });
      }, reject);
    });

    // Create the CBRE Belgium Cadastre layer as MapImageLayer
    const layer = new MapImageLayer({
      url: CONFIG.ARCGIS.CADASTRE_LAYER_URL.replace('/2', ''), // Remove layer ID from URL for MapImageLayer
      title: 'Belgium Cadastre',
      opacity: 1,
      visible: false, // Start hidden for performance
      sublayers: [{
        id: 2, // Specify the specific sublayer (Address layer)
        visible: true,
        // ✅ Custom renderer for white dots with black outline
        renderer: {
          type: "simple",
          symbol: {
            type: "simple-marker",
            size: 7, // ✅ 7px white dots as requested
            color: [255, 255, 255], // ✅ White fill
            outline: {
              width: 1,
              color: [0, 0, 0] // ✅ Black outline
            }
          }
        },
        popupTemplate: {
          title: "📍 Cadastre Property",
          content: createCadastrePopupContent()
        }
      }]
    });

    console.log('🏛️ Cadastre MapImageLayer created with larger white dots:', {
      url: layer.url,
      title: layer.title,
      visible: layer.visible,
      sublayers: layer.sublayers.length,
      symbolColor: 'white with black outline',
      symbolSize: '7px'
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
        console.log('📊 Loading cadastre layer with larger white dots - this may take a moment due to many points...');
        console.log('🎯 When visible, click on any white dot to see console.log messages!');
        
        // Add event listener to log graphics when layer loads
        const handleLayerLoad = () => {
          setTimeout(() => {
            if (cadastreLayer.source && cadastreLayer.source.length > 0) {
              console.log(`📍 Cadastre layer loaded with ${cadastreLayer.source.length} features`);
              console.log('📋 Sample cadastre feature:', cadastreLayer.source.items[0]);
            } else {
              // For feature layers, we can't easily access all graphics
              console.log('📍 Cadastre layer is visible - larger white dots will load dynamically based on map extent');
              console.log('🗺️ Cadastre layer details:', {
                url: cadastreLayer.url,
                title: cadastreLayer.title,
                type: cadastreLayer.type,
                visible: cadastreLayer.visible,
                opacity: cadastreLayer.opacity,
                symbolColor: 'white with black outline',
                symbolSize: '7px'
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
    updateCadastreVisibility,
    setupCadastreClickHandling // ✅ New function to fix click handling
  };
};