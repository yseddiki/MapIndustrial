import { useCallback } from 'react';
import { useAppStore } from '../stores/appStore';
import { placesService } from '../services/placesService';
import { mapService } from '../services/mapService';
import { SearchFilters, UsePlacesSearchReturn, Place } from '../types';
import { layerIds } from '../config/app.config';

export const usePlacesSearch = (): UsePlacesSearchReturn => {
  const {
    map,
    view,
    search: { results, isLoading, error },
    filters,
    setSearchResults,
    setSearchLoading,
    setSearchError,
    setSelectedPlace
  } = useAppStore();

  const search = useCallback(async (
    location: { lat: number; lng: number },
    query?: string,
    customFilters?: SearchFilters
  ) => {
    setSearchLoading(true);
    setSearchError(null);

    try {
      const searchFilters = { ...filters, ...customFilters };
      let places: Place[] = [];

      // Try Google Places API first
      if (placesService.isGooglePlacesAvailable()) {
        try {
          if (query) {
            places = await placesService.textSearch(query, location, searchFilters.radius);
          } else {
            places = await placesService.searchNearby(
              {
                location,
                radius: searchFilters.radius,
                type: searchFilters.type,
                keyword: query
              },
              searchFilters
            );
          }
        } catch (apiError) {
          console.warn('Google Places API failed, falling back to mock data:', apiError);
          places = placesService.getMockPlaces(location.lat, location.lng, query);
        }
      } else {
        // Use mock data when API is not available
        places = placesService.getMockPlaces(location.lat, location.lng, query);
      }

      setSearchResults(places);
      await addPlacesToMap(places);

    } catch (error) {
      console.error('Search failed:', error);
      setSearchError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setSearchLoading(false);
    }
  }, [filters, setSearchResults, setSearchLoading, setSearchError, map]);

  const addPlacesToMap = useCallback(async (places: Place[]) => {
    if (!map || !view) return;

    try {
      // Clear existing search results
      await mapService.clearGraphicsLayer(map, layerIds.SEARCH_RESULTS);

      // Add new place markers
      for (const place of places) {
        const { geometry, symbol } = await mapService.createPointGraphic(
          place.geometry.location.lng,
          place.geometry.location.lat,
          place,
          {
            color: [226, 119, 40],
            size: '14px'
          }
        );

        // Create popup template
        const popupTemplate = {
          title: place.name,
          content: createPlacePopupContent(place)
        };

        await mapService.addGraphicToLayer(
          map,
          layerIds.SEARCH_RESULTS,
          geometry,
          place,
          symbol,
          popupTemplate
        );
      }
    } catch (error) {
      console.error('Failed to add places to map:', error);
    }
  }, [map, view]);

  const clearResults = useCallback(async () => {
    setSearchResults([]);
    setSelectedPlace(null);
    setSearchError(null);

    if (map) {
      await mapService.clearGraphicsLayer(map, layerIds.SEARCH_RESULTS);
    }
  }, [map, setSearchResults, setSelectedPlace, setSearchError]);

  const zoomToPlace = useCallback(async (place: Place) => {
    if (!view) return;

    setSelectedPlace(place);
    await mapService.zoomToCoordinates(
      view,
      place.geometry.location.lng,
      place.geometry.location.lat,
      16
    );
  }, [view, setSelectedPlace]);

  const getPlaceDetails = useCallback(async (placeId: string) => {
    if (!placesService.isGooglePlacesAvailable()) {
      throw new Error('Google Places API not available');
    }

    try {
      const details = await placesService.getPlaceDetails(placeId);
      return details;
    } catch (error) {
      console.error('Failed to get place details:', error);
      throw error;
    }
  }, []);

  return {
    search,
    results,
    isLoading,
    error,
    clearResults,
    zoomToPlace,
    getPlaceDetails
  };
};

function createPlacePopupContent(place: Place): string {
  const rating = place.rating ? `<p><strong>Rating:</strong> ⭐ ${place.rating}/5</p>` : '';
  const priceLevel = place.price_level ? `<p><strong>Price Level:</strong> ${'$'.repeat(place.price_level)}</p>` : '';
  const types = place.types.length > 0 ? `<p><strong>Type:</strong> ${place.types.slice(0, 2).join(', ')}</p>` : '';
  const openNow = place.opening_hours?.open_now !== undefined 
    ? `<p><strong>Status:</strong> ${place.opening_hours.open_now ? '🟢 Open' : '🔴 Closed'}</p>` 
    : '';

  return `
    <div class="place-popup">
      <p><strong>Address:</strong> ${place.vicinity || place.formatted_address || 'N/A'}</p>
      ${types}
      ${rating}
      ${priceLevel}
      ${openNow}
    </div>
  `;
}