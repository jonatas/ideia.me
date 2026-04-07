document.addEventListener('DOMContentLoaded', () => {
    function trackGA(action, label) {
        if (typeof gtag === 'function') {
            gtag('event', 'interaction', {
                event_category: 'breathe_app',
                event_label: label,
                action: action
            });
        }
    }

    const trackedButtons = {
        'saveAppBtn': 'Save App',
        'giftBtn': 'View Progress',
        'fullscreenBtn': 'Toggle Fullscreen',
        'infoBtn': 'View Cultural Info'
    };

    Object.keys(trackedButtons).forEach(id => {
        const btn = document.getElementById(id);
        if(btn) btn.addEventListener('click', () => trackGA('button_click', trackedButtons[id]));
    });

    const exerciseSelect = document.getElementById('exerciseSelect');
    if (exerciseSelect) {
        exerciseSelect.addEventListener('change', () => {
            trackGA('select_exercise', exerciseSelect.options[exerciseSelect.selectedIndex].text);
        });
    }
});
