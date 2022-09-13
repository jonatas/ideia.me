---
layout: post
title: Tips to duplicate massive time series data on Postgresql
categories: postgresql time-series
---

A few days ago, I was testing the [lttb][2] function from the [timescaledb_toolkit][1] extension to downsample data into fewer points.

Using the [weather dataset][6] from Timescale, we got 20k points per device, but I need more data from the same `device_id` to downsample. 
Utilizing `random` or `generate_series` doesn't bring a good quality of data for this case. 

This blog post aims to show how to insert massive data by reusing the values from a dataset and shifting the time column to another period.

Let's use the `conditions` table as an example:

```sql
playground=# \d conditions
                         Table "public.conditions"
┌─────────────┬──────────────────────────┬───────────┬──────────┬─────────┐
│   Column    │           Type           │ Collation │ Nullable │ Default │
├─────────────┼──────────────────────────┼───────────┼──────────┼─────────┤
│ time        │ timestamp with time zone │           │ not null │         │
│ device_id   │ text                     │           │          │         │
│ temperature │ numeric                  │           │          │         │
│ humidity    │ numeric                  │           │          │         │
└─────────────┴──────────────────────────┴───────────┴──────────┴─────────┘
```

We're going to just duplicate the data for a target device_id. So, to start, you just need to know the size of the interval between your data.

```sql
SELECT MAX(time) - MIN(time)
FROM conditions
WHERE device_id = 'weather-pro-000000'
```

Now, you can reuse the interval and specify the order of the columns correctly to reinsert the data shifting the dataset backward or forward. In this case, I'm prepending data backward. This means inserting more data from the past instead of the future.

```sql
INSERT INTO conditions
  SELECT time - INTERVAL '108 days' as time,
    device_id, temperature, humidity
  FROM conditions
  WHERE device_id = 'weather-pro-000000';
```

The trick is the `time - INTERVAL '108 days'`, which will reset the shift time from the dataset, and the rest of the data will be reused. To remove the hardcoded `108 days` from the example, we'll need to create a [materialized CTE][5].

```sql
WITH previous AS materialized
(SELECT MAX(time) - MIN(time) AS period
FROM conditions
WHERE device_id = 'weather-pro-000001' )
TABLE previous;
┌──────────────────┐
│      period      │
├──────────────────┤
│ 27 days 18:38:00 │
└──────────────────┘
(1 row)
```

Now, enhancing the example to preview all the data joining the conditions table:

```sql
WITH previous AS materialized (
  SELECT device_id, MAX(time) - MIN(time) as period
  FROM conditions
  WHERE device_id = 'weather-pro-000001'
  GROUP BY 1
)
SELECT cond.time + previous.period,
  previous.device_id,
  cond.temperature,
  cond.humidity
FROM previous
LEFT JOIN LATERAL
  (SELECT * from conditions)
AS cond ON cond.device_id = previous.device_id;
```

Now, it's more about prepending the previous statement with the `INSERT INTO conditions`.

```sql
INSERT INTO conditions
WITH previous AS materialized (
  SELECT device_id, MAX(time) - MIN(time) as period
  FROM conditions
  WHERE device_id = 'weather-pro-000001'
  GROUP BY 1
)
SELECT cond.time + previous.period,
  previous.device_id,
  cond.temperature,
  cond.humidity
FROM previous
LEFT JOIN LATERAL
  (SELECT * from conditions)
AS cond ON cond.device_id = previous.device_id;
```

Checking the performance with `\timing` in the psql can give you some idea of how fast it is:

```sql
\timing
INSERT 0 40000 -- Time: 326.921 ms
INSERT 0 80000 -- Time: 582.390 ms
INSERT 0 160000 -- Time: 1086.917 ms (00:01.087)
```

**160k** rows per second!

This post was inspired by a pairing session with [David K][3]. He is an SQL expert and came up with this fascinating idea to just shift the time and reinsert the same data.

If you like Postgres and SQL, David is also creating a very instructive video series' named the [Postgresql foundations][4] on Youtube.


[1]: https://github.com/timescale/timescaledb-toolkit/
[2]: https://docs.timescale.com/api/latest/hyperfunctions/downsample/lttb/#sample-usage
[3]: https://twitter.com/HarlemCavalier
[4]: https://www.youtube.com/playlist?list=PLsceB9ac9MHRnmNZrCn_TWkUrCBCPR3mc
[5]: https://www.postgresql.org/docs/14/queries-with.html#id-1.5.6.12.7
[6]: https://docs.timescale.com/timescaledb/latest/tutorials/sample-datasets/#weather-datasets

