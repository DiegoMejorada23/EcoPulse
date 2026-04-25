import './style.css';
import { MapEngine } from './map-engine';
import { store } from './store';

// State
let currentCoords = null;
let heatmapVisible = true;

// UI Elements
const sidebar = document.getElementById('sidebar');
const reportFormContainer = document.getElementById('report-form-container');
const reportForm = document.getElementById('report-form');
const reportsList = document.getElementById('reports-list');
const totalReportsEl = document.getElementById('total-reports');
const hotspotCountEl = document.getElementById('hotspot-count');
const displayCoords = document.getElementById('display-coords');
const closeFormBtn = document.getElementById('close-form');
const toggleHeatmapBtn = document.getElementById('toggle-heatmap');
const mainReportBtn = document.getElementById('main-report-btn');
const toast = document.getElementById('toast');
const photoInput = document.getElementById('photo-upload');

// Initialize Map
const engine = new MapEngine('map');

// Initial Load
function init() {
  const reports = store.getReports();
  updateUI(reports);
  
  // Register Map Click
  engine.onMapClick((lat, lng) => {
    currentCoords = { lat, lng };
    showForm(lat, lng);
  });

  mainReportBtn.addEventListener('click', () => {
    showToast('Click anywhere on the map to set the problem location.');
  });
}

function updateUI(reports) {
  // Update Stats
  const stats = store.getStats();
  totalReportsEl.textContent = stats.total;
  hotspotCountEl.textContent = Math.ceil(stats.total / 3); // Simple heuristic

  // Update Heatmap
  engine.updateHeatmap(reports);

  // Update Markers
  engine.markers.clearLayers();
  reports.forEach(r => {
    engine.addMarker(r);
  });

  // Update List
  renderList(reports);
}

function renderList(reports) {
  if (reports.length === 0) {
    reportsList.innerHTML = '<li class="empty-state">No reports yet. Click the map to start.</li>';
    return;
  }

  const sorted = [...reports].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  reportsList.innerHTML = sorted.slice(0, 5).map(r => `
    <li class="report-item ${r.type}">
      <strong>${r.type.charAt(0).toUpperCase() + r.type.slice(1)}</strong>
      <p>${r.description.substring(0, 40)}${r.description.length > 40 ? '...' : ''}</p>
      <small>${new Date(r.timestamp).toLocaleTimeString()}</small>
    </li>
  `).join('');
}

function showForm(lat, lng) {
  displayCoords.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  reportFormContainer.classList.remove('hidden');
}

function hideForm() {
  reportFormContainer.classList.add('hidden');
  reportForm.reset();
  currentCoords = null;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Event Listeners
closeFormBtn.addEventListener('click', hideForm);

reportForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!currentCoords) {
    showToast('Error: Please select a location on the map first.');
    return;
  }

  const file = photoInput.files[0];
  let photoBase64 = null;
  
  if (file) {
    try {
      // Limit file size to ~1MB to avoid LocalStorage limits
      if (file.size > 1024 * 1024) {
        showToast('Image is too large. Please use an image under 1MB.');
        return;
      }
      photoBase64 = await fileToBase64(file);
    } catch (err) {
      console.error('File upload error:', err);
    }
  }

  const formData = {
    type: document.getElementById('issue-type').value,
    severity: parseInt(document.getElementById('severity').value),
    description: document.getElementById('description').value,
    photo: photoBase64,
    lat: currentCoords.lat,
    lng: currentCoords.lng
  };

  try {
    store.saveReport(formData);
    updateUI(store.getReports());
    hideForm();
    showToast('Report submitted successfully!');
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      showToast('Storage full! Try a smaller photo or clear reports.');
    } else {
      showToast('Failed to save report.');
    }
  }
});

toggleHeatmapBtn.addEventListener('click', () => {
  heatmapVisible = !heatmapVisible;
  engine.toggleHeatmap(heatmapVisible);
  toggleHeatmapBtn.textContent = heatmapVisible ? 'Hide Heatmap' : 'Show Heatmap';
});

// Start App
init();
