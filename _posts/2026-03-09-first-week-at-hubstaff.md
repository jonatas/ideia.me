---
layout: post
categories: [career]
title: First week at Hubstaff
description: "My first week at Hubstaff: tracking time, gaining productivity insights, and navigating the new fully remote tech stack."
tags: ['productivity', 'hubstaff', 'remote-work', 'time-tracking', 'ruby']
mermaid: true
---

# My first week at Hubstaff

Last week I joined Hubstaff and I couldn't be happier. Getting back to work with
Ruby and a full remote team is awesome. We also use PostgreSQL which I really love
and always hacking it.

The business is quite interesting, tracking time for remote teams. What's
amazing is that one of the core values from Hubstaff is transparency and their
software shows exactly what they're sharing with the team.

As an employee you can also enable data privacy and opt-out for screenshots. I
really like the transparency of my manager, walking me through all he sees and
how the system presents it from his side.



## Time Tracker impressions

I liked it. My Friday ended at 4 PM as the Hubstaff is configured for internal
employees limited to 40 hours. I absolutely loved it. I deserved the rest and
at this point I just left the computer and went to the waterfall nearby my house.

I observed I finished my days much earlier and with the sense of accomplishment
that sometimes I don't feel as I'm not tracking the time.

I also understood that having the time counter in the tray bar was such a
precious way to remind the day is going and you should focus on what is
important.

## Productivity insights

There are insights related to how do you use your day in the app and they all
help you to grow and increase your focus on your role.

### Core work vs non-core vs distraction

Understand where do you spend your time. How much do you invest on each tool and
how long.

A developer may not have LinkedIn as a core-work as a recruiter. Every app can be
judged or classified depending your role.

This is very cool and helps to understand how much we're derailing from the
proposed work.

{% mermaid %}
pie title Example Workday Breakdown
    "Core Work (e.g., Coding)" : 65
    "Non-core (e.g., Meetings)" : 20
    "Distraction (e.g., Social Media)" : 15
{% endmermaid %}

### Activity

The percentage of time you're typing on the keyboard or moving the mouse.

Well, this should never be 100% but should always get into some patterns that
looks like a human navigating the computer.


### Focus

This is fun! Your ability to not switch tabs 🤓

Even when you want to be focused, sometimes your anxiety hits and you're forced to
switch to "something else". Well, most of the time it does not help. Switching
activities involves a high cost of cognitive load switch and it may not be
helpful or healthy for you.

The focus measures your ability of not switching apps. It counts unfocus when
you spend less than 90 seconds on an app.

### The Focus Challenge

To truly understand the cost of context switching, try this quick challenge. Can you stay focused on the square without getting distracted?

<div id="focus-challenge-widget" role="region" aria-label="Focus Challenge Mini-game" style="background: #1e293b; padding: 20px; border-radius: 8px; text-align: center; color: white; max-width: 400px; margin: 20px auto; font-family: sans-serif; position: relative; overflow: hidden;">
  <div id="fc-start-screen">
    <h4 style="margin-top: 0; color: #38bdf8;">Stay Focused</h4>
    <p style="font-size: 0.9em; margin-bottom: 20px;">Keep your mouse (or keyboard focus) on the moving square for 10 seconds. Don't let the notifications distract you!</p>
    <button id="fc-start-btn" style="background: #0ea5e9; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;" aria-label="Start Focus Challenge">Start Challenge</button>
  </div>

  <div id="fc-game-screen" style="display: none; height: 200px; position: relative;" aria-live="polite">
    <button id="fc-target" aria-label="Target box to keep focus on" style="width: 40px; height: 40px; background: #22c55e; border: none; border-radius: 4px; position: absolute; top: 80px; left: 160px; transition: background-color 0.2s; outline: none; cursor: crosshair;"></button>
    <div id="fc-timer" aria-live="timer" aria-atomic="true" style="position: absolute; top: 10px; right: 10px; font-weight: bold; font-size: 1.2em;">10.0</div>
  </div>

  <div id="fc-end-screen" style="display: none;" aria-live="assertive">
    <h4 id="fc-result-title" style="margin-top: 0;"></h4>
    <p id="fc-result-msg" style="font-size: 0.9em;"></p>
    <button id="fc-retry-btn" style="background: #64748b; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;" aria-label="Try Focus Challenge Again">Try Again</button>
  </div>
</div>

<style>
  #fc-target:focus, #fc-target.focused {
    background: #22c55e !important;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.5);
  }
</style>

<script>
(function() {
  const widget = document.getElementById('focus-challenge-widget');
  const startScreen = document.getElementById('fc-start-screen');
  const gameScreen = document.getElementById('fc-game-screen');
  const endScreen = document.getElementById('fc-end-screen');
  const startBtn = document.getElementById('fc-start-btn');
  const retryBtn = document.getElementById('fc-retry-btn');
  const target = document.getElementById('fc-target');
  const timerDisplay = document.getElementById('fc-timer');
  const resultTitle = document.getElementById('fc-result-title');
  const resultMsg = document.getElementById('fc-result-msg');

  let gameInterval;
  let timeLeft = 10.0;
  let isFocused = false;
  let distractionTimeout;

  function startGame() {
    startScreen.style.display = 'none';
    endScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    timeLeft = 10.0;
    isFocused = false;
    updateTimerDisplay();
    target.style.background = '#334155'; // Unfocused color
    target.classList.remove('focused');

    // Move target randomly
    moveTarget();
    target.focus(); // initially auto-focus

    gameInterval = setInterval(() => {
      if (isFocused) {
        timeLeft -= 0.1;
        updateTimerDisplay();

        if (timeLeft <= 0) {
          endGame(true);
        }
      }
    }, 100);

    scheduleDistraction();
  }

  function updateTimerDisplay() {
    timerDisplay.textContent = Math.max(0, timeLeft).toFixed(1);
  }

  function moveTarget() {
    const maxX = widget.clientWidth - 80;
    const maxY = 160;
    const newX = Math.random() * maxX + 20;
    const newY = Math.random() * maxY + 20;

    target.style.transition = 'all 0.5s ease-in-out';
    target.style.left = newX + 'px';
    target.style.top = newY + 'px';

    if (gameScreen.style.display === 'block') {
      setTimeout(moveTarget, 1500 + Math.random() * 1000);
    }
  }

  function scheduleDistraction() {
    if (gameScreen.style.display !== 'block') return;

    const delay = 2000 + Math.random() * 3000;
    distractionTimeout = setTimeout(() => {
      showDistraction();
      scheduleDistraction();
    }, delay);
  }

  function showDistraction() {
    const notification = document.createElement('button');
    notification.textContent = '🔔 New message!';
    notification.style.cssText = 'position: absolute; background: #ef4444; color: white; padding: 5px 10px; border: none; border-radius: 4px; font-size: 0.8em; z-index: 10; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.3);';
    notification.style.top = Math.random() * 150 + 'px';
    notification.style.left = Math.random() * (widget.clientWidth - 150) + 'px';
    notification.setAttribute('aria-label', 'Distraction notification');

    const triggerDistraction = () => {
      endGame(false, "You checked the notification! Context switching breaks your flow.");
    };

    notification.addEventListener('mouseenter', triggerDistraction);
    notification.addEventListener('focus', triggerDistraction);
    notification.addEventListener('click', triggerDistraction);

    gameScreen.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode === gameScreen) {
        gameScreen.removeChild(notification);
      }
    }, 2000);
  }

  function endGame(win, msg = '') {
    clearInterval(gameInterval);
    clearTimeout(distractionTimeout);

    // Clean up notifications
    const notifications = gameScreen.querySelectorAll('button[style*="background: rgb(239, 68, 68)"]');
    notifications.forEach(n => n.remove());

    gameScreen.style.display = 'none';
    endScreen.style.display = 'block';

    if (win) {
      resultTitle.textContent = "🏆 Focus Champion!";
      resultTitle.style.color = '#22c55e';
      resultMsg.textContent = "You maintained focus for 10 seconds. In real life, it takes much longer to regain deep focus after a distraction.";
    } else {
      resultTitle.textContent = "💥 Focus Broken!";
      resultTitle.style.color = '#ef4444';
      resultMsg.textContent = msg || "You lost focus. It takes an average of 23 minutes to fully recover focus after an interruption.";
    }
    retryBtn.focus();
  }

  function handleFocus() {
    isFocused = true;
    target.style.background = '#22c55e'; // Focused color
    target.classList.add('focused');
  }

  function handleBlur() {
    isFocused = false;
    target.style.background = '#334155'; // Unfocused color
    target.classList.remove('focused');
  }

  target.addEventListener('mouseenter', handleFocus);
  target.addEventListener('focus', handleFocus);
  target.addEventListener('mouseleave', handleBlur);
  target.addEventListener('blur', handleBlur);

  startBtn.addEventListener('click', startGame);
  retryBtn.addEventListener('click', startGame);
})();
</script>

Using Hubstaff as a user made me think a lot about how I relate to time. I wrote
about this in [Time Economics](/time-economics) — the idea that time
is your most non-renewable resource and every hour can be viewed through the lens
of future value, present value, and authorship. The tracker is essentially a
mirror for that: it makes the invisible visible. Core work vs distraction maps
directly to future value filtering. The focus metric is a proxy for
authorshipmetry — are you writing your own story or just reacting to noise?
And that Friday at 4 PM, walking to the waterfall, was pure present value.

## Tech stack

Ruby and Postgresql! Yes! These tools make me feel at home. Also, the high
standards for code and Q&A are exactly like I expected 🫶🏼

There are also some hardcore low latency components built in Rust which I'm very
interested in learning and contributing.


