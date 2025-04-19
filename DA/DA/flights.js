window.addEventListener('scroll', () => {
    const header = document.getElementById('header');
    if (window.scrollY > 25) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

const featureIcons = document.querySelectorAll('.feature-icon');
const popup = document.getElementById('popup');

let activeFeature = null;
let isPopupHovered = false;

featureIcons.forEach(icon => {
    icon.addEventListener('mouseenter', (event) => {
        const feature = event.target.dataset.feature;
        activeFeature = feature;
        showPopup(feature, event.target.getBoundingClientRect());
    });

    icon.addEventListener('mouseleave', () => {
        if (!isPopupHovered) {
            hidePopup();
        }
    });
});

function showPopup(feature, rect) {
    if (feature === 'seat-type') {
        popup.style.display = 'block';
        popup.classList.add('show');
        popup.style.top = `${rect.top + window.scrollY + 30}px`;
        popup.style.left = `${rect.left + window.scrollX - popup.offsetWidth / 2 + rect.width / 2}px`;
        popup.innerHTML="This is the seat type!"
    }
    if (feature === 'WIFI') {
        popup.style.display = 'block';
        popup.classList.add('show');
        popup.style.top = `${rect.top + window.scrollY + 30}px`;
        popup.style.left = `${rect.left + window.scrollX - popup.offsetWidth / 2 + rect.width / 2}px`;
        popup.innerHTML="This flight offers WIFI"
    }
}

popup.addEventListener('mouseenter', () => {
    isPopupHovered = true;
    popup.classList.add('show');
});

popup.addEventListener('mouseleave', () => {
    isPopupHovered = false;
    hidePopup();
});

function hidePopup() {
    if (activeFeature && !popup.matches(':hover')) {
        popup.classList.remove('show');
    }
}
