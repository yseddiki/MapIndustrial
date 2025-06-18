import React, { useEffect, useRef, useState } from 'react';

// Simple ArcGIS Map Component
const SimpleMap = () => {
  const mapContainerRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let map = null;
    let view = null;

    const initializeMap = async () => {
      try {
        // Load ArcGIS modules
        const [Map, MapView] = await Promise.all([
          import('https://js.arcgis.com/4.28/@arcgis/core/Map.js'),
          import('https://js.arcgis.com/4.28/@arcgis/core/views/MapView.js')
        ]);

        // Create map
        map = new Map.default({
          basemap: 'streets-navigation-vector' // You can change this to: 'satellite', 'hybrid', 'topo', etc.
        });

        // Create map view
        view = new MapView.default({
          container: mapContainerRef.current,
          map: map,
          center: [4.3517, 50.8503], // Brussels, Belgium [longitude, latitude]
          zoom: 10
        });

        // Wait for the view to load
        await view.when();
        setIsMapReady(true);

      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to load map. Please check your internet connection and try again.');
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      if (view) {
        view.destroy();
      }
    };
  }, []);

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h2>⚠️ Map Loading Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
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
      
      {!isMapReady && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <p>Loading map...</p>
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
