
import logger from './logger';

export interface CafeCoordinates {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export const geoUtils = {
  // Calculate centroid from an array of coordinates
  calculateCentroid(coordinates: Array<{ latitude: number; longitude: number }>): { latitude: number; longitude: number } {
    if (coordinates.length === 0) {
      throw new Error('Cannot calculate centroid of empty array');
    }

    const totalLat = coordinates.reduce((sum, coord) => sum + coord.latitude, 0);
    const totalLng = coordinates.reduce((sum, coord) => sum + coord.longitude, 0);

    return {
      latitude: totalLat / coordinates.length,
      longitude: totalLng / coordinates.length
    };
  },

  // Calculate distance between two points using Haversine formula (in miles)
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    logger.debug("Calculating distance between coordinates", { lat1, lng1, lat2, lng2 });
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  // Convert degrees to radians
  toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  },

  // Sort profiles by distance using KNN algorithm
  sortProfilesByDistance(
    userCentroid: { latitude: number; longitude: number },
    profiles: Array<any & { centroid_lat?: number; centroid_long?: number; distance?: number }>
  ): Array<any & { distance: number }> {
    if (!userCentroid) {
      return profiles.map(profile => ({ ...profile, distance: null }));
    }

    // Calculate distance for each profile and add it to the profile object
    const profilesWithDistance = profiles.map(profile => {
      let distance = null;
      
      if (profile.centroid_lat && profile.centroid_long) {
        distance = this.calculateDistance(
          userCentroid.latitude,
          userCentroid.longitude,
          profile.centroid_lat,
          profile.centroid_long
        );
      }
      
      return {
        ...profile,
        distance
      };
    });

    // Sort by distance (nulls at the end)
    return profilesWithDistance.sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
  },

  // Filter profiles by maximum distance
  filterProfilesByDistance(
    profiles: Array<any & { distance?: number }>,
    maxDistance: number
  ): Array<any> {
    if (maxDistance === null || maxDistance === undefined) {
      logger.debug("No max distance filter applied");
      return profiles;
    }
    
    logger.debug("Filtering profiles by max distance", { maxDistance });
    
    const filteredProfiles = profiles.filter(profile => {
      if (profile.distance === null || profile.distance === undefined) {
        console.log(`Profile ${profile.name} has no distance data - excluding`);
        return false;
      }
      
      const withinDistance = profile.distance <= maxDistance;
      console.log(`Profile ${profile.name}: ${profile.distance.toFixed(2)} miles - ${withinDistance ? 'included' : 'excluded'}`);
      
      return withinDistance;
    });
    
    console.log(`Filtered ${profiles.length} profiles down to ${filteredProfiles.length} within ${maxDistance} miles`);
    return filteredProfiles;
  },

  
};
