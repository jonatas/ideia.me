---
layout: post
title: "The Math Behind the Yoga SVG"
categories: ['programming', 'math', 'yoga', 'svg']
tags: ['svg', 'geometry', 'trigonometry', 'css-animations', 'front-end']
description: "How simple trigonometry and CSS variables combine to create anatomically connected, fully animatable SVG stick figures for yoga."
---

When I set out to build an [Interactive Yoga Poses App](/yoga.html), I had virtually no prior experience working with complex animations and only the most basic knowledge of SVG.

This project, however, was about more than just web development. Over the last few nights, I've been testing and integrating with the **Antigravity platform**—using it to rescue a graveyard of abandoned, hard-to-maintain old projects and migrating them into a brand-new [Apps](/apps) section on this website. I wanted to bring their essence back to life.

Building this animated yoga app became my way to deeply test the Antigravity platform. I am leveraging my curiosity to learn more about the things I feel attracted to—mixing my personal interests in yoga and math with code. I am absolutely loving the new capabilities and interactions this process is unlocking.

If you've ever tried to animate a vector graphic from scratch, you know the struggle: limbs detach, elbows bend the wrong way, and figures often look like they're breaking apart mid-animation. But the solution here wasn't a heavy JavaScript animation library. It was pure geometry.

By anchoring an SVG figure correctly and relying entirely on CSS rotational variables, you can create a skeleton that inherently understands its own joints.

## The Coordinate System

To understand how the stickman moves, we first need to understand the SVG coordinate system. Unlike standard Cartesian math where the Y-axis goes *up*, in an SVG, **the Y-axis goes down**. 

This flips our intuition for rotation. If you point a line straight down (the positive Y-axis) and apply a positive rotation in CSS (`transform: rotate(90deg)`), it rotates **clockwise**—meaning the line swings out to the left (the negative X-axis).

Understanding this flipped rotational space is critical when positioning our figure for complex asymmetrical poses.

## Structuring the Joints

Instead of redrawing paths for every pose, our stickman is built once using `<g>` (group) elements. Every limb acts as a nested pendulum.

For example, the arm is built like this:
```html
<g id="upper-arm" style="transform-origin: shoulder-X shoulder-Y; transform: rotate(var(--upper-arm-rot))">
    <line ... /> <!-- The actual bicep -->
    <g id="lower-arm" style="transform-origin: elbow-X elbow-Y; transform: rotate(var(--lower-arm-rot))">
        <line ... /> <!-- The forearm -->
    </g>
</g>
```
By placing the `transform-origin` exactly at the joints, the `lower-arm` automatically travels wherever the `upper-arm` goes. When the `--upper-arm-rot` changes, the entire nested group swings flawlessly.

Try it out here:

<style>
.blog-debug-panel {
    margin-top: 20px;
    padding: 15px;
    background: rgba(0,0,0,0.4);
    border-radius: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}
.blog-debug-row {
    display: flex;
    align-items: center;
    width: 200px;
    font-size: 0.8rem;
    color: #94A3B8;
}
.blog-debug-row label {
    width: 90px;
}
.blog-debug-row input[type=range] {
    flex: 1;
}
.blog-debug-row input[type=number] {
    width: 45px;
    background: transparent;
    color: white;
    border: 1px solid #333;
    margin-left: 5px;
    text-align: center;
}
</style>

<div style="background: #0f172a; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center; border: 1px solid rgba(255,255,255,0.1)">
    <!-- Yoga Figure Playground -->
    <svg viewBox="-300 -100 800 600" style="width: 100%; max-width: 600px; height: 350px; filter: drop-shadow(0 0 10px rgba(13, 148, 136, 0.3));" id="demo-svg">
        <line x1="-500" y1="368" x2="1000" y2="368" stroke="rgba(255,255,255,0.1)" stroke-width="2" />
        <g id="figure" style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-box: view-box; transform-origin: 100px 200px; transform: translate(var(--fig-x, 0px), var(--fig-y, 0px)) rotate(var(--fig-rot, 0deg));">
            <!-- Left Leg -->
            <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-box: view-box; transform-origin: 100px 200px; transform: rotate(var(--ll-rot, 0deg));">
                <line x1="100" y1="200" x2="100" y2="280" stroke="#94A3B8" stroke-width="14" stroke-linecap="round" />
                <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-box: view-box; transform-origin: 100px 280px; transform: rotate(var(--lk-rot, 0deg));">
                    <line x1="100" y1="280" x2="100" y2="360" stroke="#94A3B8" stroke-width="14" stroke-linecap="round" />
                </g>
            </g>
            <!-- Right Leg -->
            <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-box: view-box; transform-origin: 100px 200px; transform: rotate(var(--rl-rot, 0deg));">
                <line x1="100" y1="200" x2="100" y2="280" stroke="#F8FAFC" stroke-width="14" stroke-linecap="round" />
                <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-box: view-box; transform-origin: 100px 280px; transform: rotate(var(--rk-rot, 0deg));">
                    <line x1="100" y1="280" x2="100" y2="360" stroke="#F8FAFC" stroke-width="14" stroke-linecap="round" />
                </g>
            </g>
            <!-- Upper Body -->
            <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-box: view-box; transform-origin: 100px 200px; transform: rotate(var(--ub-rot, 0deg));">
                <!-- Left Arm -->
                <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-box: view-box; transform-origin: 100px 100px; transform: rotate(var(--la-rot, 0deg));">
                    <line x1="100" y1="100" x2="100" y2="160" stroke="#94A3B8" stroke-width="14" stroke-linecap="round" />
                    <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-box: view-box; transform-origin: 100px 160px; transform: rotate(var(--le-rot, 0deg));">
                        <line x1="100" y1="160" x2="100" y2="220" stroke="#94A3B8" stroke-width="14" stroke-linecap="round" />
                    </g>
                </g>
                <line x1="100" y1="200" x2="100" y2="100" stroke="#F8FAFC" stroke-width="16" stroke-linecap="round" />
                <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-box: view-box; transform-origin: 100px 100px; transform: rotate(var(--head-rot, 0deg));">
                    <line x1="100" y1="100" x2="100" y2="80" stroke="#F8FAFC" stroke-width="10" stroke-linecap="round" />
                    <circle cx="100" cy="65" r="20" fill="#F8FAFC" />
                </g>
                <!-- Right Arm -->
                <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-box: view-box; transform-origin: 100px 100px; transform: rotate(var(--ra-rot, 0deg));">
                    <line x1="100" y1="100" x2="100" y2="160" stroke="#F8FAFC" stroke-width="14" stroke-linecap="round" />
                    <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-box: view-box; transform-origin: 100px 160px; transform: rotate(var(--re-rot, 0deg));">
                        <line x1="100" y1="160" x2="100" y2="220" stroke="#F8FAFC" stroke-width="14" stroke-linecap="round" />
                    </g>
                </g>
            </g>
        </g>
    </svg>
    
    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 10px;">
        <button onclick="setPose({'--ub-rot':0, '--ll-rot':0, '--rl-rot':0, '--lk-rot':0,'--rk-rot':0, '--la-rot':0, '--ra-rot':0, '--le-rot':0, '--re-rot':0, '--head-rot':0, '--fig-y':0, '--fig-x':0})" style="padding: 8px 16px; background: #0d9488; color: white; border: none; border-radius: 20px; cursor: pointer;">Tadasana</button>
        <button onclick="setPose({'--ub-rot':0, '--head-rot':-20, '--la-rot':180, '--ra-rot':180, '--ll-rot':0, '--rl-rot':0, '--lk-rot':0, '--rk-rot':0, '--le-rot':0, '--re-rot':0, '--fig-y':0, '--fig-x':0})" style="padding: 8px 16px; background: #0d9488; color: white; border: none; border-radius: 20px; cursor: pointer;">Upward Salute</button>
        <button onclick="setPose({'--ub-rot':180, '--head-rot':0, '--la-rot':60, '--le-rot':-120, '--ra-rot':60, '--re-rot':-120, '--ll-rot':0, '--rl-rot':0, '--lk-rot':0, '--rk-rot':0, '--fig-y':8, '--fig-x':0})" style="padding: 8px 16px; background: #0d9488; color: white; border: none; border-radius: 20px; cursor: pointer;">Forward Fold</button>
        <button onclick="setPose({'--fig-rot': 0, '--fig-x': -110, '--fig-y': 168, '--ub-rot': 90, '--head-rot': 0, '--la-rot': 0, '--le-rot': 0, '--ra-rot': 0, '--re-rot': 0, '--ll-rot': -90, '--lk-rot': 180, '--rl-rot': -90, '--rk-rot': 180})" style="padding: 8px 16px; background: #0d9488; color: white; border: none; border-radius: 20px; cursor: pointer;">Child's Pose</button>
    </div>

    <!-- The Debug Panel -->
    <div class="blog-debug-panel" id="blog-debug-panel"></div>
</div>
<script>
const varsDef = [
    { id: '--fig-rot', min: -180, max: 180, label: 'Fig Rot' },
    { id: '--fig-x', min: -200, max: 200, label: 'Fig X' },
    { id: '--fig-y', min: -200, max: 200, label: 'Fig Y' },
    { id: '--ub-rot', min: -180, max: 180, label: 'Hip Bend' },
    { id: '--head-rot', min: -90, max: 90, label: 'Head' },
    { id: '--la-rot', min: -360, max: 360, label: 'L Arm Up' },
    { id: '--le-rot', min: -180, max: 180, label: 'L Arm Low' },
    { id: '--ra-rot', min: -360, max: 360, label: 'R Arm Up' },
    { id: '--re-rot', min: -180, max: 180, label: 'R Arm Low' },
    { id: '--ll-rot', min: -180, max: 180, label: 'L Leg Up' },
    { id: '--lk-rot', min: -180, max: 180, label: 'L Leg Low' },
    { id: '--rl-rot', min: -180, max: 180, label: 'R Leg Up' },
    { id: '--rk-rot', min: -180, max: 180, label: 'R Leg Low' },
];

let currentVars = {};
const svgMain = document.getElementById('demo-svg');
const panel = document.getElementById('blog-debug-panel');

varsDef.forEach(v => {
    const row = document.createElement('div');
    row.className = 'blog-debug-row';
    
    const lbl = document.createElement('label');
    lbl.textContent = v.label;
    lbl.setAttribute('for', 'inp_' + v.id);
    
    const range = document.createElement('input');
    range.type = 'range';
    range.id = 'inp_' + v.id;
    range.min = v.min;
    range.max = v.max;
    range.value = 0;
    
    const num = document.createElement('input');
    num.type = 'number';
    num.id = 'num_' + v.id;
    num.value = 0;

    const update = (val) => {
        range.value = val;
        num.value = val;
        currentVars[v.id] = parseInt(val);
        const cssVal = v.id.includes('rot') ? `${val}deg` : `${val}px`;
        svgMain.style.setProperty(v.id, cssVal);
    };

    range.addEventListener('input', (e) => update(e.target.value));
    num.addEventListener('input', (e) => update(e.target.value));

    row.appendChild(lbl);
    row.appendChild(range);
    row.appendChild(num);
    panel.appendChild(row);
});

function setPose(vars, targetId = 'demo-svg') {
    const targetSvg = document.getElementById(targetId);
    for (let k in vars) {
        if (targetId === 'demo-svg') {
            currentVars[k] = vars[k];
            const inp = document.getElementById('inp_' + k);
            const num = document.getElementById('num_' + k);
            if (inp && num) {
                inp.value = vars[k];
                num.value = vars[k];
            }
        }
        const cssVal = k.includes('rot') ? `${vars[k]}deg` : `${vars[k]}px`;
        targetSvg.style.setProperty(k, cssVal);
    }
}
</script>

## The Trigonometry of Chaturanga

Defining a standing pose is easy—you keep everything roughly at zero. But what happens when the body needs to hover entirely above the floor, supported only by the hands and toes?

In **Chaturanga Dandasana (Low Plank)**, the body must form a perfectly rigid incline plane. Since the toes rest on the floor (Y = 368) but the arms are bent 90 degrees at the elbow, the shoulders hover slightly lower than the hips.

Here is the math I used to solve this so the figure perfectly connected its toes and hands to the mat:

1. **Calculate the Vertical Drop**: The upper arm goes straight back, and the lower arm goes straight down. Since each arm segment is 60px, the vertical drop from Shoulder to Hand is exactly 60px.
2. **Find the Slope**: If the hands are at the floor (Y = 368), the shoulders must be exactly at `Y = 368 - 60 = 308`. The toes are also at the floor (Y = 368). This means the body drops 60 vertical pixels over its entire length.
3. **Trig to the Rescue**: The length of the Torso (100px) + the Legs (160px) creates a hypotenuse of 260px.

Because we know the opposite and the hypotenuse, we can solve for \(\theta\):

$$ \sin(\theta) = \frac{\text{Opposite}}{\text{Hypotenuse}} = \frac{60}{260} \approx 0.2307 $$

Taking the arcsine gives us our angle:

$$ \theta \approx \arcsin(0.2307) \approx 13.34^\circ $$

Because the torso points up from the hips, and the hips sit in the middle of our 260px line, we can apply this `13.34°` absolute rotation directly to the Torso and Legs:

- The Torso points Right (90° from UP), tilted *up* by 13.34° = **76.66°**.
- The Legs point Left (-90° from DOWN), tilted *down* by 13.34° = **76.66°**.

When you apply these calculated CSS angles, the stickman seamlessly lowers itself into a geometrically flawless plank.

<div style="background: #0f172a; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center; border: 1px solid rgba(255,255,255,0.1)">
    <div style="margin-bottom: 20px;">
        <button onclick="setPose({'--ub-rot':76.66, '--ll-rot':76.66, '--rl-rot':76.66, '--lk-rot':0,'--rk-rot':0, '--la-rot':-166.66, '--ra-rot':-166.66, '--le-rot':90, '--re-rot':90, '--head-rot':0, '--fig-y':131, '--fig-x':-50}, 'demo-svg-2')" style="padding: 8px 16px; background: #ea580c; font-weight: bold; color: white; border: none; border-radius: 20px; cursor: pointer; box-shadow: 0 4px 14px rgba(234, 88, 12, 0.4);">Execute Chaturanga</button>
        <button onclick="setPose({'--ub-rot':0, '--ll-rot':0, '--rl-rot':0, '--lk-rot':0,'--rk-rot':0, '--la-rot':0, '--ra-rot':0, '--le-rot':0, '--re-rot':0, '--head-rot':0, '--fig-y':0, '--fig-x':0}, 'demo-svg-2')" style="padding: 8px 16px; background: transparent; color: #94a3b8; border: 1px solid rgba(255,255,255,0.2); border-radius: 20px; cursor: pointer; margin-left: 10px;">Reset</button>
    </div>
    
    <svg viewBox="-300 -100 800 600" style="width: 100%; max-width: 600px; height: 350px; filter: drop-shadow(0 0 10px rgba(13, 148, 136, 0.3));" id="demo-svg-2">
        <line x1="-500" y1="368" x2="1000" y2="368" stroke="rgba(255,255,255,0.1)" stroke-width="2" />
        <g id="figure2" style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-box: view-box; transform-origin: 100px 200px; transform: translate(var(--fig-x, 0px), var(--fig-y, 0px)) rotate(var(--fig-rot, 0deg));">
            <!-- Left Leg -->
            <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-box: view-box; transform-origin: 100px 200px; transform: rotate(var(--ll-rot, 0deg));">
                <line x1="100" y1="200" x2="100" y2="280" stroke="#94A3B8" stroke-width="14" stroke-linecap="round" />
                <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-box: view-box; transform-origin: 100px 280px; transform: rotate(var(--lk-rot, 0deg));">
                    <line x1="100" y1="280" x2="100" y2="360" stroke="#94A3B8" stroke-width="14" stroke-linecap="round" />
                </g>
            </g>
            <!-- Right Leg -->
            <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-box: view-box; transform-origin: 100px 200px; transform: rotate(var(--rl-rot, 0deg));">
                <line x1="100" y1="200" x2="100" y2="280" stroke="#F8FAFC" stroke-width="14" stroke-linecap="round" />
                <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-box: view-box; transform-origin: 100px 280px; transform: rotate(var(--rk-rot, 0deg));">
                    <line x1="100" y1="280" x2="100" y2="360" stroke="#F8FAFC" stroke-width="14" stroke-linecap="round" />
                </g>
            </g>
            <!-- Upper Body -->
            <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-box: view-box; transform-origin: 100px 200px; transform: rotate(var(--ub-rot, 0deg));">
                <!-- Left Arm -->
                <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-box: view-box; transform-origin: 100px 100px; transform: rotate(var(--la-rot, 0deg));">
                    <line x1="100" y1="100" x2="100" y2="160" stroke="#94A3B8" stroke-width="14" stroke-linecap="round" />
                    <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-box: view-box; transform-origin: 100px 160px; transform: rotate(var(--le-rot, 0deg));">
                        <line x1="100" y1="160" x2="100" y2="220" stroke="#94A3B8" stroke-width="14" stroke-linecap="round" />
                    </g>
                </g>
                <line x1="100" y1="200" x2="100" y2="100" stroke="#F8FAFC" stroke-width="16" stroke-linecap="round" />
                <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-box: view-box; transform-origin: 100px 100px; transform: rotate(var(--head-rot, 0deg));">
                    <line x1="100" y1="100" x2="100" y2="80" stroke="#F8FAFC" stroke-width="10" stroke-linecap="round" />
                    <circle cx="100" cy="65" r="20" fill="#F8FAFC" />
                </g>
                <!-- Right Arm -->
                <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-box: view-box; transform-origin: 100px 100px; transform: rotate(var(--ra-rot, 0deg));">
                    <line x1="100" y1="100" x2="100" y2="160" stroke="#F8FAFC" stroke-width="14" stroke-linecap="round" />
                    <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-box: view-box; transform-origin: 100px 160px; transform: rotate(var(--re-rot, 0deg));">
                        <line x1="100" y1="160" x2="100" y2="220" stroke="#F8FAFC" stroke-width="14" stroke-linecap="round" />
                    </g>
                </g>
            </g>
        </g>
    </svg>
</div>

Math doesn't just ensure algorithms run efficiently; it gives us the power to orchestrate beautiful physical geometry. Take a look at the final [Yoga Poses application](/yoga.html) to see the full Ashtanga sequence running entirely on these trigonometric angles!
