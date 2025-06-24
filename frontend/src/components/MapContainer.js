// src/components/MapContainer.js

import React, { useRef, useEffect, useState } from 'react';
import { useArcGISAPI } from '../hooks/useArcGISAPI';
import { useMap } from '../hooks/useMap';
import { useMapLayers } from '../hooks/useMapLayers';
import { useBuildingData } from '../hooks/useBuildingData';
import { useFilters } from '../hooks/useFilters';
import ErrorContainer from './ErrorContainer';
import LoadingOverlay from './LoadingOverlay';
import ProcessingOverlay from './ProcessingOverlay';
import LayerControl from './LayerControl';
import CadastreModal from './CadastreModal';

const MapContainer = ({ selectedAsset }) => {
  const mapContainerRef = useRef(null);
  
  // Modal state
  const [isCadastreModalOpen, setIsCadastreModalOpen] = useState(false);
  const [selectedCadastrePoint, setSelectedCadastrePoint] = useState(null);
  
  // Custom hooks
  const {
    isLoaded: isArcGISLoaded,
    error: arcgisError,
    loadArcGISAPI
  } = useArcGISAPI();

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
    updateCadastreVisibility,
    setupCadastreClickHandling
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
    searchInput,
    isSearching,
    handleQualityFilterToggle,
    handleSearchChange,
    handleClearSearch,
    handleSelectAllQualities,
    handleDeselectAllQualities,
    applyFilters
  } = useFilters();

  // Set up global modal handler
  useEffect(() => {
    window.openCadastreModal = (pointData) => {
      console.log('🎯 Opening cadastre modal with point data:', pointData);
      setSelectedCadastrePoint(pointData);
      setIsCadastreModalOpen(true);
    };

    return () => {
      window.openCadastreModal = null;
    };
  }, []);

  // Handle modal close
  const handleModalClose = () => {
    setIsCadastreModalOpen(false);
    setSelectedCadastrePoint(null);
  };

  // Initialize map and layers
  useEffect(() => {
    const init = async () => {
      try {
        setProcessing(true, 'Loading ArcGIS API...');
        
        // First, ensure ArcGIS API is loaded
        await loadArcGISAPI();
        
        setProcessing(true, 'Initializing map...');
        
        // Now create layers after ArcGIS API is confirmed loaded
        setProcessing(true, 'Creating map layers...');
        const cadastre = await createCadastreLayer();
        const buildingsLayerInstance = await createBuildingsLayer();
        
        console.log('✅ Layers created:', {
          cadastre: cadastre,
          buildings: buildingsLayerInstance
        });
        
        // Initialize map with layers
        const { map, view } = await initializeMap(cadastre, buildingsLayerInstance);
        
        console.log('✅ Map initialized:', {
          map: map,
          view: view
        });
        
        // Set up cadastre click handling after map is ready
        if (cadastre && view) {
          console.log('🎯 Setting up cadastre click handling for modal...');
          setupCadastreClickHandling(view, cadastre);
        } else {
          console.warn('❌ Cannot set up cadastre click handling - missing cadastre layer or view');
        }
        
        // Load building data after map is ready
        setTimeout(async () => {
          setProcessing(true, `Getting ${selectedAsset.name} building data...`);
          try {
            const buildingData = await loadBuildingData(selectedAsset.queryId);
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
  }, [selectedAsset]);

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
        console.log(`🟫 GREY filter state: ${qualityFilters.GREY}`);
        if (qualityFilters.GREY) {
          console.log('👁️ User enabled "Not in Efficy" - showing cadastre layer');
        } else {
          console.log('🙈 User disabled "Not in Efficy" - hiding cadastre layer');
        }
        updateCadastreVisibility(qualityFilters.GREY);

        setProcessing(false);
      };

      applyFiltersAndUpdate();
    }
  }, [qualityFilters, searchTerm, allBuildings, buildingsLayer]);

  if (error || arcgisError) {
    return (
      <ErrorContainer
        error={error || arcgisError}
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
          searchInput={searchInput}
          isSearching={isSearching}
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

      {/* Cadastre Modal */}
      <CadastreModal
        isOpen={isCadastreModalOpen}
        onClose={handleModalClose}
        cadastrePoint={selectedCadastrePoint}
      />
    </div>
  );
};

export default MapContainer;