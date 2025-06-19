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
        assetClasses: ';4;'
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
        assetClasses: ';1;'
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
        assetClasses: ';2;3;'
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
  const [layerVisible, setLayerVisible] = useState(true);
  const [layerOpacity, setLayerOpacity] = useState(0.7);
  const [buildingsVisible, setBuildingsVisible] = useState(true);
  const [buildings, setBuildings] = useState([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);

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
                  'esri/layers/MapImageLayer',
                  'esri/layers/GraphicsLayer',
                  'esri/Graphic',
                  'esri/geometry/Point',
                  'esri/symbols/SimpleMarkerSymbol',
                  'esri/PopupTemplate'
                ], (Map, MapView, MapImageLayer, GraphicsLayer, Graphic, Point, SimpleMarkerSymbol, PopupTemplate) => {
                  resolve({ Map, MapView, MapImageLayer, GraphicsLayer, Graphic, Point, SimpleMarkerSymbol, PopupTemplate });
                }, reject);
              };
              script.onerror = reject;
              document.head.appendChild(script);
            } else {
              window.require([
                'esri/Map',
                'esri/views/MapView',
                'esri/layers/MapImageLayer',
                'esri/layers/GraphicsLayer',
                'esri/Graphic',
                'esri/geometry/Point',
                'esri/symbols/SimpleMarkerSymbol',
                'esri/PopupTemplate'
              ], (Map, MapView, MapImageLayer, GraphicsLayer, Graphic, Point, SimpleMarkerSymbol, PopupTemplate) => {
                resolve({ Map, MapView, MapImageLayer, GraphicsLayer, Graphic, Point, SimpleMarkerSymbol, PopupTemplate });
              }, reject);
            }
          });
        };

        // Load ArcGIS modules
        const { Map, MapView, MapImageLayer, GraphicsLayer } = await loadArcGISModules();

        // Create the CBRE Belgium Cadastre layer
        const cadastreLayerInstance = new MapImageLayer({
          url: 'https://arcgiscenter.cbre.eu/arcgis/rest/services/Belgium/Cadastre/MapServer',
          title: 'Belgium Cadastre',
          opacity: layerOpacity,
          visible: layerVisible,
          sublayers: [{
            id: 2,
            visible: true
          }]
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
          basemap: 'streets-vector',
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
      try {
        let buildingData = [];
        
        try {
          buildingData = await BuildingDataService.fetchBuildings();
          console.log('✅ API SUCCESS - Loaded buildings from API:', buildingData.length);
          console.log('✅ API SUCCESS - First building:', buildingData[0]);
          
          if (buildingData.length === 0) {
            console.warn('⚠️ API returned no buildings, using mock data');
            buildingData = BuildingDataService.getMockBuildings();
          }
        } catch (apiError) {
          console.error('❌ API FAILED:', apiError);
          buildingData = BuildingDataService.getMockBuildings();
          console.log('🔄 Using mock data instead, count:', buildingData.length);
        }

        console.log('📋 FINAL DATA to pass to map:', buildingData);
        console.log('📋 FINAL DATA length:', buildingData.length);
        setBuildings(buildingData);
        
        if (buildingData.length > 0 && targetLayer) {
          console.log('🗺️ About to call addBuildingsToMap with', buildingData.length, 'buildings');
          await addBuildingsToMap(buildingData, targetLayer);
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
      }
    };

    // Add building markers to map
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

        // Add building markers with VERY VISIBLE symbols
        let addedCount = 0;
        buildingData.forEach((building, index) => {
          console.log(`🏢 Processing building ${index + 1}:`, building);
          console.log(`📍 Coordinates: lat=${building.latitude}, lng=${building.longitude}`);
          
          try {
            // Create point geometry
            const point = new Point({
              longitude: building.longitude,
              latitude: building.latitude,
              spatialReference: { wkid: 4326 } // Explicitly set coordinate system
            });
            console.log(`✅ Created point for ${building.name}:`, point);

            // Create VERY VISIBLE symbol
            const symbol = new SimpleMarkerSymbol({
              color: [255, 0, 0], // Bright red instead of orange
              outline: {
                color: [0, 0, 0], // Black outline instead of white
                width: 3
              },
              size: '20px' // Much larger
            });
            console.log(`✅ Created symbol for ${building.name}`);

            // Create popup template
            const popupTemplate = new PopupTemplate({
              title: building.name,
              content: `
                <div>
                  <p><strong>Property ID:</strong> ${building.propertyId}</p>
                  <p><strong>Address:</strong> ${building.address}</p>
                  <p><strong>Coordinates:</strong> ${building.latitude.toFixed(6)}, ${building.longitude.toFixed(6)}</p>
                </div>
              `
            });

            // Create graphic
            const graphic = new Graphic({
              geometry: point,
              symbol: symbol,
              attributes: building,
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
        const { Map, MapView, MapImageLayer } = await new Promise((resolve, reject) => {
          window.require([
            'esri/Map',
            'esri/views/MapView',
            'esri/layers/MapImageLayer'
          ], (Map, MapView, MapImageLayer) => {
            resolve({ Map, MapView, MapImageLayer });
          }, reject);
        });

        // Create the CBRE Belgium Cadastre layer
        const cadastreLayer = new MapImageLayer({
          url: 'https://arcgiscenter.cbre.eu/arcgis/rest/services/Belgium/Cadastre/MapServer',
          title: 'Belgium Cadastre',
          opacity: 0.7,
          visible: true,
          sublayers: [{
            id: 2,
            visible: true
          }]
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
  const handleCadastreVisibilityToggle = () => {
    if (cadastreLayer) {
      const newVisibility = !layerVisible;
      cadastreLayer.visible = newVisibility;
      setLayerVisible(newVisibility);
    }
  };

  const handleBuildingsVisibilityToggle = () => {
    if (buildingsLayer) {
      const newVisibility = !buildingsVisible;
      buildingsLayer.visible = newVisibility;
      setBuildingsVisible(newVisibility);
    }
  };

  const handleZoomToBuildings = () => {
    if (viewRef.current && buildingsLayer && buildingsLayer.graphics.length > 0) {
      viewRef.current.goTo(buildingsLayer.graphics.items).catch(err => {
        console.log('Could not zoom to buildings:', err);
      });
    }
  };

  const handleOpacityChange = (event) => {
    const newOpacity = parseFloat(event.target.value);
    if (cadastreLayer) {
      cadastreLayer.opacity = newOpacity;
      setLayerOpacity(newOpacity);
    }
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
        <div className="layer-control">
          <h3>Layers</h3>
          
          {/* Cadastre Layer */}
          <div className="layer-item">
            <label>
              <input 
                type="checkbox" 
                checked={layerVisible}
                onChange={handleCadastreVisibilityToggle}
              />
              Belgium Cadastre
            </label>
            <div className="opacity-control">
              <label>Opacity: {Math.round(layerOpacity * 100)}%</label>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={layerOpacity}
                onChange={handleOpacityChange}
                disabled={!layerVisible}
              />
            </div>
          </div>

          {/* Buildings Layer */}
          <div className="layer-item">
            <label>
              <input 
                type="checkbox" 
                checked={buildingsVisible}
                onChange={handleBuildingsVisibilityToggle}
              />
              Buildings ({buildings.length})
              {loadingBuildings && <span className="loading-indicator"> ⏳</span>}
            </label>
            {buildings.length > 0 && (
              <button 
                onClick={handleZoomToBuildings}
                style={{
                  marginTop: '0.5rem',
                  marginLeft: '1.25rem',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.8rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔍 Zoom to Buildings
              </button>
            )}
          </div>

          {/* API Status */}
          <div className="api-status">
            <p className="status-text">
              {loadingBuildings ? '⏳ Loading buildings...' : 
               buildings.length > 0 ? `🟢 ${buildings.length} buildings loaded` : 
               '🟡 No buildings found'}
            </p>
            <p className="status-text" style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
              Data source: {buildings.length > 3 ? 'Efficy API' : 'Mock data'}
            </p>
            {buildingsLayer && (
              <p className="status-text" style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
                Layer: {buildingsLayer.graphics.length} graphics, {buildingsLayer.visible ? 'visible' : 'hidden'}
              </p>
            )}
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