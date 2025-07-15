
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

  // Get coordinates for a cafe using Google Places API
  async getCafeCoordinates(cafeName: string, address: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error('Google Maps API key is missing');
        return null;
      }

      const query = encodeURIComponent(`${cafeName} ${address}`);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocoding/json?address=${query}&key=${apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng
        };
      }
      
      return null;
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
