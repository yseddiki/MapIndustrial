// src/hooks/useMapLayers.js

import { useState, useCallback } from 'react';
import { CONFIG } from '../config/config';
import { getDataQualityLevel, getColorForLevel, createPopupContent, createCadastrePopupContent } from '../utils/dataQuality';
import { CadastreService } from '../services/CadastreService';

export const useMapLayers = () => {
  const [cadastreLayer, setCadastreLayer] = useState(null);
  const [buildingsLayer, setBuildingsLayer] = useState(null);

  // ✅ V2 UPDATE: Helper function to show immediate point data
  const showImmediatePointData = useCallback((pointAttributes) => {
    console.log('📍 Showing immediate point data:', pointAttributes);
    
    // Store basic point data globally
    window.basicPointData = pointAttributes;
    
    // Update Point Information immediately
    const pointDetailsEl = document.getElementById('point-details');
    if (pointDetailsEl && pointAttributes) {
      const address = CadastreService.formatAddress(pointAttributes);
      
      pointDetailsEl.innerHTML = `
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px;">
          <strong>🔢 SEQ:</strong><span>${pointAttributes.seq || 'N/A'}</span>
          <strong>🆔 ID:</strong><span>${pointAttributes.id || 'N/A'}</span>
          <strong>🔑 GUID:</strong><span>${pointAttributes.guid || 'N/A'}</span>
          <strong>📍 Address:</strong><span>${address}</span>
          <strong>🏘️ City (NL):</strong><span>${pointAttributes.town_nl || 'N/A'}</span>
          <strong>🏘️ City (FR):</strong><span>${pointAttributes.town_fr || 'N/A'}</span>
          <strong>🏘️ City (DE):</strong><span>${pointAttributes.town_de || 'N/A'}</span>
          <strong>📮 Postcode:</strong><span>${pointAttributes.postcode || 'N/A'}</span>
          <strong>🛣️ Street (NL):</strong><span>${pointAttributes.street_nl || 'N/A'}</span>
          <strong>🛣️ Street (FR):</strong><span>${pointAttributes.street_fr || 'N/A'}</span>
          <strong>🛣️ Street (DE):</strong><span>${pointAttributes.street_de || 'N/A'}</span>
          <strong>🔢 Number:</strong><span>${pointAttributes.number || 'N/A'}</span>
          <strong>🌍 Country:</strong><span>${pointAttributes.country || 'N/A'}</span>
          <strong>🏗️ Building GUID:</strong><span>${pointAttributes.building_guid || 'N/A'}</span>
          <strong>📐 Longitude:</strong><span>${pointAttributes.x || 'N/A'}</span>
          <strong>📐 Latitude:</strong><span>${pointAttributes.y || 'N/A'}</span>
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

  // ✅ V2 UPDATE: Set up click handling on the map view (fixes missing console.log issue)
  const setupCadastreClickHandling = useCallback((view, cadastreLayer) => {
    console.log('🎯 Setting up cadastre click handling on map view');
    
    view.on('click', async (event) => {
      console.log('🖱️ Map clicked, checking for cadastre features...');
      
      try {
        // Perform hit test to see what was clicked
        const response = await view.hitTest(event);
        
        console.log('🎯 Hit test results:', response);
        
        // Check if any results are from our cadastre layer
        const cadastreResults = response.results.filter(result => 
          result.graphic && result.graphic.layer === cadastreLayer
        );
        
        if (cadastreResults.length > 0) {
          const clickedGraphic = cadastreResults[0].graphic;
          const layer = clickedGraphic.layer;
          
          // ✅ Log layer field structure (for debugging)
          console.log('🗂️ Layer field structure:', {
            layerTitle: layer.title,
            layerUrl: layer.url,
            fields: layer.fields?.map(field => ({
              name: field.name,
              type: field.type,
              alias: field.alias
            })) || 'No fields available'
          });
          
          // ✅ Extract attributes from the graphic (your actual cadastre fields)
          const attributes = clickedGraphic.attributes;
          const geometry = clickedGraphic.geometry;
          
          console.log('📍 Raw graphic attributes:', attributes);
          console.log('🗺️ Raw graphic geometry:', geometry);
          
          // ✅ Map your actual cadastre layer fields + coordinates
          const cadastreData = {
            seq: attributes.seq,
            id: attributes.id,
            guid: attributes.guid,
            country: attributes.country,
            town_fr: attributes.town_fr,
            town_nl: attributes.town_nl,
            town_de: attributes.town_de,
            postcode: attributes.postcode,
            street_fr: attributes.street_fr,
            street_nl: attributes.street_nl,
            street_de: attributes.street_de,
            number: attributes.number,
            building_guid: attributes.building_guid,
            // ✅ Add coordinates from geometry
            x: geometry?.longitude || geometry?.x,
            y: geometry?.latitude || geometry?.y
          };
          
          console.log('📍 Cadastre feature clicked!', {
            graphic: clickedGraphic,
            rawAttributes: attributes,
            mappedData: cadastreData,
            geometry: clickedGraphic.geometry,
            guid: cadastreData.guid
          });

          // ✅ SHOW IMMEDIATE POINT DATA from clicked graphic (use mapped data)
          showImmediatePointData(cadastreData);

          if (cadastreData.guid) {
            console.log('🔍 Fetching additional cadastre data for GUID:', cadastreData.guid);
            
            try {
              // Fetch additional comprehensive data using the GUID (in background)
              const additionalData = await CadastreService.fetchCadastreDataByGuid(cadastreData.guid);
              
              // Update the popup content with additional fetched data
              updateCadastrePopupContent(additionalData);
              
            } catch (error) {
              console.error('❌ Error fetching additional cadastre data:', error);
              showCadastrePopupError(error.message);
            }
          } else {
            console.warn('⚠️ No GUID found for clicked cadastre point - only showing basic data');
            console.warn('⚠️ Available attributes:', Object.keys(attributes));
            // Hide the loading message since we won't fetch additional data
            setTimeout(() => {
              const additionalLoadingEl = document.getElementById('additional-loading');
              if (additionalLoadingEl) additionalLoadingEl.style.display = 'none';
            }, 100);
          }
        } else {
          console.log('ℹ️ No cadastre features clicked');
        }
      } catch (error) {
        console.error('❌ Error in hit test:', error);
      }
    });
    
    console.log('✅ Cadastre click handling set up successfully');
  }, [showImmediatePointData, updateCadastrePopupContent, showCadastrePopupError]);

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

    // ✅ V2 UPDATE: White dots with black outline for "Not In Efficy" cadastre points
    const cadastreRenderer = new SimpleRenderer({
      symbol: {
        type: "simple-marker",
        size: 7, // ✅ Increased by 4 (from 3 to 7) for better visibility
        color: [255, 255, 255], // ✅ White fill as requested
        outline: {
          width: 1,
          color: [0, 0, 0] // ✅ Black outline as requested
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

    console.log('🏛️ Cadastre layer created with larger white dots:', {
      url: layer.url,
      title: layer.title,
      visible: layer.visible,
      minScale: layer.minScale,
      symbolColor: 'white with black outline',
      symbolSize: '7px' // ✅ Updated size
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