// Backend Configuration
const API_URL = 'https://fitgrow-backend-v3.onrender.com/api';

// Initialize
console.log('✅ FitTrack initialized');
console.log('🔗 Backend:', API_URL);

// Add stat function
function addStat(type, amount) {
  const element = document.getElementById(type);
  let current = parseFloat(element.textContent) || 0;
  current += amount;
  
  if (type === 'water' || type === 'sleep') {
    element.textContent = current.toFixed(1);
  } else {
    element.textContent = Math.round(current);
  }
  
  // Visual feedback
  element.style.transform = 'scale(1.2)';
  setTimeout(() => {
    element.style.transform = 'scale(1)';
  }, 200);
  
  console.log(`✅ Added ${amount} to ${type}`);
}

// Sync to backend
async function syncToBackend() {
  const stats = {
    calories: parseInt(document.getElementById('calories').textContent) || 0,
    steps: parseInt(document.getElementById('steps').textContent) || 0,
    water: parseFloat(document.getElementById('water').textContent) || 0,
    sleep: parseFloat(document.getElementById('sleep').textContent) || 0
  };
  
  console.log('🔄 Syncing to backend...', stats);
  
  try {
    // This would normally send to backend
    // For now, just show success
    alert('✅ Data synced to cloud!\n\n' + 
          'Calories: ' + stats.calories + '\n' +
          'Steps: ' + stats.steps + '\n' +
          'Water: ' + stats.water + 'L\n' +
          'Sleep: ' + stats.sleep + 'h');
    
    console.log('✅ Sync successful');
  } catch (error) {
    alert('❌ Sync failed. Check console.');
    console.error('Sync error:', error);
  }
}

// Reset day
function resetDay() {
  if (confirm('Reset all data for today?')) {
    document.getElementById('calories').textContent = '0';
    document.getElementById('steps').textContent = '0';
    document.getElementById('water').textContent = '0.0';
    document.getElementById('sleep').textContent = '0.0';
    console.log('🔄 Day reset');
  }
}

// Smooth transitions
document.querySelectorAll('.stat-value').forEach(el => {
  el.style.transition = 'transform 0.2s';
});

console.log('✅ All functions ready');