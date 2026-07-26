// ==================== КОНФИГУРАЦИЯ ====================
const ADMIN_PASSWORD = 'INFJ';
const ADMIN_PASSWORD_HASH = CryptoJS.MD5(ADMIN_PASSWORD).toString();

const CITY_BOUNDS = L.latLngBounds([55.36, 37.45], [55.47, 37.62]);
// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let map;
let markers = [];
let allMarkersData = [];
let isAdmin = false;
let noiseEnabled = false;
let noiseLayer;
let currentAudio = null;
let isPlaying = false;

let infoPanel, coordinateSpan, locationSpan, timeSlider, volumeSlider, playPauseBtn;

// Определяем iOS
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Если iOS, добавляем класс на body
if (isIOS()) {
    document.body.classList.add('ios-device');
}
// ==================== ИНИЦИАЛИЗАЦИЯ КАРТЫ ====================
function initMap() {
    map = L.map('map', {
        maxBounds: CITY_BOUNDS,
        maxBoundsViscosity: 1.0,
        minZoom: 13,
        maxZoom: 16
    }).setView([55.4246, 37.5547], 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CartoDB',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
}

// ==================== РАБОТА С ХРАНИЛИЩЕМ ====================
// ========== FIREBASE ==========
let dbRef = database.ref('markers/podolsk');

// Загрузка маркеров из Firebase
function loadMarkersFromFirebase() {
    dbRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data && Array.isArray(data) && data.length > 0) {
            allMarkersData = data;
            // Добавляем недостающие noiseParams (если их нет)
            allMarkersData.forEach(m => {
                if (!m.noiseParams) {
                    m.noiseParams = {
                        radius: Math.random() * 200 + 50,
                        color: `hsla(${Math.random() * 360}, 70%, 60%, 0.5)`
                    };
                }
            });
        } else {
            // Если данных нет – создаём начальные маркеры и сохраняем их
            allMarkersData = getDefaultMarkers();
            saveMarkersToFirebase();
        }
        refreshMarkers();
    }, (error) => {
        console.error('Ошибка загрузки данных из Firebase:', error);
        // В случае ошибки загружаем начальные маркеры локально
        allMarkersData = getDefaultMarkers();
        refreshMarkers();
    });
}

// Сохранение маркеров в Firebase
function saveMarkersToFirebase() {
    dbRef.set(allMarkersData)
        .then(() => console.log('Маркеры сохранены в Firebase'))
        .catch((error) => console.error('Ошибка сохранения:', error));
}

// Функция с начальными маркерами (ваш массив)
function getDefaultMarkers() {
    return [
        // ваш список маркеров (скопируйте из старого кода)
        { lat: 55.433056, lng: 37.563611, title: 'Екатерининский сквер', soundUrl: 'Sounds/ZOOM0012_TrLR.WAV', phase: 'day', noiseParams: { radius: 120, color: 'hsla(200, 70%, 60%, 0.5)' } },
        // ... и так далее
    ];
}

// ==================== ШУМОВЫЕ КРУГИ ====================
function generateRandomNoiseParams() {
    return {
        radius: Math.random() * 200 + 50,
        color: `hsla(${Math.random() * 360}, 70%, 60%, 0.5)`
    };
}

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
        if (t < 1) requestAnimationFrame(step);
        else circleObj.circle.setRadius(endRadius);
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
        if (t < 1) requestAnimationFrame(step);
        else if (onComplete) onComplete();
    };
    requestAnimationFrame(step);
}

// ==================== МАРКЕРЫ ====================
function getMarkerIcon() {
    const color = '#fff0d9';
    return L.divIcon({
        html: `<div style="background: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
        iconSize: [24, 24],
        className: 'custom-marker-icon'
    });
}

function stopCurrentAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
        isPlaying = false;
if (playPauseBtn) {
    playPauseBtn.classList.remove('play');
    playPauseBtn.classList.add('pause');
}        if (timeSlider) timeSlider.value = 0;
    }
}

// ==================== ФУНКЦИИ ДЛЯ ПАНЕЛИ ПЛЕЕРА ====================
function updateInfoPanel(markerData) {
    if (!infoPanel) {
        console.warn('infoPanel не найден');
        return;
    }
    coordinateSpan.textContent = `${markerData.lat.toFixed(6)}, ${markerData.lng.toFixed(6)}`;
    locationSpan.textContent = markerData.title || 'Без названия';
    infoPanel.style.display = 'block';
    console.log('Плеер отображён');
    // Прокрутка к плееру с центрированием
    setTimeout(() => {
        infoPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
}

function syncTimeSlider() {
    if (currentAudio && !isNaN(currentAudio.duration) && isFinite(currentAudio.duration)) {
        const percent = (currentAudio.currentTime / currentAudio.duration) * 100;
        if (timeSlider) timeSlider.value = percent;
    }
}

function syncVolumeSlider() {
    if (currentAudio && volumeSlider) {
        volumeSlider.value = currentAudio.volume;
    }
}

function bindAudioEvents(audio) {
    audio.addEventListener('timeupdate', syncTimeSlider);
    audio.addEventListener('ended', () => {
        if (timeSlider) timeSlider.value = 0;
if (playPauseBtn) {
    playPauseBtn.classList.remove('play');
    playPauseBtn.classList.add('pause');
}        isPlaying = false;
        currentAudio = null;
    });
    if (volumeSlider) {
        audio.volume = parseFloat(volumeSlider.value);
    }
}

// ==================== ДОБАВЛЕНИЕ МАРКЕРА ====================
function addMarkerToMap(markerData) {
    const icon = getMarkerIcon();
    const marker = L.marker([markerData.lat, markerData.lng], { icon }).addTo(map);
    const popupContent = `<strong>${markerData.title || 'Без названия'}</strong><br>${markerData.lat.toFixed(6)}, ${markerData.lng.toFixed(6)}`;
    marker.bindPopup(popupContent);

    marker.on('click', () => {
        stopCurrentAudio();
        if (markerData.soundUrl) {
            const audio = new Audio(markerData.soundUrl);
            currentAudio = audio;
            bindAudioEvents(audio);
            updateInfoPanel(markerData); // <<-- теперь панель появляется
            audio.play().then(() => {
                isPlaying = true;
if (playPauseBtn) {
    playPauseBtn.classList.remove('pause');
    playPauseBtn.classList.add('play');
}            }).catch(e => console.warn('Play error:', e));
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
    stopCurrentAudio();
    if (infoPanel) infoPanel.style.display = 'none';

    markers.forEach(item => {
        map.removeLayer(item.marker);
        if (item.noiseShape) map.removeLayer(item.noiseShape.circle);
    });
    markers = [];
    if (noiseLayer) noiseLayer.clearLayers();

    allMarkersData.forEach(data => addMarkerToMap(data));
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
            <span><strong>${m.title}</strong> (${m.lat}, ${m.lng}) → ${m.soundUrl}</span>
            <button onclick="deleteMarker(${idx})">🗑️</button>
        `;
        container.appendChild(div);
    });
}

window.deleteMarker = function(index) {
    if (!isAdmin) { alert('Нет прав'); return; }
    if (confirm('Удалить маркер?')) {
        allMarkersData.splice(index, 1);
        saveMarkersToFirebase();
        refreshMarkers();
        renderMarkersList();
    }
};

function addMarker(lat, lng, title, soundUrl) {
    if (!isAdmin) { alert('Нет прав'); return; }
    const noiseParams = generateRandomNoiseParams();
    const newMarker = { lat, lng, title, soundUrl, phase: 'day', noiseParams };
    allMarkersData.push(newMarker);
    saveMarkersToFirebase();
    refreshMarkers();
    renderMarkersList();
    console.log('Маркер добавлен', newMarker);
}

function clearAllMarkers() {
    if (!isAdmin) return;
    if (confirm('Удалить все маркеры?')) {
        allMarkersData = [];
        saveMarkersToFirebase();
        refreshMarkers();
        renderMarkersList();
    }
}

function setupMapClick() {
    if (!map) return;
    map.on('click', (e) => {
        if (!isAdmin) {
            alert('Добавление маркеров доступно только администратору.');
            return;
        }
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        const title = prompt('Название места:', 'Новый маркер');
        if (!title) return;
        const soundUrl = prompt('Путь к звуку (например, Sounds/example.mp3):', 'Sounds/');
        if (!soundUrl) return;
        addMarker(lat, lng, title, soundUrl);
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

// ==================== ОБРАБОТЧИКИ ПЛЕЕРА ====================
function initPlayerControls() {
    infoPanel = document.getElementById('infoPanel');
    coordinateSpan = document.getElementById('coordinateValue');
    locationSpan = document.getElementById('locationValue');
    timeSlider = document.getElementById('timeSlider');
    volumeSlider = document.getElementById('volumeSlider');
    playPauseBtn = document.getElementById('playPauseBtn');

    if (playPauseBtn) {
    playPauseBtn.classList.add('pause');
}

    if (!infoPanel) console.warn('infoPanel не найден в DOM');

    if (timeSlider) {
        timeSlider.addEventListener('input', (e) => {
            if (currentAudio && !isNaN(currentAudio.duration)) {
                const seekTime = (e.target.value / 100) * currentAudio.duration;
                currentAudio.currentTime = seekTime;
            }
        });
    }
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            if (currentAudio) {
                currentAudio.volume = parseFloat(e.target.value);
            }
        });
    }
    if (playPauseBtn) {
    playPauseBtn.addEventListener('click', () => {
        if (currentAudio) {
            if (isPlaying) {
                currentAudio.pause();
                isPlaying = false;
                playPauseBtn.classList.remove('play');
                playPauseBtn.classList.add('pause');
            } else {
                currentAudio.play().catch(e => console.warn(e));
                isPlaying = true;
                playPauseBtn.classList.remove('pause');
                playPauseBtn.classList.add('play');
            }
        }
    });
}
}

// ==================== ЗАПУСК ====================
document.addEventListener('DOMContentLoaded', () => {
    initPlayerControls();
    initMap();
    loadMarkersFromFirebase();
    checkAuth();
    initNoiseLayer();
    refreshMarkers();

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
});
