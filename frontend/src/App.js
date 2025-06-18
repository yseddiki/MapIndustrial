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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data = await response.json();
      console.log('Fetched building data:', data);
      data = data[0]['@func'][0]['#result']['#data']; // Assuming the first item contains the building data
      console.log('Parsed building data:', data);

      return this.parseBuildings(data);
    } catch (error) {
      console.error('Error fetching building data:', error);
      throw error;
    }
  }

  static parseBuildings(apiData) {
    // Parse the Efficy response to extract building coordinates
    // This will need to be adjusted based on the actual response structure
    if (!apiData || !Array.isArray(apiData)) {
      return [];
    }

    const buildings = [];
    
    // Assuming the response contains building data with coordinates
    // You may need to adjust this parsing based on the actual API response structure
    apiData.forEach(item => {
      if (item.records) {
        item.records.forEach(record => {
          // Look for coordinate fields - adjust field names as needed
          const latitude = record.Latitude || record.lat || record.Y;
          const longitude = record.Longitude || record.lng || record.lon || record.X;
          const buildingName = record.Name || record.BuildingName || record.Title || `Building ${record.ID}`;
          const address = record.Address || record.Location || '';

          if (latitude && longitude) {
            buildings.push({
              id: record.ID || record.Id || Math.random().toString(36),
              name: buildingName,
              address: address,
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
              ...record // Include all other properties
            });
          }
        });
      }
    });

    return buildings;
  }

  // Fallback mock data for testing
  static getMockBuildings() {
    return [
      {
        id: '1',
        name: 'CBRE Brussels Office',
        address: 'Rue de la Loi 227, 1040 Brussels',
        latitude: 50.8454,
        longitude: 4.3695
      },
      {
        id: '2',
        name: 'Brussels Business Center',
        address: 'Avenue Louise 250, 1050 Brussels',
        latitude: 50.8263,
        longitude: 4.3649
      },
      {
        id: '3',
        name: 'Antwerp Tower',
        address: 'Meir 24, 2000 Antwerp',
        latitude: 51.2194,
        longitude: 4.4025
      }
    ];
  }
}

// Simple ArcGIS Map Component with Building Data
const SimpleMap = () => {
  const mapContainerRef = useRef(null);
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
          visible: buildingsVisible
        });

        // Store layer references for controls
        setCadastreLayer(cadastreLayerInstance);
        setBuildingsLayer(buildingsLayerInstance);

        // Create map with layers
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

        // Handle view ready event
        view.when(() => {
          console.log('Map loaded successfully');
          setIsMapReady(true);
          loadBuildingData(); // Load building data after map is ready
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
    const loadBuildingData = async () => {
      setLoadingBuildings(true);
      try {
        let buildingData;
        
        // Try to load from API first
        try {
          buildingData = await BuildingDataService.fetchBuildings();
          console.log('Loaded buildings from API:', buildingData.length);
        } catch (apiError) {
          console.warn('API failed, using mock data:', apiError);
          buildingData = BuildingDataService.getMockBuildings();
        }

        setBuildings(buildingData);
        await addBuildingsToMap(buildingData);
        
      } catch (error) {
        console.error('Error loading building data:', error);
        setError('Failed to load building data: ' + error.message);
      } finally {
        setLoadingBuildings(false);
      }
    };

    // Add building markers to map
    const addBuildingsToMap = async (buildingData) => {
      if (!buildingsLayer || !buildingData.length) return;

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
        buildingsLayer.removeAll();

        // Add building markers
        buildingData.forEach(building => {
          // Create point geometry
          const point = new Point({
            longitude: building.longitude,
            latitude: building.latitude
          });

          // Create symbol
          const symbol = new SimpleMarkerSymbol({
            color: [255, 69, 0], // Orange red color for buildings
            outline: {
              color: [255, 255, 255],
              width: 2
            },
            size: '12px'
          });

          // Create popup template
          const popupTemplate = new PopupTemplate({
            title: building.name,
            content: `
              <div>
                <p><strong>Address:</strong> ${building.address}</p>
                <p><strong>Coordinates:</strong> ${building.latitude.toFixed(6)}, ${building.longitude.toFixed(6)}</p>
                <p><strong>Building ID:</strong> ${building.id}</p>
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

          // Add to layer
          buildingsLayer.add(graphic);
        });

        console.log(`Added ${buildingData.length} buildings to map`);
      } catch (error) {
        console.error('Error adding buildings to map:', error);
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
          </div>

          {/* API Status */}
          <div className="api-status">
            <p className="status-text">
              🟢 API Connected
            </p>
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