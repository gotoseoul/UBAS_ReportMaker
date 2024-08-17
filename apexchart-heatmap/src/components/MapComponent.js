import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Add your Mapbox access token here
mapboxgl.accessToken = 'pk..';

const MapComponent = ({ wifiDataRaw }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [127.028, 37.582],
      zoom: 15
    });

    const wifiLocations = [];
    const lines = wifiDataRaw.split('\n');
    let currentSsid = '';
    let currentLocation = '';

    lines.forEach(line => {
      if (line.startsWith('Known-wifi-name')) {
        currentSsid = line.split(': ')[1];
      } else if (line.startsWith('Known-wifi-location')) {
        currentLocation = line.split(': ')[1];

        if (currentLocation !== 'none') {
          wifiLocations.push({
            ssid: currentSsid.replace('wifi.network.ssid.', ''),
            location: currentLocation
          });
        }

        // Reset for next block
        currentSsid = '';
        currentLocation = '';
      }
    });

    console.log('Parsed Wifi Locations:', wifiLocations);

    wifiLocations.forEach(loc => {
      if (loc.location && loc.location.includes(',')) {
        const [lat, lng] = loc.location.split(',').map(Number);
        new mapboxgl.Marker()
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(loc.ssid))
          .addTo(map.current);
      }
    });

    window.addEventListener('resize', () => {
      map.current.resize();
    });

    return () => {
      window.removeEventListener('resize', () => {
        map.current.resize();
      });
    };
  }, [wifiDataRaw]);

  return <div ref={mapContainer} style={{ height: '180px', width: '100%' }} />;
};

export default MapComponent;