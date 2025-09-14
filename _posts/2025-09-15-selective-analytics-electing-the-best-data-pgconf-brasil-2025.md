---
layout: post
title: "Selective Analytics: Electing the Best Data for Long-term Storage"
date: 2025-09-15 10:00:00 -0300
categories: postgresql timescaledb conferences analytics
tags: pgconf-brasil timescaledb postgresql analytics real-time-data storage-optimization
image: /images/pgconf-brazil-2025-jonatas-on-stage-with-sql.jpg
---

*Coming back to PGConf Brasil after years felt like a homecoming. João Pessoa welcomed me with warm Brazilian hospitality, amazing PostgreSQL community, and the perfect stage to share one of my most exciting projects: the 500GB Challenge with Selective Analytics.*

![On stage at PGConf Brasil 2025](/images/pgconf-brazil-2025-jonatas-on-stage-with-sql.jpg)
*Demonstrating real-time analytics with PostgreSQL and TimescaleDB at PGConf Brasil 2025*

## The Challenge: 500GB Daily, 20GB Storage Limit

Picture this: your system generates **500GB of web traffic logs daily**. Millions of requests per minute. Storage costs exploding. Performance degrading over time. But you need real-time analytics and can only afford **20GB of storage**.

Impossible? Not with what I call **Selective Analytics** - a democratic approach where data "campaigns" for permanent storage, and only the most valuable information gets "elected" to stay long-term.

This was a funny and challenging vibe coding project that I feel very proud of 🤓

### The PostgreSQL Performance Workshop

Everytime I have the opportunity to travel far I try to get extra opportunities to engage with the audience and propose extra workshops or activities to worth my long trips.

I ran [this](https://github.com/timescale/postgresql-performance-for-rubyists) workshop as Postgresql Performance for Rubyists and this time I thought why not offer it language agnostic? So, I [did it](https://github.com/jonatas/postgresql-performance-workshops) and now I repurpose it as a pure SQL version too.

I'm so glad it worked. I prepared it for Ruby Community Conference in Krakow, later offered at Tropical On Rails in São Paulo, and this time in João Pessoa at PGConf Brazil.

![Workshop group selfie](/images/pgconf-brazil-2025-jonatas-workshop-selfie.jpg)
*Workshop group selfie during the PostgreSQL Performance Workshop*

The **PostgreSQL Performance Workshop for Developers** is an intro to database internals. Understand storage and concepts that you generally don't learn until you need to handle query optimization tasks, indexing strategies reviewing. This performance tuning techniques always make me happy because understanding database internals made me a better developer.

![Teaching the workshop](/images/pgconf-brazil-2025-jonatas-workshop-smiling-far-distance.jpg)
*Teaching PostgreSQL performance optimization techniques*

### My talk: The 500GB Challenge

The next day, I took the main stage to present the "500GB challenge with TimescaleDB" - a real-world problem that led to the development of what I now call **Selective Analytics**.

![Animated presentation](/images/pgconf-brazil-2025-jonatas-speaking-with-hands.jpg)
*Engaging the audience with hands-on PostgreSQL examples*

I was quite happy that I presented the same talk on the previous saturday on PGDay Xap - in Chapecó, a city 2 hours from home.

## The Democratic Data Solution

The core idea behind Selective Analytics is beautifully simple: treat data management like a democracy. Not all data is created equal, so why store it all equally?

### The Hypertable

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

This gives us a table that can ingest millions of rows per minute while automatically cleaning up old data.

### The Three-Tier Pipeline

The magic happens in our three-tier aggregation pipeline:

**Tier 1: Real-time Aggregation (1-minute buckets)**
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

**Tier 2: Hourly Summaries with Statistics**
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

**Tier 3: Daily Analytics**
```sql
CREATE MATERIALIZED VIEW website_stats_1d
WITH (timescaledb.continuous, timescaledb.materialized_only=false) AS
    SELECT 
        time_bucket('1 day', bucket) as bucket,
        domain,
        sum(total) as total,
        stats_agg(total) as stats_agg,
        percentile_agg(total) as percentile_agg
    FROM website_stats_1h
    GROUP BY 1,2
WITH NO DATA;
```

### Continuous Aggregation Policies

The system runs automatically with these policies:

```sql
-- Refresh 1-minute aggregates every 30 seconds
SELECT add_continuous_aggregate_policy('website_stats_1m',
    start_offset => INTERVAL '5 minutes',
    end_offset => INTERVAL '30 seconds',
    schedule_interval => INTERVAL '30 seconds');

-- Refresh hourly aggregates every 5 minutes  
SELECT add_continuous_aggregate_policy('website_stats_1h',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '5 minutes',
    schedule_interval => INTERVAL '5 minutes');

-- Refresh daily aggregates every hour
SELECT add_continuous_aggregate_policy('website_stats_1d',
    start_offset => INTERVAL '7 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');
```

### The Election System

Here's how the "election" works:

1. **Raw logs arrive** (500GB daily) and get processed immediately
2. **Candidates emerge** - websites that meet minimum traffic thresholds
3. **Elections happen** regularly - the most active websites get "voted" into long-term storage
4. **Winners get permanent seats** while others are cycled out
5. **Storage stays constant** at around 20GB regardless of input volume

### The Candidate Election Background Workers

The selective analytics system runs on two coordinated background jobs that automate the entire election process:

#### Job 1: Candidate Population Worker

This job runs every 6 minutes (election_interval / 10) and identifies potential candidates:

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
    HAVING SUM(total) >= min_hits  -- Must meet minimum threshold (default: 100 hits)
    ON CONFLICT (domain, time) DO UPDATE SET hits = EXCLUDED.hits;

    GET DIAGNOSTICS candidate_count = ROW_COUNT;
    RAISE NOTICE 'Populated % website candidates.', candidate_count;
END;
$$;
```

This is already super performant because we're electing based on the 1 minute count. After it, we can already discard the data.

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

This is not perfect as we're generating some dirty tuples but this table already have a pre-defined size and will not change too much.

#### Scheduling the Democratic Process

The beauty is in the automated scheduling:

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

Every X minutes you check top-N and elect candidates. Every Y time, you elect long term items.

#### The Democratic Configuration

Everything is configurable through a simple config table:

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

The result? A self-governing data democracy that automatically identifies and preserves the most valuable information while letting the noise fade away!

```sql
-- The heart of our election system
CREATE TABLE top_websites_candidates (
    domain text NOT NULL,
    time timestamp with time zone NOT NULL,
    hits bigint NOT NULL,
    PRIMARY KEY (domain, time)
);

-- Election job runs every hour
CREATE OR REPLACE PROCEDURE elect_top_websites(job_id INTEGER, config JSONB)
LANGUAGE plpgsql AS $$
BEGIN
    -- Vote for the most active websites
    INSERT INTO top_websites_longterm (domain, total_hits, times_elected)
    SELECT domain, SUM(hits), 1
    FROM top_websites_candidates 
    WHERE time >= NOW() - INTERVAL '2 hours'
    GROUP BY domain
    HAVING SUM(hits) >= 100  -- Minimum votes needed
    ON CONFLICT (domain) DO UPDATE SET
        total_hits = top_websites_longterm.total_hits + EXCLUDED.total_hits,
        times_elected = top_websites_longterm.times_elected + 1;
END;
$$;
```

### The Three-Tier Strategy

**Level 1: Raw Logs (5 minutes)** - Everything comes in, gets processed for immediate analytics, then gets discarded. Think of it as election day counting.

**Level 2: Aggregated Data (7-90 days)** - Useful statistics and trends, kept for medium-term analysis. These are our "campaign records."

**Level 3: Elected Champions (permanent)** - Only the top performers make it here. These domains proved their worth through consistent traffic and earned their permanent seat.

## The Results Speak for Themselves

The numbers are stunning:
- **99.6% storage reduction** (500GB → 20GB)
- **Real-time analytics** with <5ms query latency
- **Automatic identification** of top-performing websites
- **Scalable** regardless of input volume
- **Cost-controlled** storage that doesn't grow exponentially

## Generating fake data using background process

I love background workers, and having all in one place with timescaledb is amazing because jobs can simulate the payload continuously and directly in the database. It avoid network bandwidth and can easily stress and discover the throughput of your server.

Here's an example of how I created simulated data for the logs table:

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

And then you can schedule it to run automatically:

```sql
-- Schedule data generation for top websites (every 5 seconds)
CREATE OR REPLACE PROCEDURE schedule_top_websites_generation(avg_hits_per_minute int DEFAULT 30) 
LANGUAGE plpgsql AS $$
DECLARE
    top_websites text[] := ARRAY['google.com', 'facebook.com', 'youtube.com', 'twitter.com', 'instagram.com'];
    website text;
    amount int;
BEGIN
    FOREACH website IN ARRAY top_websites LOOP
        amount := avg_hits_per_minute + (random() * avg_hits_per_minute * 0.2)::integer;
        
        -- Add a background job for each website
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

The beauty of this approach is that TimescaleDB's background job scheduler handles all the complexity of running these jobs reliably. You can simulate realistic traffic patterns:

- **High-traffic domains** (google.com, facebook.com) get more frequent hits
- **Random domains** simulate the long tail of internet traffic  
- **Variable timing** adds realistic randomness to the data
- **Configurable volume** lets you dial up or down the data generation rate

Want to simulate 500GB daily? Just call:

```sql
-- This will generate approximately 1 million hits per minute!
CALL schedule_additional_volume_generation(1000000);
```

This gives you a living, breathing dataset that behaves like real web traffic - perfect for testing your selective analytics system under realistic conditions.

![Great moments with Seba](/images/pgconf-brazil-2025-jonatas-seba.jpeg)
*Great moments with Sebastian Webber at PGConf Brasil 2025*

## Why PGConf Brasil is Special

Being back at PGConf Brasil reminded me why this community is so special. The Brazilian PostgreSQL community is a diverse community, not only made of DBAs or SREs but a lot of developers, entrepreneurs and database enthusiasts too.

This year I had great time with folks from EDB like Bruce Monjian and Charly Baptista. They're both Global Postgresql Community Leaders that truly bless the community.

In Brazil, PGConf is also an itinerant event which allow people to organize on a specific city.

## The Technical Deep Dive

For those interested in the implementation details, the system uses:

- **TimescaleDB hypertables** for automatic partitioning
- **Continuous aggregates** for real-time summaries
- **Retention policies** for automatic cleanup
- **Background jobs** for the election process
- **Materialized views** for fast analytics

The beauty is in the automation - once configured, the system self-manages, automatically identifying what deserves long-term storage while maintaining consistent performance and costs.

## Beyond the Technology

What excited me most wasn't just the technical solution, but the metaphor it represents. In a world drowning in data, we need democratic approaches to decide what's worth keeping. Not everything deserves eternal storage, but the truly valuable data should be preserved and accessible.

This principle applies beyond web analytics - any high-volume data system can benefit from "selective analytics" thinking:

- Which metrics deserve real-time dashboards?
- What trends are worth alerting on?
- Which patterns should trigger automatic actions?

## Open Source and Community

True to the PostgreSQL spirit, everything is open source. You can find the complete implementation in the [timescaledb-templates repository](https://github.com/jonatas/timescaledb-templates) under the `webtop` folder.

The presentation slides and code examples are all available, and I encourage you to adapt the concepts to your own data challenges.

## Thank You, João Pessoa

As I flew back from João Pessoa, I carried with me not just the satisfaction of sharing useful technology, but the warmth of the PostgreSQL community. The conversations, the questions, the shared meals, and the genuine excitement about building better systems together.

PGConf Brasil proves year after year that it's not just one of the best PostgreSQL conferences in the world - it's one of the most welcoming and inspiring tech communities anywhere.

Want to dive deeper into selective analytics? Check out the [full presentation materials](https://github.com/jonatas/timescaledb-templates/blob/main/webtop/pgconfbr-2025.md) or reach out if you're facing similar data volume challenges.

The next election is always around the corner - make sure your data gets the vote it deserves! 🗳️

## Thank You, Tiger Data

I left Timescale, now the company is named [Tiger Data](https://tigerdata.com). I still had these talks submitted when I left, but I love the topic, so I just decided to go by my own.

I reached out Isabel sharing the costs and they kindly said yes to support my trip.

Thanks for the support! It was very welcome and appreciated  🐯🫶🏼

---

*Have your own 500GB challenge? Want to implement selective analytics in your system? I'd love to hear about it! Connect with me on [LinkedIn](https://www.linkedin.com/in/jonatasdp/) or check out my other talks and workshops on the [talks page](/talks).*
