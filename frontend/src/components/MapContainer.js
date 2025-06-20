// src/components/MapContainer.js

import React, { useRef, useEffect } from 'react';
import { useMap } from '../hooks/useMap';
import { useMapLayers } from '../hooks/useMapLayers';
import { useBuildingData } from '../hooks/useBuildingData';
import { useFilters } from '../hooks/useFilters';
import ErrorContainer from './ErrorContainer';
import LoadingOverlay from './LoadingOverlay';
import ProcessingOverlay from './ProcessingOverlay';
import LayerControl from './LayerControl';

const MapContainer = () => {
  const mapContainerRef = useRef(null);
  
  // Custom hooks
  const {
    isMapReady,
    error,
    isProcessing,
    processingStep,
    viewRef,
    initializeMap,
    zoomToBuildings,
    handleRetry,
    handleTryDifferentBasemap,
    setProcessing
  } = useMap(mapContainerRef);

  const {
    cadastreLayer,
    buildingsLayer,
    createCadastreLayer,
    createBuildingsLayer,
    addBuildingsToMap,
    updateCadastreVisibility
  } = useMapLayers();

  const {
    buildings,
    allBuildings,
    loadingBuildings,
    qualityDistribution,
    loadBuildingData,
    setBuildings,
    calculateQualityDistribution
  } = useBuildingData();

  const {
    qualityFilters,
    searchTerm,
    handleQualityFilterToggle,
    handleSearchChange,
    handleClearSearch,
    handleSelectAllQualities,
    handleDeselectAllQualities,
    applyFilters
  } = useFilters();

  // Initialize map and layers
  useEffect(() => {
    const init = async () => {
      try {
        setProcessing(true, 'Initializing map...');
        
        // Create layers first
        const cadastre = await createCadastreLayer();
        const buildingsLayerInstance = await createBuildingsLayer();
        
        // Initialize map with layers
        await initializeMap(cadastre, buildingsLayerInstance);
        
        // Load building data after map is ready
        setTimeout(async () => {
          setProcessing(true, 'Getting building data...');
          try {
            const buildingData = await loadBuildingData();
            if (buildingData.length > 0 && buildingsLayerInstance) {
              setProcessing(true, 'Adding buildings to map...');
              await addBuildingsToMap(buildingData, buildingsLayerInstance);
              zoomToBuildings(buildingsLayerInstance);
            }
          } catch (err) {
            console.error('Error loading building data:', err);
          } finally {
            setProcessing(false);
          }
        }, 500);
        
      } catch (err) {
        console.error('Error initializing map:', err);
        setProcessing(false);
      }
    };

    init();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    if (allBuildings.length > 0 && buildingsLayer) {
      const applyFiltersAndUpdate = async () => {
        setProcessing(true, 'Applying filters...');
        await new Promise(resolve => setTimeout(resolve, 200));

        const filteredBuildings = applyFilters(allBuildings);
        console.log(`🔍 Filtered buildings: ${filteredBuildings.length}/${allBuildings.length}`);
        
        await addBuildingsToMap(filteredBuildings, buildingsLayer);
        setBuildings(filteredBuildings);
        calculateQualityDistribution(filteredBuildings);

        // Control cadastre layer visibility based on GREY filter
        updateCadastreVisibility(qualityFilters.GREY);

        setProcessing(false);
      };

      applyFiltersAndUpdate();
    }
  }, [qualityFilters, searchTerm, allBuildings, buildingsLayer]);

  if (error) {
    return (
      <ErrorContainer
        error={error}
        onRetry={handleRetry}
        onTryDifferentBasemap={handleTryDifferentBasemap}
      />
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
        <LayerControl
          isProcessing={isProcessing}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onClearSearch={handleClearSearch}
          buildings={buildings}
          allBuildings={allBuildings}
          qualityFilters={qualityFilters}
          qualityDistribution={qualityDistribution}
          onQualityFilterToggle={handleQualityFilterToggle}
          onSelectAllQualities={handleSelectAllQualities}
          onDeselectAllQualities={handleDeselectAllQualities}
          loadingBuildings={loadingBuildings}
          buildingsLayer={buildingsLayer}
        />
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <ProcessingOverlay processingStep={processingStep} />
      )}
      
      {/* Loading Overlay */}
      {!isMapReady && (
        <LoadingOverlay />
      )}
    </div>
  );
};

export default MapContainer;