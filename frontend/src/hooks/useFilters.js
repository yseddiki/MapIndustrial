// src/hooks/useFilters.js

import { useState, useCallback, useEffect } from 'react';
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
  
  // ✅ V2 UPDATE: Separate states for debounced search
  const [searchInput, setSearchInput] = useState(''); // What user is typing
  const [searchTerm, setSearchTerm] = useState(''); // What actually gets applied for filtering
  const [isSearching, setIsSearching] = useState(false); // Loading state for search

  // ✅ V2 UPDATE: Debounced search effect - waits 1 second after user stops typing
  useEffect(() => {
    setIsSearching(true);
    
    const searchTimer = setTimeout(() => {
      setSearchTerm(searchInput);
      setIsSearching(false);
      console.log('🔍 Search applied:', searchInput);
    }, 1000); // 1 second delay

    // Cleanup timer if user types again before 1 second
    return () => {
      clearTimeout(searchTimer);
    };
  }, [searchInput]);

  const handleQualityFilterToggle = useCallback((qualityLevel) => {
    setQualityFilters(prev => ({
      ...prev,
      [qualityLevel]: !prev[qualityLevel]
    }));
  }, []);

  // ✅ V2 UPDATE: Handle search input changes (not the final search term)
  const handleSearchChange = useCallback((event) => {
    const value = event.target.value;
    setSearchInput(value);
    
    // If input is cleared, apply immediately
    if (value === '') {
      setSearchTerm('');
      setIsSearching(false);
    } else {
      setIsSearching(true);
    }
    
    console.log('⌨️ User typing:', value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    setSearchTerm('');
    setIsSearching(false);
    console.log('🗑️ Search cleared');
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

    // Apply search filter using the debounced search term
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filteredBuildings = filteredBuildings.filter(building => 
        building.name.toLowerCase().includes(searchLower) ||
        building.address.toLowerCase().includes(searchLower) ||
        building.propertyId.toString().includes(searchLower) ||
        (building.TENANTS && building.TENANTS.toLowerCase().includes(searchLower)) ||
        (building.OWNER && building.OWNER.toLowerCase().includes(searchLower))
      );
      console.log(`🎯 Search "${searchTerm}" found ${filteredBuildings.length} results`);
    }

    return filteredBuildings;
  }, [qualityFilters, searchTerm]);

  return {
    qualityFilters,
    searchTerm, // The actual search term used for filtering
    searchInput, // What the user is currently typing
    isSearching, // Whether search is pending
    handleQualityFilterToggle,
    handleSearchChange,
    handleClearSearch,
    handleSelectAllQualities,
    handleDeselectAllQualities,
    applyFilters
  };
};