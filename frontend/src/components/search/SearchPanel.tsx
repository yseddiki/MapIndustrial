import React, { useState } from 'react';
import { Search, MapPin, X, Filter, Star } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { usePlacesSearch } from '../../hooks/usePlacesSearch';
import { Place, SearchFilters } from '../../types';
import { searchTypes } from '../../config/app.config';

export const SearchPanel: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false);
  const {
    search: { query, results, isLoading, error, selectedPlace },
    filters,
    view,
    setSearchQuery,
    updateFilters,
    clearSearch
  } = useAppStore();

  const { search, clearResults, zoomToPlace } = usePlacesSearch();

  const handleSearch = async () => {
    if (!view) return;

    const center = view.center;
    await search(
      { lat: center.latitude, lng: center.longitude },
      query || undefined,
      filters
    );
  };

  const handlePlaceSelect = (place: Place) => {
    zoomToPlace(place);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    clearSearch();
    clearResults();
  };

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    updateFilters(newFilters);
  };

  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg w-80 max-h-96 overflow-hidden flex flex-col">
      {/* Search Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search for places..."
            value={query}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-md transition-colors ${
              showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
          
          {results.length > 0 && (
            <button
              onClick={handleClearSearch}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Place Type
              </label>
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange({ type: e.target.value || undefined })}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Types</option>
                <option value={searchTypes.RESTAURANT}>Restaurants</option>
                <option value={searchTypes.HOTEL}>Hotels</option>
                <option value={searchTypes.SHOPPING}>Shopping</option>
                <option value={searchTypes.HOSPITAL}>Hospitals</option>
                <option value={searchTypes.SCHOOL}>Schools</option>
                <option value={searchTypes.BANK}>Banks</option>
                <option value={searchTypes.GAS_STATION}>Gas Stations</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Radius: {filters.radius}m
              </label>
              <input
                type="range"
                min="500"
                max="5000"
                step="250"
                value={filters.radius}
                onChange={(e) => handleFilterChange({ radius: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Rating
              </label>
              <select
                value={filters.rating || ''}
                onChange={(e) => handleFilterChange({ rating: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Any Rating</option>
                <option value="3">3+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="openNow"
                checked={filters.openNow || false}
                onChange={(e) => handleFilterChange({ openNow: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="openNow" className="text-sm text-gray-700">
                Open now only
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 text-sm">
              Found {results.length} places
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {results.map((place) => (
              <PlaceItem
                key={place.place_id}
                place={place}
                isSelected={selectedPlace?.place_id === place.place_id}
                onSelect={() => handlePlaceSelect(place)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && results.length === 0 && !error && (
        <div className="p-6 text-center text-gray-500">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Click on the map or search to find places</p>
        </div>
      )}
    </div>
  );
};

interface PlaceItemProps {
  place: Place;
  isSelected: boolean;
  onSelect: () => void;
}

const PlaceItem: React.FC<PlaceItemProps> = ({ place, isSelected, onSelect }) => {
  const getTypeDisplay = (types: string[]) => {
    return types[0]?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Place';
  };

  return (
    <div
      onClick={onSelect}
      className={`p-3 border-b border-gray-100 cursor-pointer transition-colors ${
        isSelected
          ? 'bg-blue-50 border-blue-200'
          : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-2">
        <MapPin className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-gray-900 truncate">
            {place.name}
          </h4>
          <p className="text-xs text-gray-600 truncate">
            {place.vicinity || place.formatted_address}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
              {getTypeDisplay(place.types)}
            </span>
            {place.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span className="text-xs text-gray-600">{place.rating}</span>
              </div>
            )}
            {place.opening_hours?.open_now !== undefined && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                place.opening_hours.open_now 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {place.opening_hours.open_now ? 'Open' : 'Closed'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};