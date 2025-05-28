import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapProps {
  address: string;
  className?: string;
}

export default function Map({ address, className = '' }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const initializeMap = async () => {
      // Fetch the token from backend
      const fetchMapboxToken = async () => {
        try {
          const response = await fetch('/api/mapbox-token');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          console.log('Mapbox token received:', data.token ? 'Token available' : 'No token');
          return data.token;
        } catch (error) {
          console.error('Error fetching Mapbox token:', error);
          return null;
        }
      };

      const token = await fetchMapboxToken();
      if (!token || token.trim() === '') {
        console.error('No Mapbox token available');
        return;
      }

      mapboxgl.accessToken = token;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-74.0060, 40.7128], // Default to NYC
        zoom: 15,
        interactive: false, // Disable interaction for dashboard view
      });

      // Geocode the address and add marker
      const geocodeAddress = async () => {
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}&limit=1`
          );
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].center;
            
            // Update map center
            map.current?.setCenter([lng, lat]);
            
            // Add marker
            new mapboxgl.Marker({ color: '#4CAF50' })
              .setLngLat([lng, lat])
              .addTo(map.current!);
          }
        } catch (error) {
          console.error('Error geocoding address:', error);
        }
      };

      await geocodeAddress();
    };

    initializeMap();

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [address]);

  return <div ref={mapContainer} className={`w-full h-full ${className}`} />;
}