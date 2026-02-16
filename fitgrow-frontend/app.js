// ===================================
// CONFIGURATION
// ===================================
const API_URL = 'https://fitgrow-backend-v3.onrender.com/api';

// ===================================
// APP STATE
// ===================================
let stream = null;
let baseMacroData = null;
let currentPortion = 1.0;
let currentUser = null;
let authToken = null;

// ===================================
// AUTHENTICATION
// ===================================

// Load auth from localStorage
function loadAuth() {
  authToken = localStorage.getItem('authToken');
  const userData = localStorage.getItem('userData');
  if (authToken && userData) {
    currentUser = JSON.parse(userData);
    updateUIForLoggedInUser();
  }
}

function updateUIForLoggedInUser() {
  const userName = document.getElementById('userName');
  const userStatus = document.querySelector('.user-status');
  const authBtn = document.getElementById('authBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (currentUser) {
    if (userName) userName.textContent = currentUser.username;
    if (userStatus) userStatus.textContent = 'Online - Synced';
    if (authBtn) authBtn.classList.add('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');
  } else {
    if (userName) userName.textContent = 'Guest';
    if (userStatus) userStatus.textContent = 'Offline Mode';
    if (authBtn) authBtn.classList.remove('hidden');
    if (logoutBtn) logoutBtn.classList.add('hidden');
  }
}

function showAuth() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('hidden');
}

function closeAuth() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.add('hidden');
  hideAuthError();
}

function toggleAuthMode(event) {
  event.preventDefault();
  const title = document.getElementById('authTitle');
  const submitBtn = document.getElementById('authSubmitBtn');
  const toggleText = document.getElementById('authToggleText');
  const usernameField = document.getElementById('authUsername');
  
  if (title.textContent === 'Login') {
    title.textContent = 'Sign Up';
    submitBtn.textContent = 'Sign Up';
    toggleText.textContent = 'Already have an account?';
    usernameField.classList.remove('hidden');
    submitBtn.onclick = signup;
  } else {
    title.textContent = 'Login';
    submitBtn.textContent = 'Login';
    toggleText.textContent = "Don't have an account?";
    usernameField.classList.add('hidden');
    submitBtn.onclick = login;
  }
}

async function login() {
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;

  if (!email || !password) {
    showAuthError('Please fill in all fields');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('userData', JSON.stringify(currentUser));
      updateUIForLoggedInUser();
      closeAuth();
      loadDashboardData();
    } else {
      showAuthError(data.message || 'Login failed');
    }
  } catch (error) {
    showAuthError('Network error. Please try again.');
    console.error('Login error:', error);
  }
}

async function signup() {
  const username = document.getElementById('authUsername').value;
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;

  if (!username || !email || !password) {
    showAuthError('Please fill in all fields');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (data.success) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('userData', JSON.stringify(currentUser));
      updateUIForLoggedInUser();
      closeAuth();
      loadDashboardData();
    } else {
      showAuthError(data.message || 'Signup failed');
    }
  } catch (error) {
    showAuthError('Network error. Please try again.');
    console.error('Signup error:', error);
  }
}

function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  updateUIForLoggedInUser();
  resetDashboard();
}

function showAuthError(message) {
  const errorEl = document.getElementById('authError');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  }
}

function hideAuthError() {
  const errorEl = document.getElementById('authError');
  if (errorEl) {
    errorEl.classList.add('hidden');
  }
}

// ===================================
// DASHBOARD & DATA SYNC
// ===================================

async function syncData() {
  if (!authToken) {
    alert('Please login first to sync data');
    return;
  }

  try {
    const stats = {
      calories: parseInt(document.getElementById('calories').textContent) || 0,
      steps: parseInt(document.getElementById('steps').textContent) || 0,
      water: parseFloat(document.getElementById('water').textContent) || 0,
      sleep: parseFloat(document.getElementById('sleep').textContent) || 0
    };

    if (stats.calories > 0) {
      await fetch(`${API_URL}/health/activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ type: 'calories', value: stats.calories })
      });
    }

    alert('Data synced successfully!');
  } catch (error) {
    alert('Failed to sync data');
    console.error('Sync error:', error);
  }
}

async function loadDashboardData() {
  if (!authToken) return;

  try {
    const response = await fetch(`${API_URL}/health/stats/daily`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();
    if (data.success) updateDashboard(data.stats);
  } catch (error) {
    console.error('Load data error:', error);
  }
}

function updateDashboard(stats) {
  if (stats.calories) {
    document.getElementById('calories').textContent = stats.calories;
    updateProgress('calories', stats.calories, 3000);
  }
  if (stats.steps) {
    document.getElementById('steps').textContent = stats.steps;
    updateProgress('steps', stats.steps, 10000);
  }
  if (stats.water) {
    document.getElementById('water').textContent = stats.water.toFixed(1) + 'L';
    updateProgress('water', stats.water, 2.5);
  }
  if (stats.sleep) {
    document.getElementById('sleep').textContent = stats.sleep.toFixed(1) + 'h';
    updateProgress('sleep', stats.sleep, 8);
  }
}

function updateProgress(type, value, goal) {
  const progressBar = document.getElementById(type + 'Progress');
  if (progressBar) {
    const percentage = Math.min((value / goal) * 100, 100);
    progressBar.style.width = percentage + '%';
  }
}

function resetDashboard() {
  document.getElementById('calories').textContent = '0';
  document.getElementById('steps').textContent = '0';
  document.getElementById('water').textContent = '0.0L';
  document.getElementById('sleep').textContent = '0.0h';
  
  ['calories', 'steps', 'water', 'sleep'].forEach(type => {
    document.getElementById(type + 'Progress').style.width = '0%';
  });
}

function showQuickAdd(type) {
  const values = { calories: 100, steps: 1000, water: 0.5, sleep: 1 };
  const currentEl = document.getElementById(type);
  if (!currentEl) return;

  let current = parseFloat(currentEl.textContent) || 0;
  current += values[type];

  if (type === 'water') {
    currentEl.textContent = current.toFixed(1) + 'L';
  } else if (type === 'sleep') {
    currentEl.textContent = current.toFixed(1) + 'h';
  } else {
    currentEl.textContent = Math.round(current);
  }

  const goals = { calories: 3000, steps: 10000, water: 2.5, sleep: 8 };
  updateProgress(type, current, goals[type]);
}

function resetDay() {
  if (confirm('Reset all today\'s data? This cannot be undone.')) {
    resetDashboard();
  }
}

// ===================================
// NAVIGATION
// ===================================

function navigateTo(pageName) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  const targetPage = document.getElementById(pageName + 'Page');
  if (targetPage) targetPage.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.page === pageName) item.classList.add('active');
  });

  if (pageName !== 'scanner') stopCamera();
}

function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.page));
  });

  document.querySelectorAll('.action-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });
}

// ===================================
// CAMERA & FOOD SCANNER
// ===================================

async function startCamera() {
  try {
    hideError();
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });

    const video = document.getElementById('video');
    if (video) {
      video.srcObject = stream;
      showScreen('cameraScreen');
    }
  } catch (err) {
    showError('Camera access denied. Please allow camera permissions.');
    console.error('Camera error:', err);
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
}

function capturePhoto() {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  if (!video || !canvas) return;

  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0);

  const imageData = canvas.toDataURL('image/jpeg', 0.8);
  stopCamera();
  analyzeFood(imageData);
}

async function analyzeFood(imageBase64) {
  showScreen('analyzingScreen');
  hideError();

  try {
    const base64Data = imageBase64.split(',')[1];
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64Data } },
            { type: "text", text: `Analyze this food image and provide nutritional information. Return ONLY a JSON object:
{"foodName": "name", "servingSize": "size", "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number, "sugar": number, "sodium": number}` }
          ]
        }]
      })
    });

    const data = await response.json();
    const textContent = data.content.find(c => c.type === 'text')?.text || '';
    const macroData = JSON.parse(textContent.replace(/```json|```/g, '').trim());
    displayResults(imageBase64, macroData);
  } catch (err) {
    showError('Failed to analyze food. Please try again.');
    console.error('Analysis error:', err);
    showScreen('startScreen');
  }
}

function displayResults(imageData, data) {
  baseMacroData = { ...data };
  currentPortion = 1.0;

  const portionSlider = document.getElementById('portionSlider');
  if (portionSlider) portionSlider.value = 100;

  document.getElementById('portionMultiplier').textContent = '1x';
  document.getElementById('sliderValue').textContent = '100%';

  document.querySelectorAll('.portion-btn').forEach(btn => {
    btn.classList.toggle('active', parseFloat(btn.dataset.portion) === 1);
  });

  document.getElementById('capturedImage').src = imageData;
  document.getElementById('foodName').textContent = data.foodName;
  document.getElementById('servingSize').textContent = data.servingSize;

  updateNutritionalValues();
  showScreen('resultsScreen');
}

async function logScannedFood() {
  if (!authToken) {
    alert('Please login to log food');
    return;
  }

  if (!baseMacroData) return;

  try {
    await fetch(`${API_URL}/nutrition/meal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        foodName: baseMacroData.foodName,
        servingSize: baseMacroData.servingSize,
        calories: Math.round(baseMacroData.calories * currentPortion),
        protein: Math.round(baseMacroData.protein * currentPortion),
        carbs: Math.round(baseMacroData.carbs * currentPortion),
        fat: Math.round(baseMacroData.fat * currentPortion),
        fiber: Math.round(baseMacroData.fiber * currentPortion),
        sugar: Math.round(baseMacroData.sugar * currentPortion),
        sodium: Math.round(baseMacroData.sodium * currentPortion)
      })
    });

    alert('Food logged successfully!');
    resetScan();
  } catch (error) {
    alert('Failed to log food');
    console.error('Log food error:', error);
  }
}

function updateNutritionalValues() {
  if (!baseMacroData) return;

  document.getElementById('scanCalories').textContent = Math.round(baseMacroData.calories * currentPortion);
  document.getElementById('scanProtein').textContent = Math.round(baseMacroData.protein * currentPortion) + 'g';
  document.getElementById('scanCarbs').textContent = Math.round(baseMacroData.carbs * currentPortion) + 'g';
  document.getElementById('scanFat').textContent = Math.round(baseMacroData.fat * currentPortion) + 'g';
  document.getElementById('scanFiber').textContent = Math.round(baseMacroData.fiber * currentPortion) + 'g';
  document.getElementById('scanSugar').textContent = Math.round(baseMacroData.sugar * currentPortion) + 'g';
  document.getElementById('scanSodium').textContent = Math.round(baseMacroData.sodium * currentPortion) + 'mg';
}

function setPortionPreset(multiplier) {
  currentPortion = multiplier;
  document.getElementById('portionSlider').value = multiplier * 100;

  document.querySelectorAll('.portion-btn').forEach(btn => {
    btn.classList.toggle('active', parseFloat(btn.dataset.portion) === multiplier);
  });

  updatePortionDisplay();
}

function updatePortionSlider(value) {
  currentPortion = value / 100;
  document.querySelectorAll('.portion-btn').forEach(btn => btn.classList.remove('active'));
  updatePortionDisplay();
}

function updatePortionDisplay() {
  document.getElementById('portionMultiplier').textContent = currentPortion.toFixed(1) + 'x';
  document.getElementById('sliderValue').textContent = Math.round(currentPortion * 100) + '%';
  updateNutritionalValues();
}

function resetScan() {
  showScreen('startScreen');
  hideError();
  baseMacroData = null;
  currentPortion = 1.0;
}

function showScreen(screenId) {
  ['startScreen', 'cameraScreen', 'analyzingScreen', 'resultsScreen'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
  document.getElementById(screenId).classList.remove('hidden');
}

function showError(message) {
  const errorEl = document.getElementById('errorMessage');
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
}

function hideError() {
  document.getElementById('errorMessage').classList.add('hidden');
}

// ===================================
// EVENT LISTENERS
// ===================================

function initScanner() {
  document.getElementById('startCameraBtn')?.addEventListener('click', startCamera);
  document.getElementById('captureBtn')?.addEventListener('click', capturePhoto);
  document.getElementById('resetScanBtn')?.addEventListener('click', resetScan);

  document.querySelectorAll('.portion-btn').forEach(btn => {
    btn.addEventListener('click', () => setPortionPreset(parseFloat(btn.dataset.portion)));
  });

  document.getElementById('portionSlider')?.addEventListener('input', (e) => {
    updatePortionSlider(e.target.value);
  });
}

// ===================================
// INITIALIZATION
// ===================================

function initApp() {
  initNavigation();
  initScanner();
  loadAuth();
  
  if (authToken) loadDashboardData();
  
  console.log('FitTrack App Initialized');
  console.log('Backend:', API_URL);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

window.addEventListener('beforeunload', () => stopCamera());
