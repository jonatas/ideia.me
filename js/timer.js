/**
 * Workout Timer Logic - Mobile Friendly & Tone.js
 */

class WorkoutTimer {
    constructor() {
        this.sequences = [
            { label: 'Jumping Jacks', work: 45, rest: 15, series: 5 },
            { label: 'Pushups', work: 40, rest: 20, series: 5 },
            { label: 'Bodyweight Squats', work: 45, rest: 15, series: 5 },
            { label: 'Plank', work: 60, rest: 20, series: 4 },
            { label: 'Alternating Lunges', work: 45, rest: 15, series: 5 },
            { label: 'Burpees', work: 30, rest: 30, series: 4 },
            { label: 'Mountain Climbers', work: 45, rest: 15, series: 5 },
            { label: 'Glute Bridges', work: 45, rest: 15, series: 5 },
            { label: 'Bicycle Crunches', work: 45, rest: 15, series: 5 },
            { label: 'High Knees', work: 45, rest: 15, series: 5 },
            { label: 'Tricep Dips', work: 40, rest: 20, series: 5 },
            { label: 'Superman', work: 45, rest: 15, series: 5 }
        ];
        
        this.active = false;
        this.paused = false;
        this.currentSequenceIdx = 0;
        this.currentSeriesIdx = 0;
        this.currentPhase = 'countdown'; // 'countdown', 'work', 'rest'
        this.timeRemaining = 5;
        this.timerId = null;
        this.audioEnabled = false;
        this.synth = null;
        this.sessionSets = 0;

        this.elements = {
            timerDisplay: document.getElementById('timerDisplay'),
            seriesDisplay: document.getElementById('seriesDisplay'),
            phaseEl: document.getElementById('timerPhase'),
            exerciseNameEl: document.getElementById('currentExerciseName'),
            editExerciseInput: document.getElementById('editExerciseInput'),
            hintEl: document.getElementById('timerHint'),
            progressCircle: document.getElementById('progressCircle'),
            sequenceNav: document.getElementById('sequenceNav'),
            settingsPanel: document.getElementById('settingsPanel'),
            workoutList: document.getElementById('workoutList'),
            saveAppBtn: document.getElementById('saveAppBtn'),
            giftBtn: document.getElementById('giftBtn'),
            statsModal: document.getElementById('statsModal')
        };

        this.init();
    }

    async init() {
        this.renderSequenceNav();
        this.updateDisplay();
        this.bindEvents();
        this.checkSavedState();
    }

    checkSavedState() {
        if (window.userProfile && window.userProfile.isSaved(window.location.pathname)) {
            if (this.elements.saveAppBtn) {
                this.elements.saveAppBtn.innerHTML = '<i class="bi bi-bookmark-fill text-info"></i>';
            }
        }
    }

    bindEvents() {
        // Global interaction for audio
        document.body.addEventListener('click', () => this.ensureAudio(), { once: true });
    }

    async ensureAudio() {
        if (this.audioEnabled) return;
        
        try {
            await Tone.start();
            this.synth = new Tone.Synth({
                oscillator: { type: "sine" },
                envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.5 }
            }).toDestination();
            this.audioEnabled = true;
            console.log('Audio Context Started');
        } catch (e) {
            console.error('Audio initialization failed', e);
        }
    }

    playBeep(type) {
        if (!this.audioEnabled || !this.synth) return;
        
        const now = Tone.now();
        if (type === 'low') {
            this.synth.triggerAttackRelease("C4", "16n", now, 0.5);
        } else if (type === 'high') {
            this.synth.triggerAttackRelease("C5", "8n", now, 0.8);
        }
    }

    recordProgress(durationSeconds) {
        this.sessionSets++;
        
        // Save to localStorage using similar keys to breathe app
        const totalSets = parseInt(localStorage.getItem('ideia_workout_totalSets') || '0') + 1;
        const totalTime = parseFloat(localStorage.getItem('ideia_workout_totalTime') || '0') + durationSeconds;
        
        localStorage.setItem('ideia_workout_totalSets', totalSets);
        localStorage.setItem('ideia_workout_totalTime', totalTime);

        // Show gift icon after some progress
        if (this.sessionSets >= 3 && this.elements.giftBtn) {
            this.elements.giftBtn.style.display = 'flex';
        }
    }

    renderSequenceNav() {
        this.elements.sequenceNav.innerHTML = '';
        this.sequences.forEach((s, idx) => {
            const item = document.createElement('div');
            item.className = `exercise-item ${idx === this.currentSequenceIdx ? 'active' : ''} ${idx < this.currentSequenceIdx ? 'completed' : ''}`;
            item.innerHTML = `
                <span class="name">${s.label}</span>
                <span class="meta">${s.series} series · ${s.work}s W · ${s.rest}s R</span>
            `;
            item.onclick = () => this.jumpToSequence(idx);
            this.elements.sequenceNav.appendChild(item);
        });
    }

    updateDisplay() {
        const seq = this.sequences[this.currentSequenceIdx];
        if (!seq) return;

        this.elements.exerciseNameEl.textContent = seq.label.toUpperCase();
        this.elements.seriesDisplay.textContent = `${this.currentSeriesIdx + 1} / ${seq.series}`;
        this.elements.timerDisplay.textContent = Math.ceil(this.timeRemaining);

        const colors = {
            work: 'var(--work-color)',
            rest: 'var(--rest-color)',
            countdown: 'var(--countdown-color)'
        };

        const phaseLabels = {
            work: 'WORK',
            rest: 'REST',
            countdown: 'GET READY'
        };

        const hints = {
            work: this.paused ? 'PAUSED' : 'Keep going!',
            rest: this.paused ? 'PAUSED' : 'Breathe and recover',
            countdown: this.paused ? 'PAUSED' : 'Starting soon...'
        };

        this.elements.phaseEl.textContent = phaseLabels[this.currentPhase];
        this.elements.phaseEl.style.color = colors[this.currentPhase];
        this.elements.hintEl.textContent = hints[this.currentPhase];
        this.elements.progressCircle.style.stroke = colors[this.currentPhase];

        // Update Progress Circle
        const totalPhaseTime = this.currentPhase === 'work' ? seq.work : (this.currentPhase === 'rest' ? seq.rest : 5);
        const progress = this.timeRemaining / totalPhaseTime;
        const offset = 283 * progress;
        this.elements.progressCircle.style.strokeDashoffset = offset;
    }

    toggleTimer() {
        this.ensureAudio();
        if (!this.active) {
            this.start();
        } else {
            this.paused = !this.paused;
            this.updateDisplay();
        }
    }

    start() {
        this.active = true;
        this.paused = false;
        if (!this.timerId) {
            this.timerId = setInterval(() => this.tick(), 1000);
        }
    }

    reset() {
        this.active = false;
        this.paused = false;
        clearInterval(this.timerId);
        this.timerId = null;
        this.currentSequenceIdx = 0;
        this.currentSeriesIdx = 0;
        this.currentPhase = 'countdown';
        this.timeRemaining = 5;
        this.renderSequenceNav();
        this.updateDisplay();
    }

    tick() {
        if (this.paused) return;

        this.timeRemaining--;

        if (this.timeRemaining <= 3 && this.timeRemaining > 0) {
            this.playBeep('low');
        }

        if (this.timeRemaining <= 0) {
            this.playBeep('high');
            this.nextPhase();
        }

        this.updateDisplay();
    }

    nextPhase() {
        const seq = this.sequences[this.currentSequenceIdx];

        if (this.currentPhase === 'countdown') {
            this.currentPhase = 'work';
            this.timeRemaining = seq.work;
        } else if (this.currentPhase === 'work') {
            this.recordProgress(seq.work);
            this.currentPhase = 'rest';
            this.timeRemaining = seq.rest;
        } else if (this.currentPhase === 'rest') {
            this.currentSeriesIdx++;
            if (this.currentSeriesIdx >= seq.series) {
                // Sequence (Exercise) Completed!
                if (typeof confetti !== 'undefined') {
                    confetti({
                        particleCount: 50,
                        spread: 60,
                        origin: { y: 0.8 },
                        colors: [getComputedStyle(document.documentElement).getPropertyValue('--work-color').trim()]
                    });
                }
                
                this.currentSeriesIdx = 0;
                this.currentSequenceIdx++;
                if (this.currentSequenceIdx >= this.sequences.length) {
                    this.finishWorkout();
                    return;
                }
                this.currentPhase = 'countdown';
                this.timeRemaining = 5;
            } else {
                this.currentPhase = 'work';
                this.timeRemaining = seq.work;
            }
        }
        this.renderSequenceNav();
    }

    finishWorkout() {
        this.active = false;
        clearInterval(this.timerId);
        this.timerId = null;
        this.elements.phaseEl.textContent = 'DONE!';
        this.elements.phaseEl.style.color = 'var(--work-color)';
        this.elements.timerDisplay.textContent = '🎉';
        this.elements.hintEl.textContent = 'Great job!';
        if (typeof confetti !== 'undefined') {
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }
        this.openStats();
    }

    jumpToSequence(idx) {
        this.currentSequenceIdx = idx;
        this.currentSeriesIdx = 0;
        this.currentPhase = 'countdown';
        this.timeRemaining = 5;
        this.paused = true;
        this.active = true;
        if (!this.timerId) this.start();
        this.renderSequenceNav();
        this.updateDisplay();
    }

    // Settings / Configuration
    toggleSettings() {
        this.elements.settingsPanel.classList.toggle('active');
        if (this.elements.settingsPanel.classList.contains('active')) {
            this.renderWorkoutConfig();
        }
    }

    renderWorkoutConfig() {
        this.elements.workoutList.innerHTML = '';
        this.sequences.forEach((s, idx) => {
            const row = document.createElement('div');
            row.className = 'config-row';
            row.innerHTML = `
                <button class="icon-btn remove-btn" onclick="timerApp.removeExercise(${idx})"><i class="bi bi-trash"></i></button>
                <div class="config-grid">
                    <div class="config-item">
                        <label>Exercise</label>
                        <input type="text" value="${s.label}" onchange="timerApp.updateSeq(${idx}, 'label', this.value)">
                    </div>
                    <div class="config-item">
                        <label>Work</label>
                        <input type="number" value="${s.work}" onchange="timerApp.updateSeq(${idx}, 'work', parseInt(this.value))">
                    </div>
                    <div class="config-item">
                        <label>Rest</label>
                        <input type="number" value="${s.rest}" onchange="timerApp.updateSeq(${idx}, 'rest', parseInt(this.value))">
                    </div>
                    <div class="config-item">
                        <label>Series</label>
                        <input type="number" value="${s.series}" onchange="timerApp.updateSeq(${idx}, 'series', parseInt(this.value))">
                    </div>
                </div>
            `;
            this.elements.workoutList.appendChild(row);
        });
    }

    updateSeq(idx, field, value) {
        this.sequences[idx][field] = value;
    }

    addExercise() {
        this.sequences.push({ label: 'New Exercise', work: 30, rest: 10, series: 3 });
        this.renderWorkoutConfig();
    }

    removeExercise(idx) {
        this.sequences.splice(idx, 1);
        this.renderWorkoutConfig();
    }

    saveAndReset() {
        this.toggleSettings();
        this.reset();
    }

    // Statistics Modal
    openStats() {
        const ts = parseInt(localStorage.getItem('ideia_workout_totalSets') || '0');
        const ttSeconds = parseFloat(localStorage.getItem('ideia_workout_totalTime') || '0');
        const ttMins = (ttSeconds / 60).toFixed(1);

        document.getElementById('statSets').textContent = ts;
        document.getElementById('statTime').textContent = ttMins;
        this.elements.statsModal.classList.add('active');
    }

    closeStats() {
        this.elements.statsModal.classList.remove('active');
    }

    toggleFavorite(btn) {
        if (window.userProfile) {
            const isSaved = window.userProfile.toggleFavorite('app', window.location.pathname, window.location.href, 'Workout Timer', 'bi-stopwatch');
            btn.innerHTML = isSaved ? '<i class="bi bi-bookmark-fill text-info"></i>' : '<i class="bi bi-bookmark"></i>';
        }
    }

    // Inline Editing
    editCurrentName() {
        const seq = this.sequences[this.currentSequenceIdx];
        if (!seq) return;

        this.elements.exerciseNameEl.style.display = 'none';
        this.elements.editExerciseInput.style.display = 'block';
        this.elements.editExerciseInput.value = seq.label;
        this.elements.editExerciseInput.focus();
        this.elements.editExerciseInput.select();
    }

    saveCurrentName() {
        const seq = this.sequences[this.currentSequenceIdx];
        if (!seq) return;

        const newName = this.elements.editExerciseInput.value.trim();
        if (newName) {
            seq.label = newName;
            this.renderSequenceNav();
        }

        this.elements.exerciseNameEl.style.display = 'block';
        this.elements.editExerciseInput.style.display = 'none';
        this.updateDisplay();
    }
}

// Global instance
let timerApp = null;
document.addEventListener('DOMContentLoaded', () => {
    timerApp = new WorkoutTimer();
});

// Global functions for HTML onclick
window.toggleTimer = () => timerApp.toggleTimer();
window.resetTimer = () => timerApp.reset();
window.toggleSettings = () => timerApp.toggleSettings();
window.addExercise = () => timerApp.addExercise();
window.saveAndReset = () => timerApp.saveAndReset();

// Fullscreen logic
document.getElementById('fullscreenBtn').addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});
