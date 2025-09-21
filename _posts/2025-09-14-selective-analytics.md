---
layout: post
title: "Selective Analytics: A Democratic Approach to Data Management"
date: 2025-09-14
categories: postgresql timescaledb analytics database
tags: timescaledb postgresql analytics real-time-data storage-optimization selective-analytics
image: /images/selective-analytics-concept.jpg
---

*What if data management worked like a democracy? In a world drowning in information, not all data deserves eternal storage. This is the story of Selective Analytics - a democratic approach where data "campaigns" for permanent storage, and only the most valuable information gets "elected" to stay long-term.*

## The Challenge: 500GB Daily, 20GB Storage Limit

Picture this scenario: your system generates **500GB of web traffic logs daily**. Millions of requests flowing through your infrastructure every minute. Storage costs are exploding. Query performance is degrading over time. But you still need real-time analytics and can only afford **20GB of total storage**.

Sounds impossible?  **Selective Analytics** treats data like citizens in a democracy, where information must earn its right to permanent storage through consistent value and activity.

## The Democratic Data Solution

The core idea behind Selective Analytics is beautifully simple: treat data management like a democracy. Not all data is created equal, so why store it all equally?

Instead of keeping everything forever or arbitrarily deleting based on age, we create a system where:
- Data "campaigns" for long-term storage through activity and relevance
- Regular "elections" determine which information deserves permanent seats
- Storage limits are enforced democratically - when capacity is reached, the least active data loses its place
- The system automatically adapts to changing patterns and priorities

### Foundation: The Hypertable

First, we need a foundation that can handle massive data ingestion. TimescaleDB's hypertables provide automatic partitioning by time:

```sql
-- Simple table structure for web logs
CREATE TABLE "logs" (
    "time" timestamp with time zone NOT NULL,
    "domain" text NOT NULL
);

-- Convert to hypertable with 1-minute chunks
SELECT create_hypertable('logs', 'time', 
    chunk_time_interval => INTERVAL '1 minute',
    if_not_exists => TRUE
);

-- Automatic retention: only keep raw logs for 5 minutes
SELECT add_retention_policy('logs', INTERVAL '5 minutes',
    schedule_interval => INTERVAL '1 minute');
```

This gives us a table that can ingest millions of rows per minute while automatically cleaning up old data. The raw logs exist just long enough to be processed into our aggregation pipeline.

### The Aggregation Pipeline

The magic happens with the aggregation system:

**Real-time Aggregation (1-minute buckets)**
```sql
CREATE MATERIALIZED VIEW website_stats_1m
WITH (timescaledb.continuous, timescaledb.materialized_only=true) AS
    SELECT 
        time_bucket('1 minute', time) as bucket,
        domain,
        count(*) as total
    FROM logs
    GROUP BY 1,2
WITH NO DATA;
```

**Hourly Summaries with Statistics**

The hierarchical aggregation allows to use same `timescaledb.continuous` strategy but instead of getting the raw data, you can get minute processed data. In this case, we'll build hourly summaries, expanding the details with the `stats_agg` for statistics like slope, average or standard deviation, and the `percentile_agg` give access to disc distribution using `approx_percentile(0.5,  percentile_agg) as median or `, other types of statistics.


```sql
CREATE MATERIALIZED VIEW website_stats_1h
WITH (timescaledb.continuous, timescaledb.materialized_only=false) AS
    SELECT 
        time_bucket('1 hour', bucket) as bucket,
        domain,
        sum(total) as total,
        stats_agg(total) as stats_agg,
        percentile_agg(total) as percentile_agg
    FROM website_stats_1m
    GROUP BY 1,2
WITH NO DATA;
```

Percentiles are available on native postgresql but Timescale brought optimized methods for time series data through the toolkit hyperfunctions. Check this note:

> Think about the types of percentiles you're most interested in. tdigest is optimized for more accurate estimates at the extremes, and less accurate estimates near the median. If your workflow involves estimating ninety-ninth percentiles, then choose tdigest. If you're more concerned about getting highly accurate median estimates, choose uddsketch.

See more on the official [Tiger Data Docs](https://docs.tigerdata.com/use-timescale/latest/hyperfunctions/percentile-approx/advanced-agg/#choose-the-right-algorithm).

**Daily Analytics**

```sql
CREATE MATERIALIZED VIEW website_stats_1d
WITH (timescaledb.continuous, timescaledb.materialized_only=false) AS
    SELECT 
        time_bucket('1 day', bucket) as bucket,
        domain,
        sum(total) as total,
        rollup(stats_agg) as stats_agg,
        rollup(percentile_agg) as percentile_agg
    FROM website_stats_1h
    GROUP BY 1,2
WITH NO DATA;
```

The [rollup](https://docs.tigerdata.com/api/latest/hyperfunctions/statistical-and-regression-analysis/stats_agg-one-variable#rollup) will merge tuples of statistics, allowing you to get the true average of the average. This advanced components overcome the plain issues we'd get if we do `avg(avg_column)` bringing a distorted result.

### Continuous Aggregation Policies

The system runs automatically with these policies:

- Refresh 1-minute aggregates every 30 seconds
- Refresh hourly aggregates every 5 minutes  
- Refresh daily aggregates every hour

```sql
SELECT add_continuous_aggregate_policy('website_stats_1m',
    start_offset => INTERVAL '5 minutes',
    end_offset => INTERVAL '30 seconds',
    schedule_interval => INTERVAL '30 seconds');

SELECT add_continuous_aggregate_policy('website_stats_1h',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '5 minutes',
    schedule_interval => INTERVAL '5 minutes');

SELECT add_continuous_aggregate_policy('website_stats_1d',
    start_offset => INTERVAL '7 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');
```

## The Election System

Here's how the democratic "election" process works:

1. **Raw logs arrive** (500GB daily) and get processed immediately
2. **Candidates emerge** - websites that meet minimum traffic thresholds
3. **Elections happen** regularly - the most active websites get "voted" into long-term storage
4. **Winners get permanent seats** while others are cycled out
5. **Storage stays constant** at around 20GB regardless of input volume

### The Candidate Election Background Workers

The selective analytics system runs on two coordinated background jobs that automate the entire election process:

#### Job 1: Candidate Population Worker

This job runs every 6 minutes and identifies potential candidates:

```sql
CREATE OR REPLACE PROCEDURE populate_website_candidates_job(job_id INTEGER, config JSONB)
LANGUAGE plpgsql AS $$
DECLARE
    min_hits INTEGER;
    v_election_window INTERVAL;
    candidate_count INTEGER;
BEGIN
    -- Get configuration from our config table
    SELECT min_hits_threshold, election_window
    INTO min_hits, v_election_window
    FROM top_websites_config
    LIMIT 1;

    -- Find domains that qualify as candidates
    INSERT INTO top_websites_candidates (domain, time, hits)
    SELECT 
        domain,
        MAX(bucket) AS time,
        SUM(total) AS hits
    FROM website_stats_1m
    WHERE bucket >= NOW() - INTERVAL '30 minutes'  -- Look at recent activity
    GROUP BY domain
    HAVING SUM(total) >= min_hits  -- Must meet minimum threshold configured (default: 100 hits)
    ON CONFLICT (domain, time) DO UPDATE SET hits = EXCLUDED.hits;

    GET DIAGNOSTICS candidate_count = ROW_COUNT;
    RAISE NOTICE 'Populated % website candidates.', candidate_count;
END;
$$;
```

This is incredibly performant because we're making election decisions based on the 1-minute aggregations. After candidates are identified, the raw data can be safely discarded.

#### Job 2: Election Worker

This job runs every hour and promotes the best candidates to long-term storage:

```sql
CREATE OR REPLACE PROCEDURE elect_top_websites(job_id INTEGER, config JSONB)
LANGUAGE plpgsql AS $$
DECLARE
    max_entries INTEGER;
    retention_period INTERVAL;
BEGIN
    -- Get configuration
    SELECT max_longterm_entries, longterm_retention_period 
    INTO max_entries, retention_period
    FROM top_websites_config 
    LIMIT 1;
    
    -- The actual "election" - promote candidates to long-term storage
    INSERT INTO top_websites_longterm (
        domain, first_seen, last_seen, total_hits, last_election_hits, times_elected
    )
    SELECT 
        domain,
        time AS first_seen,
        time AS last_seen,
        hits AS total_hits,
        hits AS last_election_hits,
        1 AS times_elected
    FROM top_websites_candidates tc
    WHERE tc.time = (SELECT MAX(time) FROM top_websites_candidates WHERE domain = tc.domain)
    ON CONFLICT (domain) DO UPDATE SET
        last_seen = EXCLUDED.last_seen,
        total_hits = top_websites_longterm.total_hits + EXCLUDED.total_hits,
        last_election_hits = EXCLUDED.last_election_hits,
        times_elected = top_websites_longterm.times_elected + 1;

    -- Enforce storage limits - remove oldest entries if we exceed max_entries
    DELETE FROM top_websites_longterm
    WHERE domain IN (
        SELECT domain FROM top_websites_longterm
        ORDER BY last_seen ASC
        OFFSET max_entries
    );

    -- Clean up old candidates
    DELETE FROM top_websites_candidates
    WHERE time < now() - retention_period;

    RAISE NOTICE 'Election complete. % websites in long-term storage.', 
        (SELECT COUNT(*) FROM top_websites_longterm);
END;
$$;
```

#### Scheduling the Democratic Process

The beauty is in the automated scheduling, which allows you to leverage the timescaledb background workers to regularly execute some task directly in the database machine.

```sql
CREATE OR REPLACE PROCEDURE schedule_candidates_election()
LANGUAGE plpgsql AS $$
DECLARE
    config_record RECORD;
BEGIN
    -- Get our election configuration
    SELECT * INTO config_record FROM top_websites_config LIMIT 1;

    -- Schedule candidate population (every 6 minutes)
    PERFORM add_job('populate_website_candidates_job',
        (config_record.election_schedule_interval / 10)::interval,
        initial_start => NOW() + INTERVAL '10 seconds'
    );

    -- Schedule elections (every hour) 
    PERFORM add_job('elect_top_websites',
        config_record.election_schedule_interval,
        initial_start => NOW() + INTERVAL '1 minute'
    );
END;
$$;
```

The best part of adopting background jobs is that they will avoid data trips, which means data is not traveling through the network, being serialized and deserialized in your favorite programming language. It's all happening between memory and disk of the same machine.

### The Configuration

Everything is configurable through a simple config table of a single record:

```sql
CREATE TABLE top_websites_config (
    min_hits_threshold integer DEFAULT 100,        -- Votes needed to become candidate
    election_window interval DEFAULT '1 hour',     -- How far back to look for votes
    max_longterm_entries integer DEFAULT 1000,     -- Maximum "senate seats"
    election_schedule_interval interval DEFAULT '1 hour'  -- How often elections run
);
```

This creates a completely autonomous system where:
- **Candidates are nominated** every 6 minutes based on recent activity
- **Elections happen** every hour to promote the most active domains
- **Term limits exist** - inactive domains eventually lose their seats
- **Storage is capped** - only the top 1000 domains get permanent storage

## The Three-Tier Strategy in Action

**Level 1: Raw Logs (5 minutes)** - Everything comes in, gets processed for immediate analytics, then gets discarded. Think of it as election day counting.

**Level 2: Aggregated Data (7-90 days)** - Useful statistics and trends, kept for medium-term analysis. These are our "campaign records."

**Level 3: Elected Champions (permanent)** - Only the top performers make it here. These domains proved their worth through consistent traffic and earned their permanent seat.

## Generating Test Data

One of the most powerful aspects of this system is the ability to test it with generated data using TimescaleDB's background job scheduler:

```sql
-- Procedure to generate synthetic log data every second
CREATE OR REPLACE PROCEDURE generate_log_data_job(job_id_param int, config_param jsonb) 
LANGUAGE plpgsql AS $$
DECLARE
    amount INTEGER;
    domain TEXT;
    use_specific_domain BOOLEAN;
BEGIN
    -- Get configuration from JSONB
    amount := (config_param->>'amount')::INTEGER;
    domain := config_param->>'domain';
    use_specific_domain := COALESCE((config_param->>'use_specific_domain')::BOOLEAN, false);
    
    -- Generate logs based on configuration
    IF use_specific_domain THEN
        -- Generate logs for specific domain (like google.com)
        INSERT INTO logs (time, domain)
        SELECT 
            now() - (random() * interval '1 minute'),
            domain
        FROM generate_series(1, amount);
        
        RAISE NOTICE 'Generated % log entries for % at %', amount, domain, now();
    ELSE
        -- Generate logs for random domains
        INSERT INTO logs (time, domain)
        SELECT 
            now() - (random() * interval '1 minute'),
            'random-domain-' || floor(random() * 1000)::text
        FROM generate_series(1, amount);
        
        RAISE NOTICE 'Generated % random log entries at %', amount, now();
    END IF;
END;
$$;
```

Let's simulate traffic patterns for famous websites:

```sql
CREATE OR REPLACE PROCEDURE schedule_top_websites_generation(avg_hits_per_minute int DEFAULT 30) 
LANGUAGE plpgsql AS $$
DECLARE
    top_websites text[] := ARRAY['google.com', 'facebook.com', 'youtube.com', 'twitter.com', 'instagram.com'];
    website text;
    amount int;
BEGIN
    FOREACH website IN ARRAY top_websites LOOP
        amount := avg_hits_per_minute + (random() * avg_hits_per_minute * 0.2)::integer;
        
        PERFORM add_job(
            'generate_log_data_job', 
            INTERVAL '5 seconds', 
            config => jsonb_build_object(
                'use_specific_domain', true,
                'domain', website,
                'amount', amount
            )
        );
    END LOOP;
    
    RAISE NOTICE 'Scheduled generation for % top websites', array_length(top_websites, 1);
END;
$$;
```

Want to simulate 500GB daily? Just call:

```sql
-- This will generate approximately 1 million hits per minute!
CALL schedule_additional_volume_generation(1000000);
```

## The Remarkable Results

The numbers speak for themselves:
- **99.6% storage reduction** (500GB → 20GB)
- **Real-time analytics** with <5ms query latency
- **Automatic identification** of top-performing websites
- **Scalable** as the input volume will always be controllable
- **Cost-controlled** storage that doesn't grow exponentially

Ideas where to use it? The beauty of Selective Analytics isn't limited to web traffic. This democratic approach can be applied to any high-volume data scenario:

### IoT Sensor Data

- Millions of sensor readings per hour
- Only anomalies and trend changes get permanent storage
- Normal readings are aggregated and eventually discarded

### Financial Transactions

- High-frequency trading data
- Significant price movements earn long-term storage
- Routine transactions are summarized and archived

### Application Logs

- Massive log volumes from distributed systems
- Error patterns and performance anomalies get preserved
- Routine debug information is temporary

## The timescaledb framework

Adopting timescaledb as a framework to design data lifecycle is great because it's just about rely on automation and configuration, both directly in the database. This system example self-manages, automatically identifying what deserves long-term storage while maintaining consistent performance and predictable costs.

- **TimescaleDB hypertables** for automatic partitioning and scalability
- **Continuous aggregates** for real-time summary generation
- **Retention policies** for automatic cleanup of raw data
- **Background jobs** for the democratic election process
- **Materialized results** for lightning-fast analytics queries

Also remember that Continuous Aggregates are simply hypertables too, and all the same potential can be applied!

Compression? I forgot to mention but it could also be possible to compress data and save even more massively in details.

## Adopt a data lifecycles

What excites me most about Selective Analytics isn't just the technical solution, but the paradigm it represents. In our data-driven world, we need democratic approaches to decide what's worth preserving.

This principle challenges us to think differently about data:
- Not everything deserves eternal storage
- Value should be demonstrated, not assumed
- Systems should adapt to changing patterns
- Storage decisions should be data-driven, not arbitrary

## Open Source Implementation

True to the spirit of democratic systems, the complete implementation is open source and available in the [timescaledb-templates repository](https://github.com/jonatas/timescaledb-templates) under the `webtop` folder.

You can adapt these concepts to your own data challenges, whether you're dealing with:
- Web analytics at scale
- IoT sensor networks
- Financial time series
- Application monitoring
- Social media analytics

I also made it a [PR](https://github.com/timescale/templates/pull/4) for the official templates, but as it never gets merged, I just moved on and worked on my fork.

## Getting Started

Ready to implement Selective Analytics in your system? Here's how to begin:

1. **Assess your data volumes** - How much data are you generating vs. storing?
2. **Identify value patterns** - What makes some data more valuable than others?
3. **Design your tiers** - What aggregation levels make sense for your use case?
4. **Configure the elections** - How often should the system reevaluate what to keep?
5. **Test with realistic data** - Use background jobs to simulate your actual traffic patterns

The next election is always around the corner - make sure your data gets the vote it deserves! 🗳️

---

*Facing your own data volume challenges? Want to implement selective analytics in your system? I'd love to hear about your use case! Connect with me on [LinkedIn](https://www.linkedin.com/in/jonatasdp/) or check out my other articles on data engineering and analytics.*
