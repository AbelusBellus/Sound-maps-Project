// Навигация по городам
document.querySelectorAll('.city').forEach(cityElem => {
    cityElem.addEventListener('click', (e) => {
        const cityName = cityElem.getAttribute('data-city');
        if (cityName === 'Podolsk') {
            window.location.href = 'Page3.html';
        } else if (cityName === 'Moscow') {
            window.location.href = 'Page2.html';
        } else if (cityName === 'Nijni Novgorod') {
            window.location.href = 'Page4.html';
        } else {
            alert(`Переход к карте города: ${cityName}`);
        }
    });
});

// Кнопка FLASHBACKS
document.querySelector('.flashbacks').addEventListener('click', () => {
    alert('Функционал "Flashbacks" в разработке');
});

// --- Мобильный аккордеон + смещение flashbacks ---
const mobileHeader = document.querySelector('.mobile-cities-header');
const cityList = document.querySelector('.city-list');
const toggleSpan = document.querySelector('.cities-toggle');
const flashbacks = document.querySelector('.flashbacks');

// Исходное положение flashbacks (значение из CSS)
const FLASHBACKS_TOP_CLOSED = 244; // px
let flashbacksTopOpen = null; // будет вычислено динамически

if (mobileHeader && cityList && toggleSpan && flashbacks) {
    // Функция обновления позиции flashbacks
    function updateFlashbacksPosition() {
        if (!window.matchMedia('(max-width: 480px)').matches) return; // только для мобильных

        if (cityList.classList.contains('open')) {
            // Если flashbacksTopOpen ещё не вычислено, вычисляем
            if (flashbacksTopOpen === null) {
                // Высота списка городов + его отступ сверху (291px) + отступ снизу (20px)
                const listHeight = cityList.scrollHeight;
                // Позиция: top списка + высота списка + небольшой отступ (20px)
                flashbacksTopOpen = 291 + listHeight + 20;
            }
            flashbacks.style.top = flashbacksTopOpen + 'px';
        } else {
            flashbacks.style.top = FLASHBACKS_TOP_CLOSED + 'px';
            // Сбрасываем вычисленное значение, чтобы пересчитать при следующем открытии
            flashbacksTopOpen = null;
        }
    }

    // Отслеживаем изменения класса open
    const observer = new MutationObserver(() => {
        updateFlashbacksPosition();
    });
    observer.observe(cityList, { attributes: true, attributeFilter: ['class'] });

    // При клике переключаем класс open
    mobileHeader.addEventListener('click', () => {
        const isOpen = cityList.classList.contains('open');
        if (isOpen) {
            cityList.classList.remove('open');
            toggleSpan.textContent = '+';
        } else {
            cityList.classList.add('open');
            toggleSpan.textContent = '−';
            // Небольшая задержка, чтобы DOM обновился и scrollHeight стал корректным
            setTimeout(() => updateFlashbacksPosition(), 10);
        }
    });

    // При загрузке страницы также установим правильную позицию (если вдруг класс open уже есть)
    updateFlashbacksPosition();
}