---
layout: post
title: "The Validation Model"
categories: ['personal', 'productivity', 'career']
description: "How a simple time tracker changed my relationship with work by giving my brain the validation it was unconsciously looking for."
image: /images/the-validation-model-stopwatch-split.png
---

Today I'm thinking how interesting it's been to be freelancing again. Well, I have a
full time job at [Hubstaff](/first-week-at-hubstaff), which we're basically paid by hour.

Then, I need to track the work and I get some insights about the way I work.

That was the easy part, software showing me metrics about how I'm doing my work, 
how much I'm active, how much I'm focused and so on.

But now, in the third week, I already see so many benefits of tracking and
committing to the time I was expected to work.

Well, for me distraction means I'm lacking meaning and I just get distracted
when I'm unsatisfied or use distraction to control my anxiety.

But now I'm looking to the validation model that my brain is offering me. Yes, I
see myself more validated by the time as time is the first commitment expected
when you have a job. Later come, focus, deliveries and goal achievements.

I feel I work purely disconnected to the work when I leave the computer. I know
I'm not tracking my time. This is a very important factor on my brain. If I'm
really not working, I'm not working.

I was really not expecting that, but as the timer keeps rolling during the day I
got myself thinking much less in work and much more in optimize my free time as
I optimize my daily time.

In my off work week schedule, I have:

Monday 1.5 hours of night workout.
Tuesday 2 hours of Yoga.
Wednesday I split between Kayaking or land work. Around 2 hours.
Thursday 1 hour gym.
Friday 2 hours in the waterfall near by my house. I rest and always have some yoga there.

I'm always looking for ways to [optimize and use very well my time](/time-economics). It takes 40
min to round trip to the city I do my exercises. As I live in the country side,
and it's around 47 km to round trip to my appointments.

So, when I'm going, most of the days I'm heading to a Yoga class, and my mind
already start watching the mind state purely.

I see my selective brain working, moving from repressive thoughts about my
performance with ok, I did my part, I focused all the time I promised and now
I'm engaging on my personal life.

It takes time to make it, but I observed that this time tracker is helping me to
remember about what I'm doing and what was my days. In the past few months I did
several days of 10-12 hours in the computer and felt regretful to invest too long hours.

That was not healthy and it was just driven by the **validation** that we need
to live and feel belonging. It starts with your mom saying yes or no and then
family, teachers, and later co-workers.

When the company culture is purely async, you don't feel this validation. Nobody
is chasing to find you online, or value your instant answer. Your commitment is
just based on your actions, the way you interact and move your tasks forward.

I absolutely love it. This relief the stress of thinking about "being available"
and open room for ["being focused"](/the-proxy-life-trap). I always admire the way we shape our focus
and now I feel this small rewarding numbers that we chase everyday, worked as the
validation I was looking for.

I'm not here to convince it will work for you, but I feel that when I was not
tracking my time I was always working more, thinking more about work in the
off-working hours and never empowering my real creative idleness. Because I don't
have any previous evidences or metrics, and the absence of human validation
makes me fall into a psychological trap to reduce my perception of my efforts.

I think that my work-mind relationship now is much healthier just because I found a
way to say, ok, I did it!

> And no, I haven't watched the series Severance but I know it exists ;)

---

### Focus Challenge

Want to see how hard it is to just stay still? Try holding your focus here for 5 seconds without clicking away or moving your mouse off the target.

<style>
#focus-challenge-widget {
  background: #161b27;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 16px;
  padding: 40px 24px 32px;
  text-align: center;
  margin: 32px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  user-select: none;
}
#focus-target {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: radial-gradient(circle at 38% 32%, #0d9488, #1E3A8A);
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, filter 0.2s ease;
  color: white;
  font-size: 2rem;
  font-weight: bold;
}
#focus-target:hover, #focus-target:focus {
  transform: scale(1.05);
  filter: brightness(1.2);
  outline: 2px solid #0EA5E9;
  outline-offset: 4px;
}
#focus-message {
  color: #8892b0;
  font-size: 1rem;
  font-weight: bold;
  min-height: 1.5em;
}
#focus-progress-container {
  width: 100%;
  max-width: 300px;
  height: 8px;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  margin: 20px auto 0;
  overflow: hidden;
}
#focus-progress-bar {
  height: 100%;
  width: 0%;
  background: #0EA5E9;
  transition: width 0.1s linear;
}
</style>

<div id="focus-challenge-widget">
  <div id="focus-target" tabindex="0" aria-label="Hover or focus here for 5 seconds to complete the focus challenge" role="button">
    <span id="focus-timer">5.0</span>
  </div>
  <div id="focus-message" aria-live="polite">Hover or focus to begin</div>
  <div id="focus-progress-container" aria-hidden="true">
    <div id="focus-progress-bar"></div>
  </div>
</div>

<script>
(function() {
  const target = document.getElementById('focus-target');
  const timerDisplay = document.getElementById('focus-timer');
  const messageDisplay = document.getElementById('focus-message');
  const progressBar = document.getElementById('focus-progress-bar');

  let focusInterval;
  let startTime;
  let currentTargetDuration = 5000; // Start with 5 seconds
  let isFocused = false;
  let hasWon = false;
  let winCount = 0;

  function updateDisplay(safeMessage, timeLeftMs) {
    if (safeMessage) {
        messageDisplay.textContent = "";
        messageDisplay.appendChild(document.createTextNode(safeMessage));
    }

    if (timeLeftMs !== undefined) {
        const secondsLeft = Math.max(0, timeLeftMs / 1000).toFixed(1);
        timerDisplay.textContent = "";
        timerDisplay.appendChild(document.createTextNode(secondsLeft));

        const progress = Math.min(100, Math.max(0, ((currentTargetDuration - timeLeftMs) / currentTargetDuration) * 100));
        progressBar.style.width = `${progress}%`;
    }
  }

  function startFocus() {
    if (hasWon) return;
    isFocused = true;
    startTime = Date.now();
    updateDisplay(`Stay still for ${currentTargetDuration / 1000}s...`, currentTargetDuration);

    clearInterval(focusInterval);
    focusInterval = setInterval(() => {
      if (!isFocused) {
        clearInterval(focusInterval);
        return;
      }

      const elapsed = Date.now() - startTime;
      const remaining = currentTargetDuration - elapsed;

      if (remaining <= 0) {
        clearInterval(focusInterval);
        hasWon = true;
        winCount++;

        target.style.background = "radial-gradient(circle at 38% 32%, #10B981, #064E3B)";

        if (winCount > 2 && window.userProfile) {
          window.userProfile.saveItem('achievement', 'focus-master', '/the-validation-model', 'Focus Master', 'bi-trophy');
          updateDisplay("Focus Master Achievement Unlocked! Saved to Profile.", 0);
        } else {
          updateDisplay("Focus Challenge Complete! Click to double the challenge.", 0);
        }
      } else {
        updateDisplay(undefined, remaining);
      }
    }, 50);
  }

  function loseFocus() {
    if (hasWon) return;
    isFocused = false;
    clearInterval(focusInterval);
    updateDisplay("Focus lost! Hover or focus to restart.", currentTargetDuration);
  }

  function resetChallenge() {
    if (!hasWon) return;
    hasWon = false;
    currentTargetDuration *= 2; // Double the time
    target.style.background = "radial-gradient(circle at 38% 32%, #0d9488, #1E3A8A)";
    updateDisplay(`Challenge increased to ${currentTargetDuration / 1000}s! Hover to start.`, currentTargetDuration);
    target.blur(); // Remove focus to force re-interaction
  }

  target.addEventListener('click', resetChallenge);
  target.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      resetChallenge();
    }
  });

  target.addEventListener('mouseenter', startFocus);
  target.addEventListener('mouseleave', loseFocus);
  target.addEventListener('focus', startFocus);
  target.addEventListener('blur', loseFocus);
})();
</script>

