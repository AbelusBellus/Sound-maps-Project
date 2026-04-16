// ==================== КОНФИГУРАЦИЯ ====================
const ADMIN_PASSWORD = 'INFJ';
const ADMIN_PASSWORD_HASH = CryptoJS.MD5(ADMIN_PASSWORD).toString();

// Границы Подольска
const CITY_BOUNDS = L.latLngBounds([55.62, 37.50], [55.85, 37.82]);

// Цвета для оверлеев
const PHASE_COLORS = {
    morning: { map: 'rgba(255, 140, 0, 0.15)', global: 'rgba(255, 140, 0, 0.05)' },
    day:     { map: 'rgba(255, 255, 200, 0.1)', global: 'rgba(0, 0, 0, 0)' },
    evening: { map: 'rgba(255, 69, 0, 0.2)',   global: 'rgba(255, 69, 0, 0.07)' },
    night:   { map: 'rgba(0, 0, 50, 0.5)',     global: 'rgba(0, 0, 30, 0.15)' }
};

const TRANSITION_DURATION = 5000;

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let map;
let markers = [];
let allMarkersData = [];
let currentPhase = 'day';
let isAdmin = false;
let noiseEnabled = false;
let noiseLayer;
let mapTintDiv;
let globalTintDiv;
let currentAudio = null; // для остановки звука

// ==================== ИНИЦИАЛИЗАЦИЯ КАРТЫ ====================
function initMap() {
    map = L.map('map', {
        maxBounds: CITY_BOUNDS,
        maxBoundsViscosity: 1.0,
        minZoom: 13,
        maxZoom: 16
    }).setView([55.751244, 37.618423], 11);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CartoDB',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    mapTintDiv = L.DomUtil.create('div', 'map-tint-overlay');
    mapTintDiv.id = 'map-tint';
    map.getContainer().appendChild(mapTintDiv);
    mapTintDiv.style.position = 'absolute';
    mapTintDiv.style.top = '0';
    mapTintDiv.style.left = '0';
    mapTintDiv.style.pointerEvents = 'none';
    mapTintDiv.style.transition = `background-color ${TRANSITION_DURATION}ms ease`;

    const updateTintSize = () => {
        const container = map.getContainer();
        const rect = container.getBoundingClientRect();
        mapTintDiv.style.width = rect.width + 'px';
        mapTintDiv.style.height = rect.height + 'px';
    };
    map.on('moveend zoomend', updateTintSize);
    setTimeout(updateTintSize, 100);
}

// ==================== РАБОТА С ХРАНИЛИЩЕМ ====================
function loadMarkersFromStorage() {
    const stored = localStorage.getItem('moscowMarkers');
    if (stored) {
        allMarkersData = JSON.parse(stored);
        allMarkersData.forEach(m => {
            if (!m.noiseParams) {
                m.noiseParams = {
                    radius: Math.random() * 200 + 50,
                    color: `hsla(${Math.random() * 360}, 70%, 60%, 0.5)`
                };
            }
        });
        saveMarkersToStorage();
    } else {
       allMarkersData = [
    { lat: 55.7558, lng: 37.6173, title: 'Красная площадь', soundUrl: 'Sounds/Elpankotka.mp3', phase: 'day', noiseParams: { radius: 150, color: 'hsla(0, 70%, 60%, 0.5)' } },
    { lat: 55.7512, lng: 37.6184, title: 'Центр Москвы', soundUrl: 'Sounds/Elpankotka.mp3', phase: 'day', noiseParams: { radius: 130, color: 'hsla(30, 70%, 60%, 0.5)' } },
    { lat: 55.7340, lng: 37.5880, title: 'Парк Горького', soundUrl: 'Sounds/Elpankotka.mp3', phase: 'evening', noiseParams: { radius: 180, color: 'hsla(80, 70%, 60%, 0.5)' } },
    { lat: 55.7600, lng: 37.6400, title: 'Ночной клуб', soundUrl: 'Sounds/Elpankotka.mp3', phase: 'night', noiseParams: { radius: 100, color: 'hsla(260, 70%, 60%, 0.5)' } },
    { lat: 55.7890, lng: 37.6300, title: 'Ботанический сад', soundUrl: 'Sounds/Elpankotka.mp3', phase: 'morning', noiseParams: { radius: 140, color: 'hsla(120, 70%, 60%, 0.5)' } },
    { lat: 55.7100, lng: 37.5600, title: 'Воробьёвы горы', soundUrl: 'Sounds/Elpankotka.mp3', phase: 'evening', noiseParams: { radius: 160, color: 'hsla(40, 70%, 60%, 0.5)' } }
];
        saveMarkersToStorage();
    }
}

function saveMarkersToStorage() {
    localStorage.setItem('moscowMarkers', JSON.stringify(allMarkersData));
}

// ==================== ШУМОВЫЕ КРУГИ С АНИМАЦИЕЙ ====================
function generateRandomNoiseParams() {
    return {
        radius: Math.random() * 200 + 50,
        color: `hsla(${Math.random() * 360}, 70%, 60%, 0.5)`
    };
}

// Функция создания круга без анимации радиуса (только CSS-пульсация)
function createNoiseShape(markerData) {
    const params = markerData.noiseParams;
    if (!params) return null;
    const circle = L.circle([markerData.lat, markerData.lng], {
        radius: params.radius,
        color: params.color,
        weight: 1,
        fillOpacity: 0.3,
        className: 'noise-circle'
    });
    return { circle, radius: params.radius, color: params.color };
}

function animateCircleAppearance(circleObj, duration = 300) {
    const startRadius = 0;
    const endRadius = circleObj.radius;
    const startTime = performance.now();
    const step = (now) => {
        const elapsed = now - startTime;
        let t = Math.min(1, elapsed / duration);
        const currentRadius = startRadius + (endRadius - startRadius) * t;
        circleObj.circle.setRadius(currentRadius);
        if (t < 1) {
            requestAnimationFrame(step);
        } else {
            circleObj.circle.setRadius(endRadius);
        }
    };
    requestAnimationFrame(step);
}

function animateCircleDisappearance(circleObj, duration = 300, onComplete) {
    const startRadius = circleObj.circle.getRadius();
    const endRadius = 0;
    const startTime = performance.now();
    const step = (now) => {
        const elapsed = now - startTime;
        let t = Math.min(1, elapsed / duration);
        const currentRadius = startRadius + (endRadius - startRadius) * t;
        circleObj.circle.setRadius(currentRadius);
        if (t < 1) {
            requestAnimationFrame(step);
        } else {
            if (onComplete) onComplete();
        }
    };
    requestAnimationFrame(step);
}

// ==================== МАРКЕРЫ ====================
function getMarkerIcon(phase) {
    const colors = {
        morning: '#fd981c',
        day: '#fff0d9',
        evening: '#c96813',
        night: '#214364'
    };
    const color = colors[phase] || '#2c3e50';
    return L.divIcon({
        html: `<div style="background: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
        iconSize: [24, 24],
        className: 'custom-marker-icon'
    });
}

// Функция остановки звука
function stopCurrentAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
}

function addMarkerToMap(markerData) {
    const icon = getMarkerIcon(markerData.phase);
    const marker = L.marker([markerData.lat, markerData.lng], { icon }).addTo(map);
    const popupContent = `<strong>${markerData.title || 'Без названия'}</strong><br>${markerData.lat.toFixed(6)}, ${markerData.lng.toFixed(6)}`;
    marker.bindPopup(popupContent);
    
    // Обработчик клика с остановкой предыдущего звука
    marker.on('click', () => {
        stopCurrentAudio(); // остановить любой текущий звук
        if (markerData.soundUrl) {
            const audio = new Audio(markerData.soundUrl);
            currentAudio = audio;
            audio.play().catch(e => console.warn(e));
            audio.onended = () => {
                if (currentAudio === audio) currentAudio = null;
            };
        } else {
            alert('Звук не задан');
        }
    });

    let noiseShape = null;
    if (noiseEnabled) {
        const shapeObj = createNoiseShape(markerData);
        if (shapeObj) {
            noiseShape = shapeObj;
            shapeObj.circle.addTo(noiseLayer);
            animateCircleAppearance(shapeObj, 400);
        }
    }
    markers.push({ marker, data: markerData, noiseShape });
}

function refreshMarkers() {
    // Останавливаем звук при смене маркеров (смена фазы)
    stopCurrentAudio();
    
    markers.forEach(item => {
        map.removeLayer(item.marker);
        if (item.noiseShape) {
            map.removeLayer(item.noiseShape.circle);
        }
    });
    markers = [];
    if (noiseLayer) noiseLayer.clearLayers();

    const filtered = allMarkersData.filter(m => m.phase === currentPhase);
    filtered.forEach(data => addMarkerToMap(data));
}

// ==================== ФАЗЫ ВРЕМЕНИ ====================
function setPhase(phase) {
    if (phase === currentPhase) return;
    currentPhase = phase;

    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.classList.remove('active-morning', 'active-day', 'active-evening', 'active-night');
        if (btn.dataset.phase === phase) btn.classList.add(`active-${phase}`);
    });

    if (mapTintDiv) mapTintDiv.style.backgroundColor = PHASE_COLORS[phase].map;
    if (globalTintDiv) globalTintDiv.style.backgroundColor = PHASE_COLORS[phase].global;

    refreshMarkers();
}

function detectPhaseByTime() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 10) return 'morning';
    if (hour >= 10 && hour < 18) return 'day';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
}

// ==================== АДМИНИСТРИРОВАНИЕ ====================
function showAdminPanel(show) {
    const panel = document.getElementById('adminPanel');
    if (panel) panel.style.display = show ? 'block' : 'none';
    if (show) renderMarkersList();
}

function renderMarkersList() {
    const container = document.getElementById('markersList');
    if (!container) return;
    container.innerHTML = '<h4>Все маркеры</h4>';
    allMarkersData.forEach((m, idx) => {
        const div = document.createElement('div');
        div.innerHTML = `
            <span><strong>${m.title}</strong> (${m.lat}, ${m.lng}) [${m.phase}] → ${m.soundUrl}</span>
            <button onclick="deleteMarker(${idx})">🗑️</button>
        `;
        container.appendChild(div);
    });
}

window.deleteMarker = function(index) {
    if (!isAdmin) { alert('Нет прав'); return; }
    if (confirm('Удалить маркер?')) {
        allMarkersData.splice(index, 1);
        saveMarkersToStorage();
        refreshMarkers();
        renderMarkersList();
    }
};

function addMarker(lat, lng, title, soundUrl, phase) {
    if (!isAdmin) { alert('Нет прав'); return; }
    const noiseParams = generateRandomNoiseParams();
    const newMarker = { lat, lng, title, soundUrl, phase, noiseParams };
    allMarkersData.push(newMarker);
    saveMarkersToStorage();
    refreshMarkers();
    renderMarkersList();
    console.log('Маркер добавлен', newMarker);
}

function clearAllMarkers() {
    if (!isAdmin) return;
    if (confirm('Удалить все маркеры?')) {
        allMarkersData = [];
        saveMarkersToStorage();
        refreshMarkers();
        renderMarkersList();
    }
}

function setupMapClick() {
    if (!map) return;
    map.on('click', (e) => {
        if (!isAdmin) {
            alert('Авторизуйтесь для добавления маркеров (невидимая кнопка в левом нижнем углу, пароль INFJ)');
            return;
        }
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        const title = prompt('Название места:', 'Новый маркер');
        if (!title) return;
        const soundUrl = prompt('Путь к звуку (например, Sounds/example.mp3):', 'Sounds/');
        if (!soundUrl) return;
        let phase = prompt('Фаза (morning/day/evening/night):', currentPhase);
        if (!['morning', 'day', 'evening', 'night'].includes(phase)) phase = currentPhase;
        addMarker(lat, lng, title, soundUrl, phase);
    });
}

// ==================== АВТОРИЗАЦИЯ ====================
function checkAuth() {
    const storedHash = sessionStorage.getItem('adminHashPodolsk');
    if (storedHash && storedHash === ADMIN_PASSWORD_HASH) {
        isAdmin = true;
        showAdminPanel(true);
        return true;
    }
    return false;
}

function login() {
    const pwd = prompt('Введите пароль администратора:');
    if (!pwd) return;
    const hash = CryptoJS.MD5(pwd).toString();
    if (hash === ADMIN_PASSWORD_HASH) {
        sessionStorage.setItem('adminHashPodolsk', hash);
        isAdmin = true;
        showAdminPanel(true);
        alert('Добро пожаловать, администратор!');
    } else {
        alert('Неверный пароль');
    }
}

function logout() {
    sessionStorage.removeItem('adminHashPodolsk');
    isAdmin = false;
    showAdminPanel(false);
    alert('Вы вышли');
}

// ==================== NOISE MAP ====================
function initNoiseLayer() {
    noiseLayer = L.layerGroup().addTo(map);
}

function toggleNoiseMap() {
    noiseEnabled = !noiseEnabled;
    const btn = document.getElementById('noiseMapBtn');
    btn.classList.toggle('active');

    if (noiseEnabled) {
        markers.forEach(item => {
            if (!item.noiseShape) {
                const shapeObj = createNoiseShape(item.data);
                if (shapeObj) {
                    item.noiseShape = shapeObj;
                    shapeObj.circle.addTo(noiseLayer);
                }
            } else {
                item.noiseShape.circle.addTo(noiseLayer);
            }
        });
    } else {
        noiseLayer.clearLayers();
        markers.forEach(item => { if (item.noiseShape) item.noiseShape = null; });
    }
}


// ==================== ЗАПУСК ====================
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadMarkersFromStorage();
    checkAuth();
    initNoiseLayer();

    globalTintDiv = document.getElementById('globalTint');
    const initialPhase = detectPhaseByTime();
    setPhase(initialPhase);

    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            setPhase(e.currentTarget.dataset.phase);
        });
    });

    const authBtn = document.getElementById('invisibleAuthBtn');
    if (authBtn) {
        authBtn.addEventListener('click', () => {
            if (isAdmin) logout();
            else login();
        });
    }

    const clearBtn = document.getElementById('clearMarkersBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearAllMarkers);

    const noiseBtn = document.getElementById('noiseMapBtn');
    if (noiseBtn) noiseBtn.addEventListener('click', toggleNoiseMap);

    const titleElem = document.querySelector('.title');
    if (titleElem) {
        titleElem.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    setupMapClick();
    if (mapTintDiv) mapTintDiv.style.pointerEvents = 'none';
});