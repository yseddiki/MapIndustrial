// src/hooks/useFilters.js

import { useState, useCallback } from 'react';
import { getDataQualityLevel } from '../utils/dataQuality';

export const useFilters = () => {
  const [qualityFilters, setQualityFilters] = useState({
    GREEN: true,
    YELLOW: true,
    ORANGE: true,
    RED: true,
    PURPLE: true,
    GREY: false // Start with cadastre layer hidden for performance
  });
  
  const [searchTerm, setSearchTerm] = useState('');

  const handleQualityFilterToggle = useCallback((qualityLevel) => {
    setQualityFilters(prev => ({
      ...prev,
      [qualityLevel]: !prev[qualityLevel]
    }));
  }, []);

  const handleSearchChange = useCallback((event) => {
    setSearchTerm(event.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const handleSelectAllQualities = useCallback(() => {
    setQualityFilters({
      GREEN: true,
      YELLOW: true,
      ORANGE: true,
      RED: true,
      PURPLE: true,
      GREY: true
    });
  }, []);

  const handleDeselectAllQualities = useCallback(() => {
    setQualityFilters({
      GREEN: false,
      YELLOW: false,
      ORANGE: false,
      RED: false,
      PURPLE: false,
      GREY: false
    });
  }, []);

  const applyFilters = useCallback((allBuildings) => {
    if (!allBuildings || allBuildings.length === 0) {
      return [];
    }

    // Filter buildings by quality
    let filteredBuildings = allBuildings.filter(building => {
      const quality = getDataQualityLevel(building);
      return qualityFilters[quality.level];
    });

    // Apply search filter
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filteredBuildings = filteredBuildings.filter(building => 
        building.name.toLowerCase().includes(searchLower) ||
        building.address.toLowerCase().includes(searchLower) ||
        building.propertyId.toString().includes(searchLower) ||
        (building.TENANTS && building.TENANTS.toLowerCase().includes(searchLower)) ||
        (building.OWNER && building.OWNER.toLowerCase().includes(searchLower))
      );
    }

    return filteredBuildings;
  }, [qualityFilters, searchTerm]);

  return {
    qualityFilters,
    searchTerm,
    handleQualityFilterToggle,
    handleSearchChange,
    handleClearSearch,
    handleSelectAllQualities,
    handleDeselectAllQualities,
    applyFilters
  };
};