import L from 'leaflet';
import 'leaflet.heat';

// Dark theme tiles (CartoDB Dark Matter)
const TILE_LAYER = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

export class MapEngine {
  constructor(elementId, options = {}) {
    this.map = L.map(elementId, {
      center: options.center || [14.5995, 120.9842], // Default to Manila
      zoom: options.zoom || 13,
      zoomControl: false
    });

    L.tileLayer(TILE_LAYER, {
      attribution: ATTRIBUTION,
      maxZoom: 19
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    this.heatLayer = L.heatLayer([], {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: {
        0.4: 'blue',
        0.6: 'cyan',
        0.7: 'lime',
        0.8: 'yellow',
        1.0: 'red'
      }
    }).addTo(this.map);

    this.markers = L.layerGroup().addTo(this.map);
  }

  updateHeatmap(reports) {
    const points = reports.map(r => [r.lat, r.lng, r.severity / 5]);
    this.heatLayer.setLatLngs(points);
  }

  addMarker(lat, lng, type, description) {
    const marker = L.circleMarker([lat, lng], {
      radius: 8,
      fillColor: this.getTypeColor(type),
      color: "#fff",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(this.markers);

    marker.bindPopup(`<strong>${type.toUpperCase()}</strong><br>${description}`);
    return marker;
  }

  getTypeColor(type) {
    const colors = {
      waste: '#f59e0b',
      noise: '#8b5cf6',
      infra: '#ef4444',
      water: '#3b82f6',
      air: '#10b981',
      other: '#94a3b8'
    };
    return colors[type] || colors.other;
  }

  toggleHeatmap(visible) {
    if (visible) {
      this.heatLayer.addTo(this.map);
    } else {
      this.map.removeLayer(this.heatLayer);
    }
  }

  onMapClick(callback) {
    this.map.on('click', (e) => {
      callback(e.latlng.lat, e.latlng.lng);
    });
  }
}
