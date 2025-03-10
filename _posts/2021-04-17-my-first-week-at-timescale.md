---
title: "My first week at Timescale"
layout: post
description: "I'm thrilled to announce that I joined [Timescale] as a developer advocate. My first week ended with a lot of excitement about what comes next."
date: 2021-04-17
---
I'm thrilled to announce that I joined [Timescale] as a developer advocate. My first week ended with a lot of excitement about what comes next.

I love working with Postgresql. It was always my brainless choice for any backend project I worked on that needs a relational database.

At university, I refused the student license to learn paid databases because I already knew Postgres :)

As Postgresql evolved with the community, it now contains dozens of unique features to benefit and stick with the same technology.

When I saw the fantastic work that Timescale is doing, I feel that it was a unique opportunity to learn more and have a broad impact on the community.

I love public speaking, pair programming, and live coding. I'll continue inspiring more people to try new concepts, building content to empower the community, and master Postgres and time series on SQL.

I worked for almost five years in financial markets. I never had the opportunity to put the market data on a database because it was too slow to digest the incoming events from the financial markets. The infrastructure was so poor and expensive that plain CSV per day split by stock symbol' was always the most reasonable choice.

Indeed [hypertables] allows you to do something similar with [data tiering], allowing the user to set different [retention policies] to accommodate the data based on the algorithmic needs.

On average, a single stock can generate hundreds of events per second. It becomes very slow as sometimes the "rain" of events becomes a "thunderstorm" as the market heats with the news. How the algorithms digest data is essential to real-time decisions. It's a vital attribute of a high frequency for trading systems.

Today, almost every business has its associated events, and they need to track the information for some days while the information is still "hot". Later, this information is less relevant and serves as historical data. Example:

Let's get a Department of Transport and Main Roads: their main target is to offer the most efficient traffic flow in the streets. If they need to access some information, the essential is the freshest information. The previous days can flow through some aggregation system that saves the volume of cars per hour/minute.

Timeseries data is everywhere as an event happens at a specific point in time.  Creating advanced technology to better digest and store the data in a long-term perspective seems pretty exciting to me. Life events will never go away. They'll be around forever. Postgresql, at the same time, is open source, reliable, and incredibly fast.

I'm proud to start working closer to these great minds.

People with a laser focus on building high performant algorithms, which commit to open source and make the Postgresql database better and widely adopted, work on issues that all companies need.

I'm feeling truly aligned with the company vision and grateful for all the support I'm getting here. \o/

[Timescale]: https://www.timescale.com
[hypertables]: https://docs.timescale.com/latest/using-timescaledb/hypertables
[retention policies]: https://docs.timescale.com/latest/using-timescaledb/data-retention
[data tiering]: https://docs.timescale.com/latest/using-timescaledb/data-tiering
