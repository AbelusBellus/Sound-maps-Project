// Функция анимации перехода (оставляем как есть)
function navigateWithAnimation(targetUrl) {
    document.body.style.overflow = 'hidden';
    const page = document.querySelector('.page');
    page.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    page.style.transform = 'translateX(-100%)';
    setTimeout(() => {
        window.location.href = targetUrl;
    }, 400);
}

// Навигация по городам (десктоп и мобильные)
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

// Обработчик кнопки FLASHBACKS
document.querySelector('.flashbacks').addEventListener('click', () => {
    alert('Функционал "Flashbacks" в разработке');
});

// ========== МОБИЛЬНЫЙ АККОРДЕОН ДЛЯ CITIES ==========
const mobileHeader = document.querySelector('.mobile-cities-header');
const cityList = document.querySelector('.city-list');
const toggleSpan = document.querySelector('.cities-toggle');

if (mobileHeader && cityList && toggleSpan) {
    mobileHeader.addEventListener('click', () => {
        const isOpen = cityList.classList.contains('open');
        if (isOpen) {
            cityList.classList.remove('open');
            toggleSpan.textContent = '+';
        } else {
            cityList.classList.add('open');
            toggleSpan.textContent = '−'; // минус
        }
    });
}