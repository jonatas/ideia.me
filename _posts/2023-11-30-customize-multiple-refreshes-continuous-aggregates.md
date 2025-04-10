---
title: "Customize multiple refreshes for continuous aggregates"
layout: post
categories: ['databases', 'programming', 'technology']
tags: ['postgresql', 'sql', 'tutorials']
description: "TimescaleDB, an open-source time-series database optimized for fast ingest and complex queries, offers a unique feature called Continuous Aggregates (CAGGs)...."
---
TimescaleDB, an open-source time-series database optimized for fast ingest and complex queries, offers a unique feature called Continuous Aggregates (CAGGs). These CAGGs are game-changers in how we handle time-series data, allowing for real-time aggregate views that are automatically refreshed. In this post, we'll explore how to create a custom refresh policy for hierarchical continuous aggregates and delve into the flexibility and simplicity TimescaleDB offers.

## The scenario

Imagine you have a `metrics` hypertable in TimescaleDB and you're aggregating this data over different time intervals: hourly, daily, and weekly. Managing these aggregations can get complex, especially when you want to refresh them in a specific sequence. 

### Setting up the hypertable

```sql
CREATE TABLE metrics (
  time timestamptz NOT NULL,
  device_id int,
  value float
);
SELECT create_hypertable('metrics', 'time');
```

### Setting up CAGGS

Now, it's time to set up our continuous aggregates. We create three materialized views for our `metrics` table: `metrics_by_hour`, `metrics_by_day`, and `metrics_by_week`. These views will aggregate data over their respective time intervals.

The hourly view goes to raw data:

```sql
CREATE MATERIALIZED VIEW metrics_by_hour
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', time) AS bucket,
count(*)
FROM metrics
GROUP BY 1;
```

The daily view reuses hourly data:

```sql
CREATE MATERIALIZED VIEW metrics_by_day WITH (timescaledb.continuous) AS
SELECT time_bucket('1 day', bucket) AS bucket,
  sum(count) AS count
FROM metrics_by_hour
GROUP BY 1;
```

The week view reuses daily data:

```sql
CREATE MATERIALIZED VIEW metrics_by_week WITH (timescaledb.continuous) AS
SELECT time_bucket('1 week', bucket) AS bucket, sum(count) AS count FROM metrics_by_day GROUP BY 1;
```

## The power of RECURSIVE in SQL

Before we dive into the practical application, let's understand a critical piece of the puzzle: the use of `RECURSIVE` in SQL. This concept might be new to some, so I'll walk through an example to shed light on its functionality.

Kudos to [@fabriziomello](https://twitter.com/fabriziomello) that shared the recursive SQL code which was used as a guide to find the right continuous aggregates order.

Consider the following SQL snippet:

```sql
WITH RECURSIVE caggs AS (
    SELECT mat_hypertable_id, parent_mat_hypertable_id, user_view_name
    FROM _timescaledb_catalog.continuous_agg
    WHERE user_view_name = 'metrics_by_week'
    UNION ALL
    SELECT continuous_agg.mat_hypertable_id, continuous_agg.parent_mat_hypertable_id, continuous_agg.user_view_name
    FROM _timescaledb_catalog.continuous_agg
    JOIN caggs ON caggs.parent_mat_hypertable_id = continuous_agg.mat_hypertable_id
)
SELECT * FROM caggs ORDER BY mat_hypertable_id;
```

In this snippet, we are using a `WITH RECURSIVE` query to create a Common Table Expression (CTE) named `caggs`. The recursive part of this CTE does two things:
1. Initially, it selects data from the `_timescaledb_catalog.continuous_agg` table where our continuous aggregate view is `metrics_by_week`.
2. Then, it recursively joins this data with the same catalog table to find all related continuous aggregates. This is crucial for understanding the hierarchy of our aggregates.

The result is a neatly organized list of continuous aggregates along with their parent-child relationships. Understanding this relationship is key to setting up a custom refresh policy that respects the dependency chain.

```sql
┌───────────────────┬──────────────────────────┬─────────────────┐
│ mat_hypertable_id │ parent_mat_hypertable_id │ user_view_name  │
├───────────────────┼──────────────────────────┼─────────────────┤
│               148 │                          │ metrics_by_hour │
│               149 │                      148 │ metrics_by_day  │
│               150 │                      149 │ metrics_by_week │
└───────────────────┴──────────────────────────┴─────────────────┘
```

## Implementing the custom refresh policy

With the recursive CTE in place, we can now proceed to the next step: implementing a custom refresh policy for our continuous aggregates. This policy ensures that each aggregate is refreshed in the correct sequence, respecting their hierarchical dependencies.


### Building a cascading refresh policy

To ensure our aggregates are refreshed in the right order, we'll write a procedure that refreshes each aggregate in sequence. This is crucial because our daily aggregate depends on the hourly one, and the weekly aggregate depends on the daily one.

```sql
CREATE OR REPLACE PROCEDURE refresh_all_caggs(job_id int, config jsonb)
LANGUAGE PLPGSQL AS $$
DECLARE
    _cagg RECORD;
BEGIN
    FOR _cagg IN
        WITH RECURSIVE caggs AS (
            SELECT mat_hypertable_id, parent_mat_hypertable_id, user_view_name
            FROM _timescaledb_catalog.continuous_agg
            WHERE user_view_name = 'metrics_by_week'
            UNION ALL
            SELECT continuous_agg.mat_hypertable_id, continuous_agg.parent_mat_hypertable_id, continuous_agg.user_view_name
            FROM _timescaledb_catalog.continuous_agg
            JOIN caggs ON caggs.parent_mat_hypertable_id = continuous_agg.mat_hypertable_id
        )
        SELECT * FROM caggs ORDER BY mat_hypertable_id
    LOOP
        EXECUTE format('CALL refresh_continuous_aggregate(%L, NULL, NULL)', _cagg.user_view_name);
        COMMIT;
    END LOOP;
END;
$$;
```

### Scheduling the jobs

Now, just schedule the function to run every 5 seconds:

```sql
SELECT add_job('refresh_all_caggs', '5 seconds');
```

With our functions ready, we use TimescaleDB's job scheduling feature to run these functions at regular intervals. This step is where the "magic happens" - our database is now self-managing, continuously updating our aggregate views and inserting new data.

### Automated data insertion for testing

[Actions][actions] are amazing to develop small POCs and can be handy to detach long processing to a background worker. 

To test our setup, we'll create another custom action that inserts random metrics into our `metrics` table. This action simulates real-time data insertion, helping us see our continuous aggregates in action.

```sql
CREATE OR REPLACE FUNCTION insert_random_metrics(job_id int, config jsonb)
RETURNS VOID LANGUAGE PLPGSQL AS $$
DECLARE
    last_time timestamptz;
    interval_value interval DEFAULT '1 minute'; -- default interval
BEGIN
    -- Attempt to fetch the most recent timestamp from the metrics table
    SELECT INTO last_time MAX(time) FROM metrics;

    -- If no data is found, default to one week ago
    IF last_time IS NULL THEN
        last_time := now() - interval '1 week';
    END IF;

    -- Check if an interval is provided in the config and use it if available
    IF config ? 'interval' THEN
        interval_value := (config ->> 'interval')::interval;
    END IF;

    -- Insert new data starting from the determined timestamp
    INSERT INTO metrics (time, device_id, value)
    VALUES (last_time + interval_value, trunc(random() * 100)::int, random() * 100);
END;
$$;
```

After creating the function, you can schedule it to run at regular intervals using TimescaleDB's job scheduling system. In this case, as we're just wanting results fast as possible, we'll insert a new row every second with data starting from a week ago and appending 35 min from the previous time.

```sql
SELECT add_job('insert_random_metrics', '1 second', '{"interval": "35 minutes"}');
```

We've also made this function flexible, allowing us to specify the interval between data points using a JSONB payload.

### Exploring with psql

All of this can be explored using `psql`, PostgreSQL's interactive terminal. I'm a big fan of the simplicity and power of single-file SQL scripts for learning and experimentation. You can easily run these scripts in `psql` to see how TimescaleDB handles continuous aggregates and background jobs.

### The power of Continuous Aggregates (CAGGs)

Continuous aggregates in TimescaleDB offer incredible flexibility. You can rewrite the rules for how and when your data is aggregated, making it fit your specific use case. They're a testament to the power of open-source databases in handling time-series data effectively.

### See it in action

You can find the complete SQL script for this procedure [here](https://github.com/jonatas/sql-snippets/blob/master/cagg-refresh-cascade.sql). Note, the last line has a `\watch` which assumes you'll run it using `psql`.

To truly appreciate the beauty of this setup, check out this [asciinema recording](https://asciinema.org/a/624234) where I walk through the entire process. It's a great way to see these concepts in action.

<a href="https://asciinema.org/a/624234" target="_blank"><img src="https://asciinema.org/a/624234.svg" /></a>

TimescaleDB's continuous aggregates and background actions offer a level of flexibility and ease of use that's hard to match. I love it and it reminds me how good is the life working with Postgresql. Simple, easy. No secrets behind the scenes.

I love how I can simply have everything in a sql which I can simply type `psql playground -f my-poc.sql` and see things in action.

Whether you're aggregating data over various time intervals or building custom refresh policies, TimescaleDB simplifies the process, allowing you to focus on what's important - your data.

Happy coding!

[source]: https://github.com/jonatas/sql-snippets/blob/master/cagg-refresh-cascade.sql
[actions]: https://docs.timescale.com/api/latest/actions/
