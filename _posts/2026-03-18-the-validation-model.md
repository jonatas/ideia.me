---
layout: post
title: "The Validation Model"
categories: ['personal', 'productivity', 'career']
description: "How a simple time tracker changed my relationship with work by giving my brain the validation it was unconsciously looking for."
image: /images/the-validation-model-stopwatch-split.png
mermaid: true
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

{% mermaid %}
flowchart TD
    A[Start Work] --> B(Track Time)
    B --> C{Focus Maintained?}
    C -- Yes --> D[Tangible Evidence]
    C -- No --> E[Review Distractions]
    E --> B
    D --> F[External Validation Proxy]
    F --> G[Psychological Relief]
    G --> H((Creative Idleness))
    H --> I[Deep Rest & Personal Life]
    I --> A
{% endmermaid %}

## The Validation Loop

Try it yourself. Click the button to log your focus time. Watch how hitting your target changes your state.

<div class="validation-widget" aria-live="polite">
  <div class="progress-bar-container">
    <div id="focus-progress" class="progress-bar"></div>
  </div>
  <p id="focus-status" class="status-text">0 / 40 hours logged</p>
  <button id="log-time-btn" class="log-btn">Log 8 Hours</button>
  <div id="reward-message" class="reward-message hidden">
    <h3>✨ Target Reached! ✨</h3>
    <p>Validation achieved. Your mind is now free to engage in <strong>Creative Idleness</strong>. Go to the waterfall!</p>
  </div>
</div>

<style>
.validation-widget {
  background: rgba(0, 0, 0, 0.2);
  padding: 24px;
  border-radius: 12px;
  margin: 30px 0;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.progress-bar-container {
  width: 100%;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 15px;
}
.progress-bar {
  height: 100%;
  width: 0%;
  background: #0d9488;
  transition: width 0.3s ease-in-out, background-color 0.3s ease-in-out;
}
.status-text {
  font-family: monospace;
  font-size: 1.1em;
  color: #94a3b8;
  margin-bottom: 20px;
}
.log-btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 1em;
  cursor: pointer;
  transition: background 0.2s;
}
.log-btn:hover {
  background: #1d4ed8;
}
.log-btn:disabled {
  background: #475569;
  cursor: not-allowed;
}
.reward-message {
  margin-top: 20px;
  padding: 15px;
  background: rgba(13, 148, 136, 0.2);
  border-radius: 8px;
  border: 1px solid #0d9488;
  animation: fadeIn 0.5s ease-in;
}
.reward-message.hidden {
  display: none;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>

<script>
document.addEventListener('DOMContentLoaded', () => {
  let hours = 0;
  const target = 40;
  const btn = document.getElementById('log-time-btn');
  const status = document.getElementById('focus-status');
  const progress = document.getElementById('focus-progress');
  const reward = document.getElementById('reward-message');

  btn.addEventListener('click', () => {
    hours += 8;
    if (hours > target) hours = target;

    const percentage = (hours / target) * 100;
    progress.style.width = percentage + '%';
    status.textContent = `${hours} / ${target} hours logged`;

    // Accessibility: Update text content based on color transitions logic
    if (hours === target) {
      progress.style.background = '#10b981'; // Success green
      btn.disabled = true;
      btn.textContent = 'Week Complete';
      reward.classList.remove('hidden');
    }
  });
});
</script>

> And no, I haven't watched the series Severance but I know it exists ;)


