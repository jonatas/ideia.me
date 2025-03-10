---
title: "Two ways to notify new data from Timescaledb Continuous Aggregates"
layout: post
categories: time-series timescaledb postgresql
description: "As a Developer Advocate at Timescale, I have a unique opportunity to work with the community and teach people how to use TimescaleDB. Recently, a community m..."
---
As a Developer Advocate at Timescale, I have a unique opportunity to work with the community and teach people how to use TimescaleDB. Recently, a community member asked about a way to publish the results of the continuous aggregate to a messaging system. This sparked my interest, and I challenged myself to come up with a solution.

In this article, I will share my approach to the problem. First, I will introduce the basics of materialized views with continuous aggregates in TimescaleDB. Then, I will show how to use a trigger-based solution to publish the results to a messaging system. Finally, I will demonstrate how to use background jobs to achieve the same result.

## Introduction

For a long time, working with real-time data in SQL databases was a cumbersome task, but it's now easier with TimescaleDB. This article explains how to create materialized views with continuous aggregates to process real-time data.

We will use stock tick data to demonstrate the process. The following code creates a table to store the tick data and a materialized view with continuous aggregates to generate candlesticks:

If you've worked with real-time data before, you're probably aware of the challenges it presents. Real-time data is a fast-moving stream of information, and it requires near-instant processing to make the most out of it. However, this is often difficult to achieve with SQL databases, which are traditionally designed to handle slower moving, more static data. 

Enter TimescaleDB, a powerful and flexible extension of PostgreSQL designed to handle high-velocity time-series data. Among its many features, TimescaleDB enables developers to create materialized views with continuous aggregates to process real-time data with ease. In this article, we will explore how to leverage these capabilities to build a real-time data pipeline for processing stock tick data. 

## Building a Real-Time Data Pipeline

In this section, we will walk through an example of how to build a real-time data pipeline using TimescaleDB. Let's assume we have a table of stock tick data, which includes the timestamp of the trade, the stock symbol, the price, and the volume.

```sql
CREATE TABLE "ticks" (
  "time" timestamp with time zone not null, 
  "symbol" text, 
  "price" decimal, 
  "volume" float
);
```

### Creating a hypertable

To create a hypertable in TimescaleDB, we use the create_hypertable function. This function takes the name of the table we want to convert to a hypertable, the name of the time column, and an optional argument chunk_time_interval that specifies the duration of each chunk.

```sql
SELECT create_hypertable('ticks', 'time', chunk_time_interval => INTERVAL '1 day');
```

In the above code, we create a hypertable named ticks using the create_hypertable function. The hypertable is created based on the ticks table and is partitioned on the time column. We set the chunk_time_interval parameter to INTERVAL '1 day' to specify that each chunk should contain data for a single day.

By using hypertables, we can improve the performance of our time-series data queries, as TimescaleDB can efficiently index and manage large volumes of time-series data.

### Creating the continuous aggregate

Now, let's create a continuous aggregate materialized view that aggregates the tick data on a 10 second time interval:

```sql
CREATE MATERIALIZED VIEW candlestick_10s
WITH (timescaledb.continuous) AS
SELECT 
  time_bucket('10s', time),
  "ticks"."symbol",
  toolkit_experimental.candlestick_agg(time, price, volume) as candlestick
FROM "ticks"
GROUP BY 1, 2
ORDER BY 1
WITH DATA;
```

The above view calculates the candlestick data for the 10-second interval using the candlestick_agg function from the TimescaleDB toolkit. We group the data by the 10-second interval and the stock symbol, and we order the result by the interval start time.

Next, we can create a continuous aggregate materialized view that aggregates the 10-second candlestick data on a 1-minute time interval:

```sql
CREATE MATERIALIZED VIEW candlestick_1m
WITH (timescaledb.continuous ) AS
SELECT 
  time_bucket('1m', "time_bucket"),
  symbol,
  toolkit_experimental.rollup(candlestick) as candlestick 
FROM "candlestick_10s"
GROUP BY 1, 2
ORDER BY 1
WITH NO DATA;
```

The above view rolls up the 10-second candlestick data into the 1-minute intervals using the rollup function from the TimescaleDB toolkit. We group the data by the 1-minute interval and the stock symbol, and we order the result by the interval start time.

Finally, we can create a continuous aggregate materialized view that aggregates the 1-minute candlestick data on a 5-minute time interval:

```sql
CREATE MATERIALIZED VIEW candlestick_5m
WITH (timescaledb.continuous) AS
SELECT 
  time_bucket('5m', "time_bucket"),
  symbol,
  toolkit_experimental.rollup(candlestick) as candlestick
FROM "candlestick_1m"
GROUP BY
```

## Trigger-based solution to notify new row

To notify when a new row is added to the ticks table, we can use a trigger to send a notification to a listening client. Here's how to create the trigger:

```sql
CREATE OR REPLACE FUNCTION notify_new_row() RETURNS TRIGGER AS $$
  DECLARE
  threshold INTERVAL := INTERVAL '0 seconds';
  candlestick record;
BEGIN
  SELECT * FROM candlestick_1m
  ORDER BY time_bucket DESC LIMIT 1
  INTO candlestick;
  IF (NEW.time - m1.time_bucket) >= threshold THEN
    PERFORM pg_notify('m1', row_to_json(m1)::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_new_row_trigger
AFTER INSERT ON ticks
FOR EACH ROW
EXECUTE FUNCTION notify_new_row();
```

The `notify_new_row` function selects the latest `candlestick_1m` row and compares its time_bucket value to the time value of the newly inserted row in the ticks table. If the difference is greater than or equal to the specified threshold, the function sends a notification to a listening client using the pg_notify function.

The `notify_new_row_trigger` trigger executes the `notify_new_row` function for each new row inserted into the ticks table.

With the above solution, we can keep track of newly inserted rows and notify our clients in real-time.

## Background Jobs to publish the results to a messaging system

To make the process of publishing the results of a continuous aggregate to a messaging system more efficient, we can use background jobs. Instead of inserting each new candlestick into a notifications table and then listening for changes, we can use TimescaleDB's job scheduling system to run a job that sends a notification each time a new candlestick is generated. Here's how to create the background jobs:

### Define the Background Job

So far, we've seen how to create materialized views with continuous aggregates to process real-time data. However, one critical aspect of real-time data pipelines is the ability to execute background jobs. TimescaleDB offers a powerful job scheduling system that enables developers to run complex jobs in the background.

In our example, we will create two background jobs: one to simulate the stock tick data and another to notify us when a new candlestick is generated. A few other will run to feed the continuous aggregates materialized views.

First, let's create a procedure to simulate the tick data:

```sql
CREATE OR REPLACE PROCEDURE simulate_tick(job_id int, config jsonb)
LANGUAGE PLPGSQL AS $$
DECLARE
  candlestick record := null;
BEGIN
  EXECUTE 'INSERT INTO ticks
    SELECT now(), $1,
      (random()*30)::int,
      100*(random()*10)::int'
    USING config->>'symbol';
END
$$;
```

The procedure takes in a configuration object that specifies the stock symbol to use. It generates random tick data for the specified symbol and inserts it into the ticks table.

## Schedule the background job

Next, let's create a background job to run the procedure every second for two different symbols:

```sql
SELECT add_job('simulate_tick', '1s', config => '{"symbol": "APPL"}', fixed_schedule => true);
SELECT add_job('simulate_tick', '0.5s', config => '{"symbol": "GOOG"}', fixed_schedule => true);
```

The above code schedules the `simulate_tick` procedure to run every second for the APPL symbol and every 0.5 seconds for the GOOG symbol.

Now, let's create a procedure to notify us when a new candlestick is generated:

```sql
CREATE OR REPLACE PROCEDURE notify_new_candlestick(job_id int, config jsonb)
LANGUAGE PLPGSQL AS $$
DECLARE
  view_name TEXT := config ->> 'view_name';
  last_row RECORD;
BEGIN
  EXECUTE format('SELECT * FROM %I ORDER BY time_bucket DESC LIMIT 1', view_name)
  INTO last_row;
  PERFORM pg_notify(view_name, row_to_json(last_row)::text);
END
$$;
```

The procedure takes in a configuration object that specifies the name of the view to monitor. It retrieves the most recent candlestick from the specified view and sends a notification with the view name and the JSON representation of the candlestick.

Finally, let's create background jobs to monitor the three materialized views we created earlier:

```sql
SELECT add_job('notify_new_candlestick', '10s', config => '{"view_name": "candlestick_10s"}', fixed_schedule => true);
SELECT add_job('notify_new_candlestick', '1m', config => '{"view_name": "candlestick_1m"}', fixed_schedule => true);
SELECT add_job('notify_new_candlestick', '5m', config => '{"view_name": "candlestick_5m"}', fixed_schedule => true);
```
he above code schedules the notify_new_candlestick procedure to run every 10 seconds for the 10-second candlestick view, every minute for the 1-minute candlestick view, and every 5 minutes for the 5-minute candlestick view.

To listen for notifications, we can use the LISTEN command:

```sql
LISTEN candlestick_10s;
LISTEN candlestick_1m;
LISTEN candlestick_5m;
```

With the LISTEN command in place, we can use the NOTIFY command to receive notifications whenever a new candlestick is generated:

```sql
CREATE OR REPLACE PROCEDURE notify_new_candlestick(job_id int, config jsonb)
LANGUAGE PLPGSQL AS $$
DECLARE
  view_name TEXT := config ->> 'view_name';
  last_row RECORD;
BEGIN
  EXECUTE format('SELECT * FROM %I ORDER BY time_bucket DESC LIMIT 1', view_name)
  INTO last_row;
  PERFORM pg_notify(view_name, row_to_json(last_row)::text);
END
$$;
```

First, let's create a procedure to simulate the tick data:

```sql
CREATE OR REPLACE PROCEDURE simulate_tick(job_id int, config jsonb)
LANGUAGE PLPGSQL AS $$
DECLARE
  candlestick record := null;
BEGIN
  EXECUTE 'INSERT INTO ticks
    SELECT now(), $1,
      (random()*30)::int,
      100*(random()*10)::int'
    USING config->>'symbol';
END
$$;
```

The procedure takes in a configuration object that specifies the stock symbol to use. It generates random tick data for the specified symbol and inserts it into the ticks table.

Next, let's create a background job to run the procedure every second for two different symbols:


```sql
SELECT add_job('simulate_tick', '1s', config => '{"symbol": "APPL"}', fixed_schedule => true);
SELECT add_job('simulate_tick', '0.5s', config => '{"symbol": "GOOG"}', fixed_schedule => true);
```

The above code schedules the `simulate_tick` procedure to run every second for the APPL symbol and every 0.5 seconds for the GOOG symbol.

With this procedure in place, we can simulate real-time data and test our [hierarchical continuous aggregates](https://docs.timescale.com/timescaledb/latest/how-to-guides/continuous-aggregates/hierarchical-continuous-aggregates/).

## Conclusion

In this article, we explored how to use materialized views with continuous aggregates to process real-time data in TimescaleDB. We covered the basics of creating and managing materialized views and showed how to use continuous aggregates to generate hierarchical views of time-series data.

We also demonstrated how to execute background jobs in TimescaleDB to simulate real-time data and send notifications when new data is generated. By using materialized views and continuous aggregates, we can gain real-time insights into our data and make better-informed decisions.

With the above solutions, we can publish the results of [continuous aggregates](https://docs.timescale.com/timescaledb/latest/overview/core-concepts/continuous-aggregates/) to a messaging system and keep our data pipelines real-time.

If you're interested in learning more about TimescaleDB or have questions about the solutions presented in this article, please don't hesitate to reach out. Join the [Timescale community](https://www.timescale.com/community/) and talk directly to me. I'm happy to help!
