// src/utils/coordinateUtils.js - Handle Belgian coordinate system conversions

export class CoordinateUtils {
  
  /**
   * ✅ NEW: Detect coordinate system based on value ranges
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate  
   * @returns {string} - Detected coordinate system
   */
  static detectCoordinateSystem(x, y) {
    // Lambert 72 (Belgian) typical ranges:
    // X: 20,000 to 300,000
    // Y: 6,000,000 to 6,800,000
    if (x > 20000 && x < 300000 && y > 6000000 && y < 6800000) {
      return 'LAMBERT_72';
    }
    
    // WGS84 ranges:
    // Longitude: -180 to 180
    // Latitude: -90 to 90
    if (x >= -180 && x <= 180 && y >= -90 && y <= 90) {
      return 'WGS84';
    }
    
    // Web Mercator (EPSG:3857) - used by many web maps
    // Very large numbers, typically > 1,000,000
    if (Math.abs(x) > 1000000 || Math.abs(y) > 1000000) {
      return 'WEB_MERCATOR';
    }
    
    return 'UNKNOWN';
  }

  /**
   * ✅ NEW: Approximate conversion from Lambert 72 to WGS84
   * Note: This is a simplified conversion. For precise conversions, use a proper projection library.
   * @param {number} x - Lambert 72 X coordinate
   * @param {number} y - Lambert 72 Y coordinate
   * @returns {Object} - WGS84 coordinates {longitude, latitude}
   */
  static lambert72ToWGS84Approximate(x, y) {
    // Belgium Lambert 72 reference parameters (simplified)
    const lambertOriginLat = 50.7978150;  // Belgium central latitude
    const lambertOriginLon = 4.3591910;   // Belgium central longitude
    const lambertFalseEasting = 150000.013;
    const lambertFalseNorthing = 5400088.438;
    
    // Simple linear approximation (NOT geodetically accurate but good enough for visualization)
    // These factors are empirically derived for Belgium
    const scaleFactor = 111320; // Approximate meters per degree at Belgium latitude
    
    // Remove false easting/northing
    const relativeX = x - lambertFalseEasting;
    const relativeY = y - lambertFalseNorthing;
    
    // Convert to degrees (very approximate)
    const longitude = lambertOriginLon + (relativeX / (scaleFactor * Math.cos(lambertOriginLat * Math.PI / 180)));
    const latitude = lambertOriginLat + (relativeY / scaleFactor);
    
    console.log(`📍 Lambert 72 to WGS84 conversion:`, {
      input: { x, y },
      output: { longitude, latitude },
      note: 'Approximate conversion for visualization'
    });
    
    return { longitude, latitude };
  }

  /**
   * ✅ NEW: Process coordinates and return both original and converted values
   * @param {Object} point - Point data with x, y coordinates
   * @returns {Object} - Processed coordinate information
   */
  static processPointCoordinates(point) {
    if (!point || !point.x || !point.y) {
      console.warn('⚠️ No coordinates found in point data');
      return null;
    }

    const x = Number(point.x);
    const y = Number(point.y);
    
    const system = this.detectCoordinateSystem(x, y);
    
    const result = {
      original: { x, y },
      system: system,
      wgs84: null,
      display: null
    };

    switch (system) {
      case 'LAMBERT_72':
        // Convert Lambert 72 to WGS84 for map display
        result.wgs84 = this.lambert72ToWGS84Approximate(x, y);
        result.display = result.wgs84;
        console.log('🇧🇪 Belgian Lambert 72 coordinates detected and converted to WGS84');
        break;
        
      case 'WGS84':
        // Already in WGS84, use directly
        result.wgs84 = { longitude: x, latitude: y };
        result.display = result.wgs84;
        console.log('🌍 WGS84 coordinates detected');
        break;
        
      default:
        // Unknown system, try to use as-is
        result.wgs84 = { longitude: x, latitude: y };
        result.display = result.wgs84;
        console.warn(`⚠️ Unknown coordinate system, using as-is: ${system}`);
        break;
    }

    return result;
  }

  /**
   * ✅ NEW: Check if coordinates are valid for Belgium
   * @param {number} longitude - WGS84 longitude
   * @param {number} latitude - WGS84 latitude
   * @returns {boolean} - True if coordinates are in Belgium area
   */
  static isInBelgium(longitude, latitude) {
    // Belgium bounding box (approximate)
    const belgiumBounds = {
      minLon: 2.5,   // Western border
      maxLon: 6.4,   // Eastern border  
      minLat: 49.5,  // Southern border
      maxLat: 51.6   // Northern border
    };

    return longitude >= belgiumBounds.minLon && 
           longitude <= belgiumBounds.maxLon &&
           latitude >= belgiumBounds.minLat && 
           latitude <= belgiumBounds.maxLat;
  }

  /**
   * ✅ NEW: Get the center of Belgium for map initialization
   * @returns {Object} - Belgium center coordinates
   */
  static getBelgiumCenter() {
    return {
      longitude: 4.5,
      latitude: 50.5
    };
  }

  /**
   * ✅ NEW: Format coordinates for display
   * @param {Object} coordinates - Coordinate object with longitude/latitude
   * @param {number} precision - Decimal places (default: 6)
   * @returns {string} - Formatted coordinate string
   */
  static formatCoordinates(coordinates, precision = 6) {
    if (!coordinates || !coordinates.longitude || !coordinates.latitude) {
      return 'N/A';
    }

    const lon = Number(coordinates.longitude).toFixed(precision);
    const lat = Number(coordinates.latitude).toFixed(precision);
    
    return `${lon}, ${lat}`;
  }

  /**
   * ✅ NEW: Validate coordinate data for property creation
   * @param {Object} coordinates - Coordinate object
   * @returns {Object} - Validation result
   */
  static validateCoordinates(coordinates) {
    const errors = [];
    
    if (!coordinates) {
      errors.push('No coordinate data provided');
      return { isValid: false, errors };
    }

    if (!coordinates.longitude || !coordinates.latitude) {
      errors.push('Missing longitude or latitude');
    }

    if (isNaN(coordinates.longitude) || isNaN(coordinates.latitude)) {
      errors.push('Coordinates are not valid numbers');
    }

    // Check if coordinates are reasonable for Belgium
    if (coordinates.longitude && coordinates.latitude) {
      if (!this.isInBelgium(coordinates.longitude, coordinates.latitude)) {
        console.warn('⚠️ Coordinates appear to be outside Belgium bounds');
        // Don't treat this as an error, just a warning
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}