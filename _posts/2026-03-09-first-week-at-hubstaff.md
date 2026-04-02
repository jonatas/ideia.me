---
layout: post
categories: [career]
title: First week at Hubstaff
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

<div class="interactive-widget" style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 8px; margin: 20px 0;">
  <h4 style="margin-top: 0; text-align: center;">Focus & Cognitive Load Simulator</h4>
  <p style="font-size: 0.9em; color: #a1a1aa; text-align: center;">See how rapid context switching drains your cognitive focus.</p>

  <div style="display: flex; justify-content: center; gap: 15px; margin-bottom: 20px;">
    <button id="btn-work" style="padding: 10px 20px; background: #059669; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Deep Work (Stay on App)</button>
    <button id="btn-switch" style="padding: 10px 20px; background: #dc2626; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Switch App</button>
  </div>

  <div style="background: #0f172a; padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); position: relative; overflow: hidden;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-weight: bold;">
      <span>Focus Score: <span id="focus-score-display" style="color: #34d399;">100%</span></span>
      <span>Cognitive Load: <span id="cog-load-display" style="color: #f87171;">Low</span></span>
    </div>

    <!-- Progress Bar -->
    <div style="width: 100%; background: #334155; height: 20px; border-radius: 10px; overflow: hidden;">
      <div id="focus-bar" style="width: 100%; height: 100%; background: #10b981; transition: width 0.3s ease, background-color 0.3s ease;"></div>
    </div>
  </div>

  <div aria-live="polite" class="sr-only" id="focus-live-region" style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;">Focus Simulator initialized. Score is 100%, Cognitive Load is Low.</div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
  let score = 100;
  let penaltyMultiplier = 1;
  const btnWork = document.getElementById('btn-work');
  const btnSwitch = document.getElementById('btn-switch');
  const scoreDisplay = document.getElementById('focus-score-display');
  const cogDisplay = document.getElementById('cog-load-display');
  const bar = document.getElementById('focus-bar');
  const liveRegion = document.getElementById('focus-live-region');

  function updateUI(action) {
    // Determine status text and colors
    let cogText = 'Low';
    let cogColor = '#f87171'; // light red
    let barColor = '#10b981'; // green

    if (score < 40) {
      cogText = 'Overloaded!';
      barColor = '#ef4444'; // red
      cogColor = '#ef4444';
    } else if (score < 75) {
      cogText = 'High';
      barColor = '#f59e0b'; // orange
      cogColor = '#f59e0b';
    }

    scoreDisplay.textContent = `${Math.round(score)}%`;
    scoreDisplay.style.color = barColor;
    cogDisplay.textContent = cogText;
    cogDisplay.style.color = cogColor;
    bar.style.width = `${Math.round(score)}%`;
    bar.style.backgroundColor = barColor;

    // Announce to screen readers
    liveRegion.textContent = `Action: ${action}. Focus score dropped to ${Math.round(score)}%. Cognitive load is ${cogText}.`;
  }

  btnWork.addEventListener('click', () => {
    score = Math.min(100, score + 10);
    penaltyMultiplier = 1; // reset penalty on deep work
    updateUI('Deep Work');
  });

  btnSwitch.addEventListener('click', () => {
    // Penalty increases if you switch rapidly
    const penalty = 15 * penaltyMultiplier;
    score = Math.max(0, score - penalty);
    penaltyMultiplier = Math.min(3, penaltyMultiplier + 0.5);
    updateUI('Switched App');
  });
});
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


