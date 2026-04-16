function navigateWithAnimation(targetUrl) {
    document.body.style.overflow = 'hidden';
    const page = document.querySelector('.page');
    page.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    page.style.transform = 'translateX(-100%)';
    setTimeout(() => {
        window.location.href = targetUrl;
    }, 400);
}

document.querySelectorAll('.city').forEach(cityElem => {
    cityElem.addEventListener('click', (e) => {
        const cityName = cityElem.getAttribute('data-city');
        if (cityName === 'Podolsk') {
            // Переход на страницу карты Подольска
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

document.querySelector('.flashbacks').addEventListener('click', () => {
    alert('Функционал "Flashbacks" в разработке');
    // navigateWithAnimation('Flashbacks.html');
});

function navigateWithAnimation(targetUrl) {
    document.body.style.overflow = 'hidden';
    const page = document.querySelector('.page');
    page.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    page.style.transform = 'translateX(-100%)';
    setTimeout(() => {
        window.location.href = targetUrl;
    }, 400);
}