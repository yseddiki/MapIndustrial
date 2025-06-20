import React, { useEffect, useRef, useState } from 'react';
import './App.css';

// Configuration
const CONFIG = {
  API_ENDPOINTS: {
    EFFICY_CRM: "https://efficy.cbre.be/crm/json"
  },
  API_KEYS: {
    EFFICY: "65D8CAECB10F43809F938ECB571EDADF"
  }
};

// Building Data Service
class BuildingDataService {
  static async fetchBuildings() {
    try {
      const response = await fetch(CONFIG.API_ENDPOINTS.EFFICY_CRM, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Efficy-ApiKey": CONFIG.API_KEYS.EFFICY,
          "X-Efficy-Logoff": "True"
        },
        body: JSON.stringify([
          {
            "@name": "api",
            commit: false,
            closecontext: true,
            "@func": [
              {
                "@name": "query",
                key: 3618 // Updated to use the correct query ID
              }
            ]
          }
        ])
      });
      const raw = await response.json(); console.log('Raw API response:', raw); const data = raw[0]["@func"][0]['#result']['#data'];

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      
      return this.parseBuildings(data);
    } catch (error) {
      console.error('Error fetching building data:', error);
      throw error;
    }
  }

  static parseBuildings(apiData) {
    if (!apiData || !Array.isArray(apiData)) {
      return [];
    }

    const buildings = [];
    
    apiData.forEach(record => {
      const latitude = record.LATITUDE;
      const longitude = record.LONGITUDE;
      const buildingName = record.NAME || `Property ${record.K_PROPERTY}`;
      const propertyId = record.K_PROPERTY;
      
      let address = '';
      if (record.F_STREET_NL && record.F_STREET_NUM) {
        address = `${record.F_STREET_NL} ${record.F_STREET_NUM}`;
        if (record.F_CITY_NL || record.F_CITY_FR) {
          address += `, ${record.F_CITY_NL || record.F_CITY_FR}`;
        }
      } else if (record.F_CITY_NL || record.F_CITY_FR) {
        address = record.F_CITY_NL || record.F_CITY_FR;
      }

      if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
        buildings.push({
          id: propertyId || Math.random().toString(36),
          name: buildingName,
          address: address,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          cityFR: record.F_CITY_FR,
          cityNL: record.F_CITY_NL,
          streetNL: record.F_STREET_NL,
          streetNumber: record.F_STREET_NUM,
          propertyId: record.K_PROPERTY,
          assetClasses: record.F_ASSET_CLASSES,
          ...record
        });
      }
    });

    console.log(`Parsed ${buildings.length} valid buildings from ${apiData.length} records`);
    return buildings;
  }

  // Fallback mock data for testing (matching your API structure)
  static getMockBuildings() {
    return [
      {
        id: '27899',
        name: 'Langveld Park',
        address: 'Petrus Basteleusstraat 2, Sint-Pieters-Leeuw',
        latitude: 50.78771,
        longitude: 4.27725,
        propertyId: '27899',
        cityFR: 'Sint-Pieters-Leeuw',
        cityNL: 'Sint-Pieters-Leeuw',
        streetNL: 'Petrus Basteleusstraat',
        streetNumber: '2',
        assetClasses: ';4;',
        F_ARCGIS_ADDRESS: 'Petrus Basteleusstraat 2, 1600 Sint-Pieters-Leeuw',
        TOTALSURFACE: 5000,
        TENANTS: 'Company A',
        OWNER: 'Owner A'
      },
      {
        id: '27900',
        name: 'CBRE Brussels Office',
        address: 'Rue de la Loi 227, Brussels',
        latitude: 50.8454,
        longitude: 4.3695,
        propertyId: '27900',
        cityFR: 'Bruxelles',
        cityNL: 'Brussel',
        streetNL: 'Wetstraat',
        streetNumber: '227',
        assetClasses: ';1;',
        F_ARCGIS_ADDRESS: 'Rue de la Loi 227, 1040 Brussels',
        TOTALSURFACE: 10000,
        TENANTS: 'CBRE',
        OWNER: ''
      },
      {
        id: '27901',
        name: 'Antwerp Business Center',
        address: 'Meir 24, Antwerp',
        latitude: 51.2194,
        longitude: 4.4025,
        propertyId: '27901',
        cityFR: 'Anvers',
        cityNL: 'Antwerpen',
        streetNL: 'Meir',
        streetNumber: '24',
        assetClasses: ';2;3;',
        F_ARCGIS_ADDRESS: '',
        TOTALSURFACE: 0,
        TENANTS: '',
        OWNER: ''
      }
    ];
  }
}

// Simple ArcGIS Map Component with Building Data
const SimpleMap = () => {
  const mapContainerRef = useRef(null);
  const viewRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState(null);
  const [cadastreLayer, setCadastreLayer] = useState(null);
  const [buildingsLayer, setBuildingsLayer] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [qualityDistribution, setQualityDistribution] = useState({
    GREEN: 0,
    YELLOW: 0,
    ORANGE: 0,
    RED: 0,
    PURPLE: 0,
    GREY: 0
  });
  const [qualityFilters, setQualityFilters] = useState({
    GREEN: true,
    YELLOW: true,
    ORANGE: true,
    RED: true,
    PURPLE: true,
    GREY: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [allBuildings, setAllBuildings] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');

  // Data quality assessment functions (moved outside useEffect)
  const getDataQualityLevel = (building) => {
    // Check if building is from Efficy (has K_PROPERTY)
    if (!building.K_PROPERTY && !building.propertyId) {
      return { level: 'GREY', label: 'Not in Efficy ! (From cadastre)' };
    }

    // Check if has basic data (always true if we have the building)
    const hasBasicData = true;
    
    // Check if has cadastre data (F_ARCGIS_ADDRESS must be non-empty)
    const hasCadastre = building.F_ARCGIS_ADDRESS && building.F_ARCGIS_ADDRESS.trim() !== "";
    
    // Check if has surface data (TOTALSURFACE must be different from 0 or null)
    const hasSurface = building.TOTALSURFACE && building.TOTALSURFACE !== 0;
    
    // Check if has tenants (TENANTS must be non-empty)
    const hasTenants = building.TENANTS && building.TENANTS.trim() !== "";
    
    // Check if has owner (OWNER must be non-empty)
    const hasOwner = building.OWNER && building.OWNER.trim() !== "";
    
    if (hasBasicData && hasCadastre && hasSurface && hasTenants && hasOwner) {
      return { level: 'GREEN', label: 'Excellent' };
    } else if (hasBasicData && hasCadastre && hasSurface && hasTenants) {
      return { level: 'YELLOW', label: 'Good' };
    } else if (hasBasicData && hasCadastre && hasSurface) {
      return { level: 'ORANGE', label: 'OK' };
    } else if (hasBasicData && hasCadastre) {
      return { level: 'RED', label: 'Bad' };
    } else {
      return { level: 'PURPLE', label: 'Catastrophic' };
    }
  };

  const getColorForLevel = (level) => {
    switch (level) {
      case 'GREEN': return [23, 232, 143]; // Accent Green #17E88F
      case 'YELLOW': return [219, 217, 154]; // Wheat #DBD99A
      case 'ORANGE': return [210, 120, 90]; // Data Orange #D2785A
      case 'RED': return [173, 42, 42]; // Negative Red #AD2A2A
      case 'PURPLE': return [136, 80, 115]; // Data Purple #885073
      case 'GREY': return [202, 209, 211]; // Light Grey #CAD1D3
      default: return [128, 128, 128]; // Gray fallback
    }
  };

  // Add building markers to map (moved outside useEffect)
  const addBuildingsToMap = async (buildingData, layerInstance = null) => {
    const targetLayer = layerInstance || buildingsLayer;
    
    console.log('🗺️ addBuildingsToMap CALLED with:', buildingData);
    console.log('🗺️ addBuildingsToMap - targetLayer exists?', !!targetLayer);
    console.log('🗺️ addBuildingsToMap - buildingData length:', buildingData?.length);
    
    if (!targetLayer) {
      console.error('❌ CRITICAL: No targetLayer!');
      return;
    }
    
    if (!buildingData || buildingData.length === 0) {
      console.error('❌ CRITICAL: No buildingData!');
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

      console.log('📦 ArcGIS modules loaded successfully');

      // Clear existing graphics
      targetLayer.removeAll();
      console.log('🧹 Cleared existing graphics');

      // Force layer to be visible
      targetLayer.visible = true;
      console.log('👁️ Set layer to visible');

      // Count buildings by data quality
      const qualityCounts = {
        GREEN: 0,
        YELLOW: 0,
        ORANGE: 0,
        RED: 0,
        PURPLE: 0,
        GREY: 0
      };

      // Add building markers with color-coded quality levels
      let addedCount = 0;
      buildingData.forEach((building, index) => {
        console.log(`🏢 Processing building ${index + 1}:`, building);
        console.log(`📍 Coordinates: lat=${building.latitude}, lng=${building.longitude}`);
        
        try {
          // Assess data quality
          const qualityInfo = getDataQualityLevel(building);
          const markerColor = getColorForLevel(qualityInfo.level);
          qualityCounts[qualityInfo.level]++;

          console.log(`📊 Building ${building.name} quality: ${qualityInfo.level} (${qualityInfo.label})`);

          // Create point geometry
          const point = new Point({
            longitude: building.longitude,
            latitude: building.latitude,
            spatialReference: { wkid: 4326 } // Explicitly set coordinate system
          });
          console.log(`✅ Created point for ${building.name}:`, point);

          // Create smaller, color-coded symbol
          const symbol = new SimpleMarkerSymbol({
            color: markerColor,
            outline: {
              color: markerColor, // Same color as fill, no contrasting border
              width: 1
            },
            size: '10px' // Smaller size as requested
          });
          console.log(`✅ Created symbol for ${building.name} with color:`, markerColor);

          // Create enhanced popup template with quality info
          const getQualityIcon = (level) => {
            switch (level) {
              case 'GREEN': return '🌟';
              case 'YELLOW': return '👍';
              case 'ORANGE': return '⚠️';
              case 'RED': return '❌';
              case 'PURPLE': return '💀';
              case 'GREY': return '📍';
              default: return '❓';
            }
          };

          const getQualityColor = (level) => {
            switch (level) {
              case 'GREEN': return '#17E88F';
              case 'YELLOW': return '#DBD99A';
              case 'ORANGE': return '#D2785A';
              case 'RED': return '#AD2A2A';
              case 'PURPLE': return '#885073';
              case 'GREY': return '#CAD1D3';
              default: return '#999999';
            }
          };

          const popupTemplate = new PopupTemplate({
            title: `🏢 ${building.name}`,
            content: `
              <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.2; color: #2c3e50; font-size: 12px;">
                
                <!-- Quality Status Header -->
                <div style="background: linear-gradient(135deg, #003F2D 0%, #012A2D 100%); color: white; padding: 8px; margin: -10px -10px 8px -10px; border-radius: 6px; text-align: center;">
                  <div style="font-size: 18px; margin-bottom: 4px;">${getQualityIcon(qualityInfo.level)}</div>
                  <div style="font-size: 12px; font-weight: bold; color: ${getQualityColor(qualityInfo.level)};">${qualityInfo.label}</div>
                </div>

                <!-- Property Information -->
                <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                  <h4 style="margin: 0 0 6px 0; color: #003F2D; font-size: 11px; font-weight: bold;">📋 Property Details</h4>
                  <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px; font-size: 11px;">
                    <strong>📍 Address:</strong><span>${building.address || 'N/A'}</span>
                    <strong>🗺️ Coordinates:</strong><span>${building.latitude?.toFixed(4) || 'N/A'}, ${building.longitude?.toFixed(4) || 'N/A'}</span>
                  </div>
                </div>

                <!-- Data Information -->
                <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                  <h4 style="margin: 0 0 6px 0; color: #003F2D; font-size: 11px; font-weight: bold;">📊 Data Information</h4>
                  <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px; font-size: 11px;">
                    <strong>🏛️ Cadastre:</strong><span>${building.F_ARCGIS_ADDRESS || 'Not available'}</span>
                    <strong>📐 Surface:</strong><span>${building.TOTALSURFACE ? building.TOTALSURFACE + ' m²' : 'Not available'}</span>
                    <strong>🏢 Tenants:</strong><span>${building.TENANTS || 'Not available'}</span>
                    <strong>👤 Owner:</strong><span>${building.OWNER || 'Not available'}</span>
                  </div>
                </div>

                ${building.propertyId ? `
                <!-- CRM Action Button -->
                <div style="text-align: center; margin-top: 8px;">
                  <a href="https://efficy.cbre.be/crm/view/Prop/${building.propertyId}" 
                     target="_blank" 
                     style="display: inline-block; background: linear-gradient(135deg, #17E88F 0%, #00C896 100%); 
                            color: #003F2D; padding: 8px 16px; text-decoration: none; border-radius: 20px; 
                            font-weight: bold; font-size: 11px; box-shadow: 0 3px 6px rgba(23, 232, 143, 0.3); 
                            transition: all 0.3s ease; border: none;">
                    🚀 Open in CRM
                  </a>
                </div>
                ` : ''}
              </div>
            `
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
          console.log(`✅ Created graphic for ${building.name}:`, graphic);

          // Add to layer
          targetLayer.add(graphic);
          addedCount++;
          console.log(`✅ Added graphic ${addedCount} to layer for ${building.name}`);
          
        } catch (buildingError) {
          console.error(`❌ ERROR adding building ${building.name}:`, buildingError);
        }
      });

      // Log quality distribution
      console.log('📊 Data Quality Distribution:', qualityCounts);
      
      // Update quality distribution state
      setQualityDistribution(qualityCounts);

      // Force layer refresh
      targetLayer.refresh();
      console.log('🔄 Layer refreshed');
      
      // Move layer to top
      if (viewRef.current && viewRef.current.map) {
        viewRef.current.map.reorder(targetLayer, viewRef.current.map.layers.length - 1);
        console.log('⬆️ Moved layer to top');
      }

      console.log(`🎉 FINAL RESULT: Added ${addedCount}/${buildingData.length} buildings to map`);
      console.log(`🎉 FINAL RESULT: Layer now has ${targetLayer.graphics.length} graphics`);
      console.log(`🎉 FINAL RESULT: Layer visible: ${targetLayer.visible}`);

      // Update the state layer reference if we used a local instance
      if (layerInstance && !buildingsLayer) {
        setBuildingsLayer(layerInstance);
      }

      // Zoom to show all buildings after a short delay
      setTimeout(() => {
        if (viewRef.current && targetLayer.graphics.length > 0) {
          console.log('🔍 Attempting to zoom to buildings...');
          viewRef.current.goTo(targetLayer.graphics.items).catch(err => {
            console.log('Could not zoom to buildings:', err);
          });
        } else {
          console.log('❌ Cannot zoom - no graphics or no view');
        }
      }, 1000);

    } catch (error) {
      console.error('💥 CRITICAL ERROR in addBuildingsToMap:', error);
    }
  };

  useEffect(() => {
    let map = null;
    let view = null;

    const initializeMap = async () => {
      try {
        setError(null);
        
        // Use a more stable way to load ArcGIS modules
        const loadArcGISModules = () => {
          return new Promise((resolve, reject) => {
            // Load the ArcGIS API script
            if (!window.require) {
              const script = document.createElement('script');
              script.src = 'https://js.arcgis.com/4.28/';
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
        };

        // Load ArcGIS modules
        const { Map, MapView, FeatureLayer, GraphicsLayer, SimpleRenderer } = await loadArcGISModules();

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

        // Create the CBRE Belgium Cadastre layer as FeatureLayer
        const cadastreLayerInstance = new FeatureLayer({
          url: 'https://arcgiscenter.cbre.eu/arcgis/rest/services/Belgium/Cadastre/MapServer/2',
          title: 'Belgium Cadastre',
          opacity: 1,
          visible: true,
          renderer: cadastreRenderer // Apply custom symbology
        });

        // Create buildings layer
        const buildingsLayerInstance = new GraphicsLayer({
          title: 'Buildings',
          visible: true, // Explicitly set to true
          listMode: 'show'
        });

        // Store layer references for controls
        setCadastreLayer(cadastreLayerInstance);
        setBuildingsLayer(buildingsLayerInstance);

        // Create map with layers - PUT BUILDINGS LAYER ON TOP
        map = new Map({
          basemap: 'satellite', // Changed to satellite view
          layers: [cadastreLayerInstance, buildingsLayerInstance]
        });

        // Create map view
        view = new MapView({
          container: mapContainerRef.current,
          map: map,
          center: [4.3517, 50.8503], // Brussels, Belgium [longitude, latitude]
          zoom: 10,
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
          
          // WAIT A BIT MORE to ensure layers are ready, then load buildings
          setTimeout(() => {
            console.log('🎯 Now loading buildings - layer should be ready');
            console.log('🎯 Buildings layer exists?', !!buildingsLayerInstance);
            loadBuildingData(buildingsLayerInstance); // Pass the layer directly
          }, 500);
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

      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to load map components: ' + err.message);
      }
    };

    // Load building data from API
    const loadBuildingData = async (layerInstance = null) => {
      const targetLayer = layerInstance || buildingsLayer;
      console.log('🚀 loadBuildingData called with layer:', !!targetLayer);
      
      setLoadingBuildings(true);
      setIsProcessing(true);
      setProcessingStep('Getting building data...');
      
      try {
        let buildingData = [];
        
        try {
          buildingData = await BuildingDataService.fetchBuildings();
          console.log('✅ API SUCCESS - Loaded buildings from API:', buildingData.length);
          console.log('✅ API SUCCESS - First building:', buildingData[0]);
          
          if (buildingData.length === 0) {
            console.warn('⚠️ API returned no buildings, using mock data');
            setProcessingStep('API returned no data, using sample data...');
            await new Promise(resolve => setTimeout(resolve, 500));
            buildingData = BuildingDataService.getMockBuildings();
          }
        } catch (apiError) {
          console.error('❌ API FAILED:', apiError);
          setProcessingStep('API failed, loading sample data...');
          await new Promise(resolve => setTimeout(resolve, 500));
          buildingData = BuildingDataService.getMockBuildings();
          console.log('🔄 Using mock data instead, count:', buildingData.length);
        }

        console.log('📋 FINAL DATA to pass to map:', buildingData);
        console.log('📋 FINAL DATA length:', buildingData.length);
        setBuildings(buildingData);
        setAllBuildings(buildingData); // Store all buildings for filtering
        
        if (buildingData.length > 0 && targetLayer) {
          console.log('🗺️ About to call addBuildingsToMap with', buildingData.length, 'buildings');
          await addBuildingsToMap(buildingData, targetLayer, true); // Show loading during initial load
        } else {
          console.error('❌ NO BUILDINGS TO ADD TO MAP OR NO LAYER:', {
            buildingsCount: buildingData.length,
            hasLayer: !!targetLayer
          });
        }
        
      } catch (error) {
        console.error('💥 Critical error loading building data:', error);
        setError('Failed to load building data: ' + error.message);
      } finally {
        setLoadingBuildings(false);
        setIsProcessing(false);
        setProcessingStep('');
      }
    };

    // Add CSS for ArcGIS
    if (!document.querySelector('link[href*="arcgis"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://js.arcgis.com/4.28/esri/themes/light/main.css';
      document.head.appendChild(link);
    }

    initializeMap();

    // Cleanup function
    return () => {
      if (view) {
        view.destroy();
      }
      viewRef.current = null;
    };
  }, []);

  // Filter and search effect
  useEffect(() => {
    if (allBuildings.length > 0 && buildingsLayer) {
      applyFiltersAndSearch();
    }
  }, [qualityFilters, searchTerm, allBuildings]);

  // Apply filters and search to buildings
  const applyFiltersAndSearch = async () => {
    if (!buildingsLayer || allBuildings.length === 0) return;

    try {
      setIsProcessing(true);
      setProcessingStep('Applying filters...');
      
      // Small delay to show the step
      await new Promise(resolve => setTimeout(resolve, 200));

      // Filter buildings by quality
      let filteredBuildings = allBuildings.filter(building => {
        const quality = getDataQualityLevel(building);
        return qualityFilters[quality.level];
      });

      // Apply search filter
      if (searchTerm.trim() !== '') {
        const searchLower = searchTerm.toLowerCase();
        filteredBuildings = filteredBuildings.filter(building => 
          building.name.toLowerCase().includes(searchLower) ||
          building.address.toLowerCase().includes(searchLower) ||
          building.propertyId.toString().includes(searchLower) ||
          (building.TENANTS && building.TENANTS.toLowerCase().includes(searchLower)) ||
          (building.OWNER && building.OWNER.toLowerCase().includes(searchLower))
        );
      }

      console.log(`🔍 Filtered buildings: ${filteredBuildings.length}/${allBuildings.length}`);
      
      // Update the map with filtered buildings (don't show loading overlay for filtering)
      await addBuildingsToMap(filteredBuildings, buildingsLayer, false);
      setBuildings(filteredBuildings);

    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsMapReady(false);
    window.location.reload();
  };

  const handleTryDifferentBasemap = () => {
    setError(null);
    setIsMapReady(false);
    
    // Try with a simple basemap
    const initSimpleMap = async () => {
      try {
        const { Map, MapView, FeatureLayer, SimpleRenderer } = await new Promise((resolve, reject) => {
          window.require([
            'esri/Map',
            'esri/views/MapView',
            'esri/layers/FeatureLayer',
            'esri/renderers/SimpleRenderer'
          ], (Map, MapView, FeatureLayer, SimpleRenderer) => {
            resolve({ Map, MapView, FeatureLayer, SimpleRenderer });
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

        // Create the CBRE Belgium Cadastre layer as FeatureLayer
        const cadastreLayer = new FeatureLayer({
          url: 'https://arcgiscenter.cbre.eu/arcgis/rest/services/Belgium/Cadastre/MapServer/2',
          title: 'Belgium Cadastre',
          opacity: 1,
          visible: true,
          renderer: cadastreRenderer
        });

        const map = new Map({
          basemap: 'gray',
          layers: [cadastreLayer]
        });

        const view = new MapView({
          container: mapContainerRef.current,
          map: map,
          center: [4.3517, 50.8503],
          zoom: 10
        });

        view.when(() => {
          setIsMapReady(true);
        });

      } catch (err) {
        setError('All basemap options failed: ' + err.message);
      }
    };

    initSimpleMap();
  };

  // Layer control handlers
  const handleQualityFilterToggle = (qualityLevel) => {
    setQualityFilters(prev => ({
      ...prev,
      [qualityLevel]: !prev[qualityLevel]
    }));
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleSelectAllQualities = () => {
    setQualityFilters({
      GREEN: true,
      YELLOW: true,
      ORANGE: true,
      RED: true,
      PURPLE: true,
      GREY: true
    });
  };

  const handleDeselectAllQualities = () => {
    setQualityFilters({
      GREEN: false,
      YELLOW: false,
      ORANGE: false,
      RED: false,
      PURPLE: false,
      GREY: false
    });
  };

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h2>⚠️ Map Loading Error</h2>
          <p>{error}</p>
          <div style={{ marginTop: '1rem' }}>
            <button onClick={handleRetry} style={{ marginRight: '0.5rem' }}>
              Retry
            </button>
            <button onClick={handleTryDifferentBasemap}>
              Try Simple Basemap
            </button>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
            <p>This error often occurs due to network issues or basemap compatibility.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="map-app">
      <div 
        ref={mapContainerRef}
        className="map-container"
      />
      
      {/* Layer Control Panel */}
      {isMapReady && (
        <div className={`layer-control ${isProcessing ? 'processing' : ''}`}>
          <h3>Map Controls</h3>
          
          {/* Search Section */}
          <div className="layer-item">
            <h4 className="section-title">Search Buildings</h4>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search by name, address, ID..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
              {searchTerm && (
                <button onClick={handleClearSearch} className="clear-search-btn">
                  ✕
                </button>
              )}
            </div>
            {searchTerm && (
              <p className="search-results">
                Found {buildings.length} building{buildings.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Quality Filters Section */}
          <div className="layer-item">
            <h4 className="section-title">
              Data Quality Filters
              <span className="filter-count">({buildings.length}/{allBuildings.length})</span>
            </h4>
            
            <div className="filter-controls">
              <button onClick={handleSelectAllQualities} className="filter-btn">
                Select All
              </button>
              <button onClick={handleDeselectAllQualities} className="filter-btn">
                Clear All
              </button>
            </div>

            <div className="quality-filters">
              <div className="quality-filter-item">
                <label>
                  <input
                    type="checkbox"
                    checked={qualityFilters.GREEN}
                    onChange={() => handleQualityFilterToggle('GREEN')}
                  />
                  <div className="quality-dot" style={{ backgroundColor: '#17E88F' }}></div>
                  <span className="quality-label">
                    Excellent ({qualityDistribution.GREEN})
                  </span>
                </label>
              </div>
              
              <div className="quality-filter-item">
                <label>
                  <input
                    type="checkbox"
                    checked={qualityFilters.YELLOW}
                    onChange={() => handleQualityFilterToggle('YELLOW')}
                  />
                  <div className="quality-dot" style={{ backgroundColor: '#DBD99A' }}></div>
                  <span className="quality-label">
                    Good ({qualityDistribution.YELLOW})
                  </span>
                </label>
              </div>
              
              <div className="quality-filter-item">
                <label>
                  <input
                    type="checkbox"
                    checked={qualityFilters.ORANGE}
                    onChange={() => handleQualityFilterToggle('ORANGE')}
                  />
                  <div className="quality-dot" style={{ backgroundColor: '#D2785A' }}></div>
                  <span className="quality-label">
                    OK ({qualityDistribution.ORANGE})
                  </span>
                </label>
              </div>
              
              <div className="quality-filter-item">
                <label>
                  <input
                    type="checkbox"
                    checked={qualityFilters.RED}
                    onChange={() => handleQualityFilterToggle('RED')}
                  />
                  <div className="quality-dot" style={{ backgroundColor: '#AD2A2A' }}></div>
                  <span className="quality-label">
                    Bad ({qualityDistribution.RED})
                  </span>
                </label>
              </div>
              
              <div className="quality-filter-item">
                <label>
                  <input
                    type="checkbox"
                    checked={qualityFilters.PURPLE}
                    onChange={() => handleQualityFilterToggle('PURPLE')}
                  />
                  <div className="quality-dot" style={{ backgroundColor: '#885073' }}></div>
                  <span className="quality-label">
                    Catastrophic ({qualityDistribution.PURPLE})
                  </span>
                </label>
              </div>

              <div className="quality-filter-item">
                <label>
                  <input
                    type="checkbox"
                    checked={qualityFilters.GREY}
                    onChange={() => handleQualityFilterToggle('GREY')}
                  />
                  <div className="quality-dot" style={{ backgroundColor: '#CAD1D3' }}></div>
                  <span className="quality-label">
                    Not in Efficy ! ({qualityDistribution.GREY})
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="api-status">
            <p className="status-text">
              {loadingBuildings ? '⏳ Loading buildings...' : 
               allBuildings.length > 0 ? `🟢 ${allBuildings.length} buildings total` : 
               '🟡 No buildings found'}
            </p>
            {buildingsLayer && (
              <p className="status-text" style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
                Showing: {buildingsLayer.graphics.length} buildings
              </p>
            )}
          </div>
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-content">
            <div className="processing-spinner"></div>
            <p className="processing-text">{processingStep}</p>
          </div>
        </div>
      )}
      
      {!isMapReady && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <p>Loading map...</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              This may take a few seconds
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App Component
const App = () => {
  return <SimpleMap />;
};

export default App;