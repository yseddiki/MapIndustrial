// src/hooks/useBuildingData.js

import { useState, useCallback } from 'react';
import { BuildingDataService } from '../services/BuildingDataService';
import { getDataQualityLevel } from '../utils/dataQuality';

export const useBuildingData = () => {
  const [buildings, setBuildings] = useState([]);
  const [allBuildings, setAllBuildings] = useState([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [qualityDistribution, setQualityDistribution] = useState({
    GREEN: 0,
    YELLOW: 0,
    ORANGE: 0,
    RED: 0,
    PURPLE: 0,
    GREY: 0
  });

  const calculateQualityDistribution = useCallback((buildingData) => {
    const counts = {
      GREEN: 0,
      YELLOW: 0,
      ORANGE: 0,
      RED: 0,
      PURPLE: 0,
      GREY: 0
    };

    buildingData.forEach(building => {
      const qualityInfo = getDataQualityLevel(building);
      counts[qualityInfo.level]++;
    });

    setQualityDistribution(counts);
    return counts;
  }, []);

  const loadBuildingData = useCallback(async (queryId = 3618) => {
    setLoadingBuildings(true);
    
    try {
      let buildingData = [];
      
      try {
        buildingData = await BuildingDataService.fetchBuildings(queryId);
        console.log('✅ API SUCCESS - Loaded buildings from API with query', queryId, ':', buildingData.length);
        
        if (buildingData.length === 0) {
          console.warn('⚠️ API returned no buildings, using mock data');
          buildingData = BuildingDataService.getMockBuildings();
        }
      } catch (apiError) {
        console.error('❌ API FAILED:', apiError);
        buildingData = BuildingDataService.getMockBuildings();
        console.log('🔄 Using mock data instead, count:', buildingData.length);
      }

      setBuildings(buildingData);
      setAllBuildings(buildingData);
      calculateQualityDistribution(buildingData);
      
      return buildingData;
      
    } catch (error) {
      console.error('💥 Critical error loading building data:', error);
      throw error;
    } finally {
      setLoadingBuildings(false);
    }
  }, [calculateQualityDistribution]);

  return {
    buildings,
    allBuildings,
    loadingBuildings,
    qualityDistribution,
    loadBuildingData,
    setBuildings,
    calculateQualityDistribution
  };
};