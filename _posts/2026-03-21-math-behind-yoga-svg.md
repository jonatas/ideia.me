---
layout: post
title: "The Math Behind the Yoga SVG"
categories: ['programming', 'math', 'yoga', 'svg']
tags: ['svg', 'geometry', 'trigonometry', 'css-animations', 'front-end']
description: "How simple trigonometry and CSS variables combine to create anatomically connected, fully animatable SVG stick figures for yoga."
---

When I set out to build an [Interactive Yoga Poses App](/yoga.html), I wanted the transitions between poses to feel organic. If you've ever tried to animate a complex vector graphic, you know the struggle: limbs detach, elbows bend the wrong way, and figures often look like they're breaking apart mid-animation.

The solution wasn't a complex JavaScript animation library. It was geometry.

By anchoring an SVG figure correctly and relying on pure CSS rotational variables, you can create a skeleton that inherently understands its own joints.

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

<div style="background: #0f172a; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center; border: 1px solid rgba(255,255,255,0.1)">
    <svg viewBox="-200 -50 600 450" style="width: 100%; max-width: 400px; height: 300px; filter: drop-shadow(0 0 10px rgba(13, 148, 136, 0.3));" id="demo-svg">
        <line x1="-500" y1="368" x2="1000" y2="368" stroke="rgba(255,255,255,0.1)" stroke-width="2" />
        <g id="figure" style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-origin: 100px 200px; transform: translate(var(--fig-x, 0px), var(--fig-y, 0px)) rotate(var(--fig-rot, 0deg));">
            <!-- Left Leg -->
            <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-origin: 100px 200px; transform: rotate(var(--ll-rot, 0deg));">
                <line x1="100" y1="200" x2="100" y2="280" stroke="#94A3B8" stroke-width="14" stroke-linecap="round" />
                <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-origin: 100px 280px; transform: rotate(var(--lk-rot, 0deg));">
                    <line x1="100" y1="280" x2="100" y2="360" stroke="#94A3B8" stroke-width="14" stroke-linecap="round" />
                </g>
            </g>
            <!-- Right Leg -->
            <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-origin: 100px 200px; transform: rotate(var(--rl-rot, 0deg));">
                <line x1="100" y1="200" x2="100" y2="280" stroke="#F8FAFC" stroke-width="14" stroke-linecap="round" />
                <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-origin: 100px 280px; transform: rotate(var(--rk-rot, 0deg));">
                    <line x1="100" y1="280" x2="100" y2="360" stroke="#F8FAFC" stroke-width="14" stroke-linecap="round" />
                </g>
            </g>
            <!-- Upper Body -->
            <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-origin: 100px 200px; transform: rotate(var(--ub-rot, 0deg));">
                <!-- Left Arm -->
                <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-origin: 100px 100px; transform: rotate(var(--la-rot, 0deg));">
                    <line x1="100" y1="100" x2="100" y2="160" stroke="#94A3B8" stroke-width="14" stroke-linecap="round" />
                    <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-origin: 100px 160px; transform: rotate(var(--le-rot, 0deg));">
                        <line x1="100" y1="160" x2="100" y2="220" stroke="#94A3B8" stroke-width="14" stroke-linecap="round" />
                    </g>
                </g>
                <line x1="100" y1="200" x2="100" y2="100" stroke="#F8FAFC" stroke-width="16" stroke-linecap="round" />
                <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-origin: 100px 100px; transform: rotate(var(--head-rot, 0deg));">
                    <line x1="100" y1="100" x2="100" y2="80" stroke="#F8FAFC" stroke-width="10" stroke-linecap="round" />
                    <circle cx="100" cy="65" r="20" fill="#F8FAFC" />
                </g>
                <!-- Right Arm -->
                <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-origin: 100px 100px; transform: rotate(var(--ra-rot, 0deg));">
                    <line x1="100" y1="100" x2="100" y2="160" stroke="#F8FAFC" stroke-width="14" stroke-linecap="round" />
                    <g style="transition: transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1); transform-origin: 100px 160px; transform: rotate(var(--re-rot, 0deg));">
                        <line x1="100" y1="160" x2="100" y2="220" stroke="#F8FAFC" stroke-width="14" stroke-linecap="round" />
                    </g>
                </g>
            </g>
        </g>
    </svg>
    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
        <button onclick="setPose({'--ub-rot':0, '--ll-rot':0, '--rl-rot':0, '--lk-rot':0,'--rk-rot':0, '--la-rot':0, '--ra-rot':0, '--le-rot':0, '--re-rot':0, '--head-rot':0, '--fig-y':0, '--fig-x':0})" style="padding: 8px 16px; background: #0d9488; color: white; border: none; border-radius: 20px; cursor: pointer;">Tadasana</button>
        <button onclick="setPose({'--ub-rot':126, '--ll-rot':36, '--rl-rot':36, '--lk-rot':0,'--rk-rot':0, '--la-rot':180, '--ra-rot':180, '--le-rot':0, '--re-rot':0, '--head-rot':0, '--fig-y':38.6, '--fig-x':0})" style="padding: 8px 16px; background: #0d9488; color: white; border: none; border-radius: 20px; cursor: pointer;">Downward Dog</button>
        <button onclick="setPose({'--ub-rot':0, '--ll-rot':60, '--rl-rot':-90, '--lk-rot':0,'--rk-rot':90, '--la-rot':90, '--ra-rot':-90, '--le-rot':0, '--re-rot':0, '--head-rot':0, '--fig-y':88, '--fig-x':0})" style="padding: 8px 16px; background: #0d9488; color: white; border: none; border-radius: 20px; cursor: pointer;">Warrior II</button>
    </div>
</div>
<script>
function setPose(vars) {
    const svg = document.getElementById('demo-svg');
    for (let k in vars) {
        svg.style.setProperty(k, vars[k] + (k.includes('x') || k.includes('y') ? 'px' : 'deg'));
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
    <button onclick="setPose({'--ub-rot':76.66, '--ll-rot':76.66, '--rl-rot':76.66, '--lk-rot':0,'--rk-rot':0, '--la-rot':-166.66, '--ra-rot':-166.66, '--le-rot':90, '--re-rot':90, '--head-rot':0, '--fig-y':131, '--fig-x':-50})" style="padding: 8px 16px; background: #ea580c; font-weight: bold; color: white; border: none; border-radius: 20px; cursor: pointer;">Execute Chaturanga</button>
</div>

Math doesn't just ensure algorithms run efficiently; it gives us the power to orchestrate beautiful physical geometry. Take a look at the final [Yoga Poses application](/yoga.html) to see the full Ashtanga sequence running entirely on these trigonometric angles!
