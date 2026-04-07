document.addEventListener('DOMContentLoaded', () => {
    function trackGA(action, label) {
        if (typeof gtag === 'function') {
            gtag('event', 'interaction', {
                event_category: 'yoga_app',
                event_label: label,
                action: action
            });
        }
    }

    const trackedButtons = {
        'saveAppBtn': 'Save App',
        'fullscreenBtn': 'Toggle Fullscreen',
        'breathBtn': 'Toggle Breathing',
        'debugBtn': 'Toggle Editor',
        'playSeqBtn': 'Play Sequence',
        'clearSeqBtn': 'Clear Sequence'
    };

    Object.keys(trackedButtons).forEach(id => {
        const btn = document.getElementById(id);
        if(btn) btn.addEventListener('click', () => trackGA('button_click', trackedButtons[id]));
    });

    document.addEventListener('click', (e) => {
        const poseCard = e.target.closest('.pose-card');
        if (poseCard && poseCard.dataset.id) {
            trackGA('select_pose', poseCard.dataset.id);
        }
        
        const flowCard = e.target.closest('.flow-card');
        if (flowCard && flowCard.dataset.id) {
            trackGA('select_flow_suggestion', flowCard.dataset.id);
        }
        
        const seqDot = e.target.closest('.seq-dot:not(.add-seq)');
        if (seqDot) {
            trackGA('select_sequence', seqDot.title || 'Sequence');
        }
    });
});
