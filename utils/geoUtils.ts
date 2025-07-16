
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

  // Calculate distance between two points using Haversine formula (in kilometers)
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
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
      return profiles;
    }
    
    return profiles.filter(profile => 
      profile.distance !== null && profile.distance <= maxDistance
    );
  },

  // Get coordinates for a cafe using Google Places API
  async getCafeCoordinates(cafeName: string, address: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error('Google Maps API key is missing');
        return null;
      }

      const query = encodeURIComponent(`${cafeName} ${address}`);
      const url = `https://maps.googleapis.com/maps/api/geocoding/json?address=${query}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`;
      
      console.log('Making geocoding request for:', cafeName, address);
      
      const response = await fetch(url);
      
      // Check if response is ok
      if (!response.ok) {
        console.error('Geocoding API request failed:', response.status, response.statusText);
        return null;
      }
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('API response is not JSON, content-type:', contentType);
        const text = await response.text();
        console.error('Response text:', text.substring(0, 200));
        return null;
      }
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        console.log('Successfully geocoded:', cafeName, '→', location);
        return {
          latitude: location.lat,
          longitude: location.lng
        };
      } else {
        console.warn('Geocoding failed for:', cafeName, 'Status:', data.status);
        return null;
      }
      
    } catch (error) {
      console.error('Error geocoding cafe:', error);
      return null;
    }
  },

  // Get centroid of selected cafes
  async getCafesCentroid(cafes: string[]): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const coordinates = [];
      
      for (const cafe of cafes) {
        const [cafeName, cafeAddress] = cafe.split('|||');
        const coords = await this.getCafeCoordinates(cafeName, cafeAddress);
        
        if (coords) {
          coordinates.push(coords);
        }
      }
      
      if (coordinates.length === 0) {
        return null;
      }
      
      return this.calculateCentroid(coordinates);
    } catch (error) {
      console.error('Error calculating cafes centroid:', error);
      return null;
    }
  }
};
