---
layout: post
title: "TimescaleDB Gem Continuous Aggregates Updates"
date: 2024-10-07
---

TimescaleDB is a popular open-source time-series database that extends PostgreSQL. It is designed to handle time-series data efficiently, making it an excellent choice for IoT, finance, and other domains that require high-performance time-series storage and querying.

Continuous Aggregates are a key feature of TimescaleDB that allow for efficient data aggregation and compression. They are materialized views that pre-compute and store the results of complex queries, which can significantly improve query performance and reduce resource usage.

During [my first contribution to rubygems](https://github.com/timescale/timescaledb-ruby/pull/100) I faced a massive amount of work to generate statistics for downloads. For this work, I needed to generate a statistics for the downloads per day, per gem, per version and so on.

At the time, the only way to do so was to create a continuous aggregate for each combination of gem and version. While this was not difficult, it was a lot of work to do and maintain. 

As the creator of the timescaledb gem, I [opened an issue](https://github.com/jonatas/timescaledb/issues/64) to brainstorm a solution. After no interactions, I just talked with AI and start building it to see how it would be. I'm so happy that I did it, because I learned a lot of things and I'm sure that this will help me to improve the gem and the code.

So I started working on a solution, and after a while, I had a [proof of concept](https://github.com/jonatas/timescaledb/pull/73) that would generate the statistics for downloads in a much more elegant way.

In this post, we will explore the latest macros and features added to the TimescaleDB gem for continuous aggregates.

## The Problem

* Multiple continuous aggregates on the same hypertable that hierarchically segment the data in different time grains.
* When the data is updated, we need to update all the continuous aggregates, but we want to make sure we are doing it efficiently.
* We need to find a way that we have a consistent chain of continuous aggregates that are kept in sync.

## The Solution

I broke down the problem into two parts:

1. What are the data I want to collect? Make them scopes.
2. To rollup the data, we need to get the scopes and reuse them on the go, rolling up the data from the bottom grain up to the top grain.

Here is the model with the new macro in action:

```ruby
class Download < ActiveRecord::Base
  extend Timescaledb::ActsAsHypertable
  include Timescaledb::ContinuousAggregatesHelper

  acts_as_hypertable time_column: 'ts'

  scope :total_downloads, -> { select("count(*) as total") }
  scope :downloads_by_gem, -> { select("gem_name, count(*) as total").group(:gem_name) }
  scope :downloads_by_version, -> { select("gem_name, gem_version, count(*) as total").group(:gem_name, :gem_version) }

  continuous_aggregates(
    timeframes: [:minute, :hour, :day, :month],
    scopes: [:total_downloads, :downloads_by_gem, :downloads_by_version],
    refresh_policy: {
      minute: { start_offset: "10 minutes", end_offset: "1 minute", schedule_interval: "1 minute" },
      hour:   { start_offset: "4 hour",     end_offset: "1 hour",   schedule_interval: "1 hour" },
      day:    { start_offset: "3 day",      end_offset: "1 day",    schedule_interval: "1 day" },
      month:  { start_offset: "3 month",    end_offset: "1 day",  schedule_interval: "1 say" }
  })
end
```

Instead of defining every query for every continuous aggregate, we just need to define the scopes that will be used to rollup the data.

The macro creates a class method to drop and create the continuous aggregates. 

Now, let's see how we use it on migrations:

```ruby
class CreateHypertableWithContinuousAggregates< ActiveRecord::Migration[7.0]

  disable_ddl_transaction!

  def up
    hypertable_options = {
      time_column: 'ts',
      chunk_time_interval: '1 day',
      compress_segmentby: 'gem_name, gem_version',
      compress_orderby: 'ts DESC',
      compression_interval: '7 days'
    }

    create_table(:downloads, id: false, hypertable: hypertable_options) do |t|
      t.timestamptz :ts, null: false
      t.text :gem_name, :gem_version, null: false
      t.jsonb :payload
    end

    Download.create_continuous_aggregates
  end

  def down
    Download.drop_continuous_aggregates
    drop_table(:downloads, force: :cascade) if Download.table_exists?
  end
end
```

The previous migration will create a hypertable with the `downloads` table and the continuous aggregates for the scopes and timeframes defined in the model.
Here is the full SQL output for the migration:

```sql
CREATE TABLE "downloads" ("ts" timestamptz NOT NULL, "gem_name" text NOT NULL, "gem_version" text NOT NULL, "payload" jsonb)
SELECT create_hypertable('downloads', 'ts', chunk_time_interval => INTERVAL '1 day')
ALTER TABLE downloads SET (
  timescaledb.compress,
  timescaledb.compress_orderby = 'ts DESC',
  timescaledb.compress_segmentby = 'gem_name, gem_version'
)
SELECT add_compression_policy('downloads', INTERVAL '7 days')

CREATE MATERIALIZED VIEW IF NOT EXISTS total_downloads_per_minute
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 minute', ts) as ts, count(*) as total FROM "downloads" GROUP BY 1
WITH NO DATA;

SELECT add_continuous_aggregate_policy('total_downloads_per_minute',
  start_offset => INTERVAL '10 minutes',
  end_offset =>  INTERVAL '1 minute',
  schedule_interval => INTERVAL '1 minute');

CREATE MATERIALIZED VIEW IF NOT EXISTS total_downloads_per_hour
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', ts) as ts, sum(total) as total FROM "total_downloads_per_minute" GROUP BY 1
WITH NO DATA;

SELECT add_continuous_aggregate_policy('total_downloads_per_hour',
  start_offset => INTERVAL '4 hour',
  end_offset =>  INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');

CREATE MATERIALIZED VIEW IF NOT EXISTS total_downloads_per_day
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 day', ts) as ts, sum(total) as total FROM "total_downloads_per_hour" GROUP BY 1
WITH NO DATA;

SELECT add_continuous_aggregate_policy('total_downloads_per_day',
  start_offset => INTERVAL '3 day',
  end_offset =>  INTERVAL '1 day',
  schedule_interval => INTERVAL '1 day');

CREATE MATERIALIZED VIEW IF NOT EXISTS total_downloads_per_month
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 month', ts) as ts, sum(total) as total FROM "total_downloads_per_day" GROUP BY 1
WITH NO DATA;

SELECT add_continuous_aggregate_policy('total_downloads_per_month',
  start_offset => INTERVAL '3 month',
  end_offset =>  INTERVAL '1 day',
  schedule_interval => INTERVAL '1 day');

CREATE MATERIALIZED VIEW IF NOT EXISTS downloads_by_gem_per_minute
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 minute', ts) as ts, gem_name, count(*) as total FROM "downloads" GROUP BY 1, gem_name
WITH NO DATA;

SELECT add_continuous_aggregate_policy('downloads_by_gem_per_minute',
  start_offset => INTERVAL '10 minutes',
  end_offset =>  INTERVAL '1 minute',
  schedule_interval => INTERVAL '1 minute');

CREATE MATERIALIZED VIEW IF NOT EXISTS downloads_by_gem_per_hour
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', ts) as ts, gem_name, sum(total) as total FROM "downloads_by_gem_per_minute" GROUP BY 1, gem_name
WITH NO DATA;

SELECT add_continuous_aggregate_policy('downloads_by_gem_per_hour',
  start_offset => INTERVAL '4 hour',
  end_offset =>  INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');

CREATE MATERIALIZED VIEW IF NOT EXISTS downloads_by_gem_per_day
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 day', ts) as ts, gem_name, sum(total) as total FROM "downloads_by_gem_per_hour" GROUP BY 1, gem_name
WITH NO DATA;

SELECT add_continuous_aggregate_policy('downloads_by_gem_per_day',
  start_offset => INTERVAL '3 day',
  end_offset =>  INTERVAL '1 day',
  schedule_interval => INTERVAL '1 day');

CREATE MATERIALIZED VIEW IF NOT EXISTS downloads_by_gem_per_month
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 month', ts) as ts, gem_name, sum(total) as total FROM "downloads_by_gem_per_day" GROUP BY 1, gem_name
WITH NO DATA;

SELECT add_continuous_aggregate_policy('downloads_by_gem_per_month',
  start_offset => INTERVAL '3 month',
  end_offset =>  INTERVAL '1 day',
  schedule_interval => INTERVAL '1 day');

CREATE MATERIALIZED VIEW IF NOT EXISTS downloads_by_version_per_minute
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 minute', ts) as ts, gem_name, gem_version, count(*) as total FROM "downloads" GROUP BY 1, gem_name, gem_version
WITH NO DATA;

SELECT add_continuous_aggregate_policy('downloads_by_version_per_minute',
  start_offset => INTERVAL '10 minutes',
  end_offset =>  INTERVAL '1 minute',
  schedule_interval => INTERVAL '1 minute');

CREATE MATERIALIZED VIEW IF NOT EXISTS downloads_by_version_per_hour
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', ts) as ts, gem_name, gem_version, sum(total) as total FROM "downloads_by_version_per_minute" GROUP BY 1, gem_name, gem_version
WITH NO DATA;

SELECT add_continuous_aggregate_policy('downloads_by_version_per_hour',
  start_offset => INTERVAL '4 hour',
  end_offset =>  INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');

CREATE MATERIALIZED VIEW IF NOT EXISTS downloads_by_version_per_day
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 day', ts) as ts, gem_name, gem_version, sum(total) as total FROM "downloads_by_version_per_hour" GROUP BY 1, gem_name, gem_version
WITH NO DATA;

SELECT add_continuous_aggregate_policy('downloads_by_version_per_day',
  start_offset => INTERVAL '3 day',
  end_offset =>  INTERVAL '1 day',
  schedule_interval => INTERVAL '1 day');

CREATE MATERIALIZED VIEW IF NOT EXISTS downloads_by_version_per_month
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 month', ts) as ts, gem_name, gem_version, sum(total) as total FROM "downloads_by_version_per_day" GROUP BY 1, gem_name, gem_version
WITH NO DATA;

SELECT add_continuous_aggregate_policy('downloads_by_version_per_month',
  start_offset => INTERVAL '3 month',
  end_offset =>  INTERVAL '1 day',
  schedule_interval => INTERVAL '1 day');
```

Same for drop, it will drop the continuous aggregates in the inverse order of the creation.

You can also refresh the continuous aggregates:

```ruby
# To refresh aggregates:
Download.refresh_aggregates([:hour, :day])  # Refreshes hourly and daily aggregates
# or
Download.refresh_aggregates  # Refreshes all defined timeframes
```

The macro creates subclasses of the model for each scope and timeframe, that will be used for each continuous aggregate.

Let's start with the simplest one, the total downloads per minute. The class is dynamicly created by the macro and it follows the name convention `Download::TotalDownloadsPerMinute`.

Check the count of the downloads from hypertable:
```ruby
Download.count
D, [2024-09-18T12:03:56.816395 #81652] DEBUG -- :   Download Count (20.4ms)  SELECT COUNT(*) FROM "downloads"
=> 6175
```

Check the count of the downloads from the continuous aggregate:
```ruby
Download::TotalDownloadsPerMinute.select("sum(total)::bigint").map(&:attributes)
D, [2024-09-18T12:04:19.305644 #81652] DEBUG -- :   Download::TotalDownloadsPerMinute Load (2.9ms)  SELECT sum(total)::bigint FROM "total_downloads_per_minute"
=> [{"sum"=>6175}]
```

Check the data from the continuous aggregate:
```ruby
Download::TotalDownloadsPerMinute.all.map(&:attributes)
D, [2024-09-18T12:05:05.643695 #81652] DEBUG -- :   Download::TotalDownloadsPerMinute Load (2.3ms)  SELECT "total_downloads_per_minute".* FROM "total_downloads_per_minute"
=> [{"ts"=>2024-04-26 00:13:00 UTC, "total"=>1150},
 {"ts"=>2024-04-26 00:12:00 UTC, "total"=>1461},
 {"ts"=>2024-04-26 00:11:00 UTC, "total"=>1322},
 {"ts"=>2024-04-26 00:15:00 UTC, "total"=>1005},
 {"ts"=>2024-04-26 00:10:00 UTC, "total"=>110},
 {"ts"=>2024-04-26 00:14:00 UTC, "total"=>1127}]
```

Now, to rollup the data from the continuous aggregate to a bigger time grain, we can use the `rollup` method:

```ruby
Download::TotalDownloadsPerMinute.select("sum(total)::bigint").rollup("'2 min'").map(&:attributes)
D, [2024-09-18T12:04:52.099026 #81652] DEBUG -- :   Download::TotalDownloadsPerMinute Load (2.3ms)  SELECT time_bucket('2 min', ts) as ts, sum(total)::bigint FROM "total_downloads_per_minute" GROUP BY 1
=> [{"ts"=>2024-04-26 00:12:00 UTC, "sum"=>2611},
 {"ts"=>2024-04-26 00:14:00 UTC, "sum"=>2132},
 {"ts"=>2024-04-26 00:10:00 UTC, "sum"=>1432}]
```

You can also access bigger time grains:

```ruby
Download::TotalDownloadsPerHour.all.map(&:attributes)
D, [2024-09-18T12:05:36.486636 #81652] DEBUG -- :   Download::TotalDownloadsPerHour Load (2.3ms)  SELECT "total_downloads_per_hour".* FROM "total_downloads_per_hour"
=> [{"ts"=>2024-04-26 00:00:00 UTC, "total"=>6175}]
```

As you see, the views have the "total" column, and you can use `acts_as_time_vector` to enhance the query interface with more statistics and data mining capabilities.

```ruby
Download::TotalDownloadsPerMinute.acts_as_time_vector value_column: "total"
```

Now, you have access to `lttb`, `candlestick` and other methods that can be used to analyze the data.

```ruby
Download::TotalDownloadsPerMinute.candlestick(timeframe: '5min', volume: "1").map(&:attributes)
# SELECT time_bucket, open(candlestick),
#                high(candlestick),
#                low(candlestick),
#                close(candlestick),
#                open_time(candlestick),
#                high_time(candlestick),
#                low_time(candlestick),
#                close_time(candlestick),
#                volume(candlestick),
#                vwap(candlestick)
# FROM (
#     SELECT time_bucket('5min', "ts"),
#      candlestick_agg(ts, total, 1) as candlestick
#       FROM "total_downloads_per_minute"
#    GROUP BY 1 ORDER BY 1) AS candlestick
=> [{"time_bucket"=>2024-04-26 00:10:00 UTC,
  "open"=>110.0,
  "high"=>1461.0,
  "low"=>110.0,
  "close"=>1127.0,
  "open_time"=>2024-04-26 00:10:00 UTC,
  "high_time"=>2024-04-26 00:12:00 UTC,
  "low_time"=>2024-04-26 00:10:00 UTC,
  "close_time"=>2024-04-26 00:14:00 UTC,
  "volume"=>5.0,
  "vwap"=>1034.0},
 {"time_bucket"=>2024-04-26 00:15:00 UTC,
  "open"=>1005.0,
  "high"=>1005.0,
  "low"=>1005.0,
  "close"=>1005.0,
  "open_time"=>2024-04-26 00:15:00 UTC,
  "high_time"=>2024-04-26 00:15:00 UTC,
  "low_time"=>2024-04-26 00:15:00 UTC,
  "close_time"=>2024-04-26 00:15:00 UTC,
  "volume"=>1.0,
  "vwap"=>1005.0}]
```

Note that use use `1` in the volume, because our data is 1 download per row, so the volume is 1. If you have more, you can use the `volume` method to get the count of the downloads.

As you can see, the code is much cleaner and more elegant.

We just need to call `Model.create_continuous_aggregates` and `Model.drop_continuous_aggregates` on the migration to rollup the hiearchical continuous aggregates.


The aggregations are also represented as descendants, so we can access them like this:

```ruby
Download.descendants.map(&:name)
=> ["Download::DownloadsByVersionPerMonth",
 "Download::DownloadsByVersionPerDay",
 "Download::DownloadsByVersionPerHour",
 "Download::DownloadsByVersionPerMinute",
 "Download::DownloadsByGemPerMonth",
 "Download::DownloadsByGemPerDay",
 "Download::DownloadsByGemPerHour",
 "Download::DownloadsByGemPerMinute",
 "Download::TotalDownloadsPerMonth",
 "Download::TotalDownloadsPerDay",
 "Download::TotalDownloadsPerHour",
 "Download::TotalDownloadsPerMinute"]
```

We can also check the hierarchy:

```ruby
Download::TotalDownloadsPerMinute.ancestors.map(&:name)
=> ["Download::TotalDownloadsPerMinute",
 "Download::TotalDownloadsPerHour",
 "Download::TotalDownloadsPerDay",
 "Download::TotalDownloadsPerMonth"]
```

You can also access `base_query` and `timeframe` from the descendants. e.g:

```ruby
 Download::DownloadsByVersionPerMonth.base_query
=> "SELECT time_bucket('1 month', ts) as ts, gem_name, gem_version, sum(total) as total FROM \"downloads_by_version_per_day\" GROUP BY 1, gem_name, gem_version"
```


## Integration with the `acts_as_time_vector` macro

The `acts_as_time_vector` macro is a powerful tool to enhance the query interface of the continuous aggregates. When declaring the time_vector, the `value_column` is the column that will be used to reference and build any calculus on the data in the continuous aggregate.

```ruby
class Tick < ActiveRecord::Base
  extend Timescaledb::ActsAsHypertable
  include Timescaledb::ContinuousAggregatesHelper

  acts_as_hypertable time_column: 'ts'
  acts_as_time_vector value_column: "price", segment_by: "symbol"

  scope :btc, -> { where symbol: "BTC/USD"}

  continuous_aggregates(
    timeframes: [:minute, :hour, :day, :month],
    scopes: [:_candlestick]
  )
end
```

The `_candlestick` scope is a special scope that will be used to generate the candlestick data for the time vector. It uses the `candlestick_agg` function to generate the candlestick data. It's able to rollout hierarchicaly the data from the smallest timeframe to the biggest without too much processing.

In this way, we only have the metadata around the candlestick and we need to build extra query to get the values from it. Let's say we want to get a downsampled 500 records from the BTC/USD candlestick data.

```ruby
Crypto::OhlcPerMonth.btc.lttb(threshold: 500, value: "close(candlestick) as close", segment_by: nil)
```

The [lttb](https://docs.timescale.com/api/latest/hyperfunctions/downsampling/) stands for Largest Triangle Tree Buckets and it can help you to save bandwidth, memory and IO and still have a good representation of the data.

If you bring a few thousand points to your plot, you still cannot see to many pixels in the screen, and it will be downsampled in the front end.

Now, let's imagine the same BTC/USD candlestick already has more than 2 million data points, so, using a simple `select * from crypto_ohlc_per_months where symbol = 'BTC/USD'` will load a lot of data and it will take a long time to plot.

With this approach, we are not only saving resources, but we are also making the data more accessible and easier to analyze.

You can also think about introducing a custom time range analyzer that picks the right view depending on the range of data being queried.

```ruby
class Crypto < ActiveRecord::Base
  # ...
  scoped_range :between, lambda do |range|
    case range
    when > 1.year
      OhlcPerMonth
    when > 1.month
      OhlcPerDay
    when > 1.day
      OhlcPerHour
    when > 1.hour
      OhlcPerMinute
    else
      self
    end.where(time_column => range)
  end
end
```

So, that's it! I'm very happy with the result and I hope you enjoy it too.

If you have any questions, please feel free to ask.

And, if you want to contribute, please, do it. The code is not perfect, but it's a good starting point to build on it.

Thank you for reading.
