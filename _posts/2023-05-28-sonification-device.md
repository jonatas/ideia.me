---
layout: post
title: Sonification Device
categories: [sonification, think]
---

Today I'm here to propose a new technological device: a data synthesizer to
leverage sonification projects and empower people with visual impairments to
also analyze data.

During the last few years I'm exploring data and I love to see how many
frameworks and technologies we have for understanding data. I can't count the 
number of plotting/charting libraries I've tried.

We have all types of tools to try to understand data. From spreadsheets which we
can just look to raw numbers to the most advanced business intelligence tools,
all of them are focused on non-blind people.

Here is my proposal: a hardware device to empower people with visual impairments
to understand data. My inspiration comes from a tech podcast that I was listening 
several years ago. A blind developer was being interviewed and he was using the
accessibility voice over technology with 8x speed.

If you think about 8x, you'll assume it's not possible to "listen" to what is
being said but he was listening to all the code and navigating efficiently in
the computer. Listening to that noise that were indeed accumulating dozens of
words per second, to guide the computer and also coding.

Since there, I started trying to develop the ability to speed up my audiobooks.
After 5 years, I'm already in 3x speed in English which is not my native language.
It's very similar to drive a car fast or play a racing game. You get used to
high speed at some point :)

Last week, I used the last minutes of my sonification workshop to also officially
pitch the idea to the participants, and here I'm to spread it to the world.
Here is my proposal: A **data synthesizer** - a device focused on sonification.


My passion for sonification started after I participate in the course
[Introduction to digital music architecture](https://coursera.org/) from the course
I ran a few experiments to experiment it.

My first sonification attempt was [dj-trader](https://github.com/jonatas/dj-trader).
Focused on listening to finance market data, I created a small interface with
[PureData](https://puredata.info) to stream finance data to my little toy/virtual synthesizer.

I also extracted sound from [mandalas](https://github.com/jonatas/mandalas)
that I manually painted during my degree on Art Therapy.

Yes! I did it as a gift to my self :)

In the last few months, I'm working on some demos showing how to synthesize time
series data with Sonic PI and TimescaleDB, but we need something more robust to
be able to really make some progress in this area.

My proposal is design a synthesizer specific to stream data and create noise
from it. Similar to music synthesizers like the classic Korgs and other
innovative devices. We need to create a base to the next generation of data
analysis through sound as well.

Sound is connected to our guts. We can feel it. It's directly wired to our
brain. Our vision is good with colors but our brain is keen to identify harmony 
even on very complex patterns. With a data synthesizer, we could create an
orchestra from the data.

Think about the noise from a car. It's a combination of engine, wind, tires
running in the terrain. You can easily identify the difference between a flat
tire and an issue in the engine. Your brain is able to read the noise and
identify pitfalls even it does not have any harmony nor pattern.

Now, imagine a future which allow you to listen to your company KPIs or
understand the health of a system. Similar to a car engine, the normality should
not be noisy but more you hear it, more presence you get from it.
Same works for laundry machines, refrigerators and so on.

My idea with the data synthesizer is create a friendly interface to make it easy
to explore data through sound mechanisms.

Jumping into some practical examples, my first sonification project to listen to
tick data from an asset used the following structure:

Price defines the pitch. Higher prices, higher pitches.
Volume of transactions define the BPM. More transactions mean more pulses of
data. As it's all about time series data, accelerating the beats per minute
makes you feel the market hurrying or slowing down.

The first analog synthesizers was just a matter of establishing a base frequency
and streaming the wave into other artificial wave transformers like envelopes,
low pass filters and so on. The knobs of the synthesizer brought an incredible
discoveries to progressive and rock bands in the sixties and seventies. Indeed
they're still widely used to massively improve sound quality and obviously
create music.

What if we leverage such amazing tools to create noise from data? What could we
discover?

I'm thinking about it in the last few months and here is a high level
description of what I see as a starting point to this project. From top bottom,
left to right, imagine a synthesizer with special extra knobs and buttons to
configure and pipe the data. Here is my initial suggestion:

```
+===============================================+
| <> data source > |________T__|    |__T________|
| [Y] sync    from |s m h d m y| to |s m h d m y|
+================[ channels ]===================+
| #     #      #      #     #     #     #     # |
| o     o      o      o     o     o     o     o |
| 1     2      3      4     5     6     7     8 |
+===============================================+

Legend:

<> knob
# Button
o Wire output
T Slider position
[Y] Swith to sync time dimension
```

* **data source** knob will allow to choose a data source, like a specific table column that you want to analyze the data.
* **from** and **to** are independent sliders to define how the time series data spectrum. Like a zoom with focus, it will synthesize years of data into secondsif the sliders are closer to each other, or stretch seconds of data to years of listening.
* **s m h d m y** are the labels to navigate in seconds, minutes, hours, days, months or years.

This configuration could be wired to any part of the synthesizer. From pitch to
any other component available. The sound wave would be manipulated and the knobs
adjusted depending on how the data sources wired to the synthesizer knobs.

Every channel could be working on a different time dimension or sync the time
dimension through the `[Y]` switch.

So, this is the core idea. If you get attracted to help me build such device or
sponsor my journey doing it, I'd be very happy to receive all the support I can.

My plan is start prototyping it with a web interface environment, reusing some analog synthesizer available on the web and leveraging all open source projects before jumping into a hardware for it. Maybe the hardware would not be necessary, but I see it as a plus.

If you have any comments or ideas, [please let me know](https://www.linkedin.com/in/jonatasdp/).

I'm very excited to and I can't wait to see the project coming to life. I'm really
looking for partners and sponsors to implement prototypes and feel the data.
Experiment it. I truly believe this idea can bring innovation on data analysis
and increase the sonification adoption as a tool. Encouraging the use of our
"parallel" senses more globally and make data science a more inclusive space
for people with visual impairments.

