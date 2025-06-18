import React from 'react';
import { useMap } from '../../hooks/useMap';
import { usePlacesSearch } from '../../hooks/UsePlacesSearch';
import { MapComponentProps } from '../../types';

export const MapComponent: React.FC<MapComponentProps> = ({
  config,
  layers,
  onMapReady,
  onMapClick
}) => {
  const { search } = usePlacesSearch();

  const handleMapClick = async (event: __esri.ViewClickEvent) => {
    const { longitude, latitude } = event.mapPoint;
    
    // Trigger nearby search
    await search({ lat: latitude, lng: longitude });
    
    // Call custom click handler if provided
    if (onMapClick) {
      onMapClick(event);
    }
  };

  const { mapContainerRef, isReady, error } = useMap(
    config,
    layers,
    handleMapClick
  );

  // Call onMapReady when map is initialized
  React.useEffect(() => {
    if (isReady && onMapReady) {
      // We can't pass map/view directly due to circular dependency concerns
      // Instead, components should use the store to access map/view
      onMapReady();
    }
  }, [isReady, onMapReady]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-6">
          <div className="text-red-500 text-xl mb-2">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Map Loading Error</h3>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapContainerRef} 
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
      
      {!isReady && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};