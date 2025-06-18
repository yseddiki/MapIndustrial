import { Loader } from '@googlemaps/js-api-loader';
import { Place, PlaceSearchRequest, SearchFilters } from '../types';
import { appConfig } from '../config/app.config';

class PlacesService {
  private loader: Loader;
  private placesService: google.maps.places.PlacesService | null = null;
  private isLoaded = false;

  constructor() {
    this.loader = new Loader({
      apiKey: appConfig.googleMaps.apiKey,
      version: 'weekly',
      libraries: appConfig.googleMaps.libraries as any[]
    });
  }

  async initialize(): Promise<void> {
    if (this.isLoaded) return;

    try {
      await this.loader.load();
      
      // Create a dummy div for PlacesService (it needs a map or div element)
      const dummyDiv = document.createElement('div');
      this.placesService = new google.maps.places.PlacesService(dummyDiv);
      this.isLoaded = true;
    } catch (error) {
      console.error('Failed to load Google Places API:', error);
      throw new Error('Failed to initialize Google Places API');
    }
  }

  async searchNearby(request: PlaceSearchRequest, filters?: SearchFilters): Promise<Place[]> {
    await this.initialize();

    if (!this.placesService) {
      throw new Error('Places service not initialized');
    }

    return new Promise((resolve, reject) => {
      const searchRequest: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(request.location.lat, request.location.lng),
        radius: filters?.radius || request.radius,
        type: filters?.type || request.type,
        keyword: request.keyword
      };

      // Add additional filters
      if (filters?.openNow) {
        searchRequest.openNow = true;
      }

      this.placesService!.nearbySearch(
        searchRequest,
        (results, status, pagination) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const places = this.transformGooglePlaces(results);
            const filteredPlaces = this.applyCustomFilters(places, filters);
            resolve(filteredPlaces);
          } else {
            reject(new Error(`Places search failed: ${status}`));
          }
        }
      );
    });
  }

  async textSearch(query: string, location?: { lat: number; lng: number }, radius?: number): Promise<Place[]> {
    await this.initialize();

    if (!this.placesService) {
      throw new Error('Places service not initialized');
    }

    return new Promise((resolve, reject) => {
      const searchRequest: google.maps.places.TextSearchRequest = {
        query,
        location: location ? new google.maps.LatLng(location.lat, location.lng) : undefined,
        radius
      };

      this.placesService!.textSearch(searchRequest, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const places = this.transformGooglePlaces(results);
          resolve(places);
        } else {
          reject(new Error(`Text search failed: ${status}`));
        }
      });
    });
  }

  async getPlaceDetails(placeId: string): Promise<google.maps.places.PlaceResult | null> {
    await this.initialize();

    if (!this.placesService) {
      throw new Error('Places service not initialized');
    }

    return new Promise((resolve, reject) => {
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId,
        fields: [
          'name',
          'formatted_address',
          'geometry',
          'rating',
          'price_level',
          'photos',
          'opening_hours',
          'website',
          'formatted_phone_number',
          'types'
        ]
      };

      this.placesService!.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          resolve(place);
        } else {
          reject(new Error(`Place details failed: ${status}`));
        }
      });
    });
  }

  private transformGooglePlaces(googlePlaces: google.maps.places.PlaceResult[]): Place[] {
    return googlePlaces
      .filter(place => place.geometry?.location && place.place_id)
      .map(place => ({
        place_id: place.place_id!,
        name: place.name || 'Unknown',
        vicinity: place.vicinity || place.formatted_address || '',
        formatted_address: place.formatted_address,
        types: place.types || [],
        geometry: {
          location: {
            lat: place.geometry!.location!.lat(),
            lng: place.geometry!.location!.lng()
          }
        },
        rating: place.rating,
        price_level: place.price_level,
        photos: place.photos?.map(photo => ({
          height: photo.height,
          width: photo.width,
          photo_reference: ''
        })),
        opening_hours: place.opening_hours ? {
          open_now: place.opening_hours.open_now || false
        } : undefined
      }));
  }

  private applyCustomFilters(places: Place[], filters?: SearchFilters): Place[] {
    if (!filters) return places;

    let filtered = places;

    // Filter by rating
    if (filters.rating) {
      filtered = filtered.filter(place => 
        place.rating !== undefined && place.rating >= filters.rating!
      );
    }

    // Filter by price level
    if (filters.priceLevel && filters.priceLevel.length > 0) {
      filtered = filtered.filter(place => 
        place.price_level !== undefined && 
        filters.priceLevel!.includes(place.price_level)
      );
    }

    // Filter by open now
    if (filters.openNow) {
      filtered = filtered.filter(place => 
        place.opening_hours?.open_now === true
      );
    }

    return filtered;
  }

  // Fallback mock data for development/testing
  getMockPlaces(lat: number, lng: number, query?: string): Place[] {
    const mockPlaces: Place[] = [
      {
        place_id: 'mock_1',
        name: 'Restaurant Le Bernardin',
        vicinity: 'Rue de la Loi, Brussels',
        types: ['restaurant', 'food'],
        geometry: { location: { lat: lat + 0.001, lng: lng + 0.001 } },
        rating: 4.5
      },
      {
        place_id: 'mock_2',
        name: 'Hotel des Galeries',
        vicinity: 'Galeries Royales Saint-Hubert, Brussels',
        types: ['lodging'],
        geometry: { location: { lat: lat - 0.001, lng: lng - 0.001 } },
        rating: 4.2
      },
      {
        place_id: 'mock_3',
        name: 'Galeries Royales Saint-Hubert',
        vicinity: 'Galeries Royales Saint-Hubert, Brussels',
        types: ['shopping_mall'],
        geometry: { location: { lat: lat + 0.002, lng: lng - 0.002 } },
        rating: 4.0
      },
      {
        place_id: 'mock_4',
        name: 'Delirium Café',
        vicinity: 'Impasse de la Fidélité, Brussels',
        types: ['bar', 'night_club'],
        geometry: { location: { lat: lat - 0.002, lng: lng + 0.002 } },
        rating: 4.3
      },
      {
        place_id: 'mock_5',
        name: 'Musées Royaux des Beaux-Arts',
        vicinity: 'Rue de la Régence, Brussels',
        types: ['museum'],
        geometry: { location: { lat: lat + 0.003, lng: lng + 0.001 } },
        rating: 4.4
      }
    ];

    // Filter by query if provided
    if (query) {
      return mockPlaces.filter(place =>
        place.name.toLowerCase().includes(query.toLowerCase()) ||
        place.types.some(type => type.includes(query.toLowerCase()))
      );
    }

    return mockPlaces;
  }

  // Check if Google Places API is available
  isGooglePlacesAvailable(): boolean {
    return this.isLoaded && !!this.placesService && !!appConfig.googleMaps.apiKey;
  }
}

export const placesService = new PlacesService();