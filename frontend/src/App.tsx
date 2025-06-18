import React from 'react';
import { MapComponent } from './components/map/MapComponent';
import { SearchPanel } from './components/search/SearchPanel';
import { LayerControl } from './components/map/LayerControl';
import { appConfig } from './config/app.config';
import './App.css';

function App() {
  return (
    <div className="app">
      <div className="map-container">
        <MapComponent 
          config={appConfig.map}
          layers={appConfig.layers}
        />
        <SearchPanel />
        <LayerControl />
      </div>
    </div>
  );
}

export default App;