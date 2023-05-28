---
layout: post
title: Sonification Device
categories: [ideas, sonification]
---

Fasten your seatbelts, fellow tech enthusiasts! Today, I'm thrilled to unveil a groundbreaking innovation that promises to redefine data analysis, particularly for those visually impaired: The **Data Synthesizer**. 

Imagine a world where visual barriers no longer limit the exploration and understanding of data. Over the years, my journey into the world of data has allowed me to tinker with countless charting libraries and delve into various technologies. The sheer number of tools we have at our disposal to dissect and understand data is staggering! From humble spreadsheets to sophisticated business intelligence tools, the possibilities seem endless. Yet, a major segment of our society, individuals with visual impairments, find their path blocked. But what if we could change that?

Enter the **Data Synthesizer**, an innovative device designed to transform data into a sonic experience, enabling individuals with visual impairments to "listen" to data and perform analysis. This idea sprang from an encounter I had years ago with a blind developer who skillfully navigated his computer using voice-over technology at an astonishing 8x speed. The very notion that one could absorb such a flurry of information audibly inspired me to push my own limits, and today I proudly listen to audiobooks at a respectable 3x speed. It's akin to driving a car or playing a racing game; eventually, you acclimate to the high speed. 

Now, I'm ready to share my brainchild with the world. Last week, during the final moments of a [sonification workshop](https://jonthebeach.com/workshops/Introductory-Workshop-for-Sonification-Process.-Creating-noise-with-Time-Series-data), I made my pitch to an enthusiastic crowd. Today, I take it a step further, spreading the idea globally and inviting you to partake in this exciting journey. 

My intrigue with sonification blossomed after attending the course [Introduction to Digital Music Architecture](https://coursera.org/). This experience led to a series of intriguing projects, like [dj-trader](https://github.com/jonatas/dj-trader), a playful tool I developed to sonify financial market data using [PureData](https://puredata.info). I even infused sound into [mandalas](https://github.com/jonatas/mandalas) I meticulously crafted during my Art Therapy degree. 

This journey has revealed the enormous potential of sonification, but the need for a more robust and dedicated tool was apparent. That's where the **Data Synthesizer** comes in, an innovative device designed to convert data streams into an auditory experience. In the vein of legendary music synthesizers, such as Korg, this device aims to establish a foundation for the next generation of data analysis via sonification.

Sound connects with us at a primal level. Our brains excel at identifying patterns and harmonies even in the most intricate compositions. With the data synthesizer, we could transform raw data into a symphony, letting us "feel" the patterns and trends that hide within. 

Consider the sounds a car makes. From the hum of the engine to the rush of wind, each sound provides valuable insights. We can discern a flat tire from an engine problem just by listening. Now, imagine applying this to data. Listening to your company's KPIs, understanding the health of a system, all through sound. A healthy system would have a pleasant, constant hum, while a hiccup would stand out immediately, much like a jarring noise in a well-oiled machine. 

The **Data Synthesizer** intends to be an intuitive interface, allowing users to explore data through auditory means. For example, in my first sonification project, the price of an asset dictated the pitch, while transaction volumes set the

 rhythm. The result was an immersive experience that presented data in a unique, engaging format.

Envision a synthesizer with knobs, buttons, and switches specially designed to configure and direct data, much like a music synthesizer. Below is a rudimentary layout of my vision:

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
* **from** and **to** are independent sliders to define how the time series data spectrum. Like a zoom with focus, it will synthesize years of data into seconds if the sliders are closer to each other, or stretch seconds of data to years of listening.
* **s m h d m y** are the labels to navigate in seconds, minutes, hours, days, months or years.

This configuration could be wired to any part of the synthesizer. From pitch to any other component available. The sound wave would be manipulated and the knobs adjusted depending on how the data sources wired to the synthesizer knobs.

Every channel could be working on a different time dimension or sync the time dimension through the `[Y]` switch.

I'm brimming with excitement as I work towards bringing this idea to life, and I'm actively seeking partners and sponsors to help me realize this dream. I plan to kick off the project with a web interface, leveraging existing open source projects before venturing into the hardware realm. 

If you have any ideas, thoughts, or suggestions, [I'd love to hear from you](https://www.linkedin.com/in/jonatasdp/). Let's bring innovation to data analysis, foster inclusivity, and embrace our "parallel" senses together. It's high time we listened to what our data has to say!

