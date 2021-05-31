---
layout: post
title: My first month at Timescale
---

Time flies! and here I am to share a bit more about my first-month adventures working on a genuinely open source company.

I'm so excited that sometimes, I can't resist. It's midnight yet, and here I am on my iTerm full screen alone with my thoughts... and my Vim. What a mind-blowing month!

I'm humbly revamping my SQL skills and truly getting to know how cool all the features that Timescale brings to Postgresql are.

I started contributing to our [docs](http://docs.timescale.com), and my first contribution was adding a few next steps in the [ruby tutorial](https://docs.timescale.com/timescaledb/latest/quick-start/ruby/).

I love benchmarks, I've been working with [tsbs](https://github.com/timescale/tsbs),
which looks very interesting and widely used by serious players to compare databases performance' for several types of time-series data.

Here is a small 7-minute test from my MacBook Pro M1 running tsbs and inserting
100 million rows into a table with 10 different column metrics + time and identifier:

```
Summary:
loaded 1036800000 metrics in 437.451sec with 8 workers (mean rate 2370091.68 metrics/sec)
loaded 103680000 rows in 437.451sec with 8 workers (mean rate 237009.17 rows/sec)
```

2.3 million metrics per second looks quite impressive for a small 13-inch MacBook, right?
The funny part is that I was working and using the computer in parallel, yet it was far from allocating all the CPU/IO resources.

It's also refreshing my memory on what I know about GoLang. It's pretty cool to remember how simple it is to work with Go and how winning is the architecture of the Go applications.

I'm also happy with the opportunity to review PRs on tsbs and better understand how other database systems work. This week I reviewed a few contributions from Redis collaborators and learned a lot GoLang and the tsbs project.

One "aha!" moment this month was learning about
[SkipScan](https://blog.timescale.com/blog/how-we-made-distinct-queries-up-to-8000x-faster-on-postgresql/);
a feature that improves the performance of `DISTINCT` queries 
incrementally jumping from one ordered value to the next without
reading all of the rows in between. Though it's specific to one type of query,
also widely used in various kinds of applications, and the improvements
makes it 8000x times faster 🚀

The most exciting part of this feature is that it affects the Postgres query
plan and not only [hypertables](https://docs.timescale.com/timescaledb/latest/overview/core-concepts/hypertables-and-chunks/).

It's interesting to see that the SkipScan draft was already in the community for a few years, but it's pretty hard to orchestrate it with all other community contributions. It also makes me think how cool and powerful it is to build extensions that can be natively expanding and replacing some core components
for specific optimizations. I'm a bit far from understanding the code itself but happy to see the opportunity we have when we have a reliable plug-and-play architecture like Postgres offers.

A few days ago, I started my data nerd project to "save the internet in my pocket"; intrigued to explore how people are writing in the engineering blogs. I also use it as a playground to feed my curiosity and get up-to-date with Postgresql's text searches. My research is still in progress, but all results are available. Feel free to contribute with ideas or feedback! 

[github.com/jonatas/blog-sniffer](https://github.com/jonatas/blog-sniffer).

You can find both code and research results so you can try it yourself ;)

