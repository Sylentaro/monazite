<script>
// @ts-nocheck
    import { onMount, createEventDispatcher } from 'svelte';
    import 'leaflet/dist/leaflet.css';
    import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
    export let rounded = false
    export let handlePriceCalculation;
    const dispatch = createEventDispatcher();
    // function callBackMapError() {
    //   mapErrorHandle(true)
    // }
    let L; 
    let map;
    let marker1;
    let marker2;
    let routingControl;

    onMount(async () => {
      const leafletModule = await import('leaflet');
      const leafletRouting = await import('leaflet-routing-machine');
      L = leafletModule.default;
      map = L.map('map').setView([51.505, -0.09], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    //   const customIcon = L.icon({
    //   iconUrl: 'data:image/svg+xml;base64,[tutaj_base64_kod_twojego_svg]',
    //   iconSize: [20, 20], // Ustaw rozmiar ikony
    //   iconAnchor: [0, 0] // Ustaw punkt kotwiczenia ikony
    // });
    });
    
    // Zmodyfikowana metoda przyjmująca dwa zestawy danych dla dwóch różnych punktów
  export async function setMapMarker(streetName) {
      const streetResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(streetName)}`);
      const streetData = await streetResponse.json();
      if (streetData && streetData.length > 0) {
        const { lat: startLat, lon: startLon } = streetData[0];
        map.setView([startLat, startLon], 13);
        if (marker1) {
          map.removeLayer(marker1);
        } 
        marker1 = L.marker([startLat, startLon]).bindTooltip('Start', { permanent: false, direction: 'top' }).addTo(map);
      }
      else {
        if (marker1) {
          map.removeLayer(marker1);
        } 
      }
  }
  export async function setMapViewFromStreetName(startStreetName, endStreetName, withDriverMarker) {
    try {
      const startResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(startStreetName)}`);
      const startData = await startResponse.json();

      const endResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endStreetName)}`);
      const endData = await endResponse.json();

      if (startData && startData.length > 0 && endData && endData.length > 0) {
        const { lat: startLat, lon: startLon } = startData[0];
        const { lat: endLat, lon: endLon } = endData[0];

        map.setView([startLat, startLon], 13);

        if (marker1) {
          map.removeLayer(marker1);
        }

        if (marker2) {
          map.removeLayer(marker2);
        }

        // Dodaj markery na mapie z etykietami i kolorami
       // marker1 = L.marker([startLat, startLon]).bindTooltip('Start', { permanent: true, direction: 'top' }).addTo(map);
       // marker2 = L.marker([endLat, endLon]).bindTooltip('End', { permanent: true, direction: 'top' }).addTo(map);

        // Dodaj trasę między markerami
        if (routingControl) {
          map.removeControl(routingControl);
        }
          const plan = new L.Routing.Plan([
          L.latLng(startLat, startLon),
          L.latLng(endLat, endLon)
          ], {
          draggableWaypoints: false, // Wyłącz możliwość przeciągania punktów
          });

        routingControl = L.Routing.control({
          plan: plan,
          routeWhileDragging: false,
          show: false,
          // containerClassName: 'hidden',
          lineOptions: {
            styles: [{ color: 'blue', opacity: 0.6, weight: 4 }],
            addWaypoints: false
          }
        }).addTo(map);
        if (withDriverMarker) {
          routingControl.on('routesfound', function(e) {
          const routes = e.routes;
          if (routes.length > 0) {
            const route = routes[0];
            const distance = route.summary.totalDistance; // Długość trasy w metrach
            console.log('Długość trasy:', distance, 'metrów');
            const coordinates = route.coordinates;
            const middleIndex = Math.floor(coordinates.length / 2);
            const middlePoint = coordinates[middleIndex];
            marker1 = L.marker(middlePoint, {
              icon: L.divIcon({
              className: 'custom-icon',
              html: '<div style="background-color: red; width: 20px; height: 20px; border-radius: 10px"></div>',
              iconSize: [20, 20]
              })
            }).addTo(map);
          }
        });
        }
        else {
          routingControl.on('routesfound', function(e) {
          const routes = e.routes;
          if (routes.length > 0) {
            const route = routes[0];
            const distance = route.summary.totalDistance; // Długość trasy w metrach
            handlePriceCalculation(distance);
            //console.log('Długość trasy:', distance, 'metrów');
          }
        });
        }
        await dispatch('handleMapSuccess')
      } else {
       // callBackMapError()
        await dispatch('handleMapError')
        alert('Nie znaleziono współrzędnych dla podanych nazw ulic');
      }
    } catch (error) {
      console.error('Błąd podczas pobierania danych z usługi geokodowania:', error);
    }
  }

  // export function calculateDistance() {
  //   if (marker1 && marker2) {
  //     const distance = marker1.getLatLng().distanceTo(marker2.getLatLng());
  //     alert(`Odległość między markerami: ${distance.toFixed(2)} metrów`);
  //   } else {
  //     alert('Najpierw dodaj oba markery na mapie.');
  //   }
  // }
  </script>
  
  <style>
    /* #map {
      
    } */
    .leaflet-tooltip {
    background-color: rgba(255, 255, 255, 0.8);
    border: none;
    box-shadow: none;
    font-size: 12px;
    font-weight: bold;
  }

  .leaflet-tooltip-top::before {
    border-top-color: rgba(255, 255, 255, 0.8);
  }
  </style>
  
  <div id="map" class="w-full h-full z-0" class:rounded-md={rounded}></div>
  