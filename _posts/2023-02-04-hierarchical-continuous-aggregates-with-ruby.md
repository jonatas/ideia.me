---
title: "Hierarchical continuous aggregates with Ruby and Timescaledb"
layout: post
description: "Today I'm very happy to share that a new version of the [timescaledb gem][gem-repo]
is available. It's compatible with TimescaleDB 2.9 and the objective of t..."
---
Today I'm very happy to share that a new version of the [timescaledb gem][gem-repo]
is available. It's compatible with TimescaleDB 2.9 and the objective of this
post is exemplify how to use [hierarchical continuous aggregates][hcaggs].

I already brought posts about how to use [timescale with ruby](/using-the-timescale-gem-with-ruby)
and and how to create a [timescale continuous aggregates with ruby](/timescale-continuous-aggregates-with-ruby).

Yes! it's finally available and here is a small definition which can help you to
imagine a scenario that it would be useful!

> You can create continuous aggregates on top of other continuous aggregates.
> This allows you to summarize data at different granularities. For example,
> you might have an hourly continuous aggregate that summarizes
> minute-by-minute data. To get a daily summary, you can create a new
> continuous aggregate on top of your hourly aggregate.
> This is more efficient than creating the daily aggregate on top of the
> original hypertable, because you can reuse the calculations from the hourly
> aggregate.
> This feature is available in TimescaleDB 2.9 and above.

Continuous aggregates are materialized views persisted as hypertables which make
them have faster inserts.

I published originally this content originally on the
[candlestick tutorial][toolkit-candlestick], and I decide to post it here as
it's all my content and I'm very excited about this new feature. The content
there is more complete and goes beyond even exploring a simple sinatra app to
[plot the candlesticks][plotting-tutorial] in a web application.

In this tutorial, we're going to collect tick data from financial markets using
timescaledb hypertables and aggregate the data into candlesticks, being able to
access the open, high, low, close, volume (OHLCV) of every timeframe we want to
track.

We'll be using the [toolkit extension][toolkit-repo] and the
[candlestick_agg][candlestick_agg] to process the candlestick data grouped by
minute, hour and day periods.

So, instead of processing the raw data, to compute the hour candlestick, it's
only necessary to merge the 60 candlesticks based on the minutes of that hour.
The same is applicable from hours to days.

It saves a lot of processing cycles and it's very easy to maintain.

## Candlesticks

Candlesticks are a popular tool in technical analysis, used by traders to determine
potential market movements.

The [toolkit][toolkit-repo] also allows you to compute candlesticks with the
[candlestick_agg][candlestick_agg] function.

Candlesticks are a type of price chart that displays the high, low, open, and
close prices of a security for a specific period. They can be useful because
they can provide information about market trends and reversals. For example,
if you see that the stock has been trading in a range for a while, it may be
worth considering buying or selling when the price moves outside of this range.
Additionally, candlesticks can be used in conjunction with other technical
indicators to make trading decisions.

Let's start defining a table that stores the trades from financial market data
and then we can calculate the candlesticks with the Timescaledb Toolkit.

## Storing your market data

Market data is generally a massive data events stream. You can watch multiple
stock transactions globabally and receive trading, bidding and asking events.

Events happen in time, and it makes them timeseries data, which makes it a
perfect scenario to adopt hypertables.

The most granular data of trading events from market data is generally called tick.
Tick represents a single trade of something at a point in time. The tick
contains the necessary attributes of a deal in the financial markets.

The most simplified version of a tick is represented by:

* a **time** which the transaction happened.
* a **symbol** which generally is the stock name.
* a **price** representing the unit price of any stock.
* a **volume** representing the amount of stocks being traded.

Let's create the hypertable to store this information using the `create_table`
method from ActiveRecord API.

## Create the hypertable

We'll call `ticks` the hypertable name to store the market data.

The strategy will be the following:

* Partition the data into a week interval chunks. So, it means that every new week
a new partition depending on the **time** column.
* Compress the data after a month to save storage.
* Remove the raw data after six months and just leave the aggregated data for
longer time.

Ticks are massive. They can reach milions of events per day. That's why it's
important to have a compression policy since day one. Compressing data is a key
timescaledb feature. It can be done automatically and every chunk can be
compressed after a desired period. Timescaledb has an excellent compression
ratio for market data and you can easily reach 95% savings on storage by
adopting compression.

The timescaledb gem adds the `hypertable` keyword to the `create_table` method,
which allows you to specify anything related to the hypertable.

```ruby
ActiveRecord::Base.connection.instance_exec do
  hypertable_options = {
    time_column: 'time',
    chunk_time_interval: '1 week',
    compress_segmentby: 'symbol',
    compress_orderby: 'time',
    compression_interval: '1 month'
  }
  create_table :ticks, hypertable: hypertable_options, id: false do |t|
    t.timestamp :time
    t.string :symbol
    t.decimal :price
    t.decimal :volume
  end

  add_index :ticks, [:time, :symbol]
end
```

Note that the previous command is a standard `create_table` method call. The
timescaledb gem is just adding the `hypertable` keyword which allows to
configure everything in the same point.

In this case, we have the following commands being executed behind the scenes:

1. Create the standard table

```sql
CREATE TABLE "ticks" (
  "time" timestamp with time zone,
  "symbol" text,
  "price" decimal,
  "volume" float);
```

2. Convert it to a hypertable with `chunk_time_interval` of **1 week**.

```sql
SELECT create_hypertable('ticks', 'time', chunk_time_interval => INTERVAL '1 week')
```

3. The compression is enabled and configured in the hypertable.

```sql
ALTER TABLE ticks SET (
  timescaledb.compress,
  timescaledb.compress_orderby = 'time',
  timescaledb.compress_segmentby = 'symbol'
)
```


4. Index by time and symbol

It will be high used the combination of time and symbol. It's good to have a
symbol. The `create_index` is the last call and it will make common queries run
faster.

```sql
CREATE INDEX "index_ticks_on_time_and_symbol" ON "ticks" ("time", "symbol")
```

4. Add the compression policy to compress data after a month

```sql
SELECT add_compression_policy('ticks', INTERVAL '1 month');
```

## Create the ORM model

To define the model, we're going to inherit `ActiveRecord::Base`
to create a model.

Timeseries data will always require the time column and the primary key can be
discarded. A few default methods will not work if they depend on the if of the
object.

The model is the best place to describe how you'll be using the timescaledb to
keep your model DRY and consistent.

```ruby
class Tick < ActiveRecord::Base
  acts_as_hypertable time_column: :time
  acts_as_time_vector value_column: :price, segment_by: :symbol
end
```

The `acts_as_hypertable` macro will assume the actual model corresponds to a
hypertable and inject useful scopes and methods that can be wrapping to the
following TimescaleDB features:

* `.hypertable` will give you access to the [hypertable][hypertable] domain,
  the `table_name` will be used to get all metadata from the
  `_timescaledb_catalog` and combine all the functions that receives a 
  hypertable_name as a parameter.

* The `time_column` keyword argument will be used to build scopes like
  `.yesterday`, `.previous_week`, `.last_hour`. And can be used for your own
  scopes using the `time_column` metadata.

The `acts_as_time_vector` will be offering functions related to timescaledb
toolkit.

The `value_column:` will be combined with the `time_column` from the hypertable
to use scopes like  `candlestick`, `volatility`, `lttb` and just configure the
missing information.

The `segment_by:` will be widely used in the scopes to group by the data.

When the keywords `time_column`, `value_column` and `segment_by` are used in the
`acts_as_{hypertable,time_vector}` modules.

By convention, all scopes reuse the metadata from the configuration. It can facilitate
the process of build a lot of hypertable abstractions to facilitate the use combined scopes in the queries.

### The `acts_as_hypertable` macro

The `acts_as_hypertable` will bring the `Model.hypertable` which will allow us
to use a set of timeseries related set what are the default columns used to
calculate the data.

### The `acts_as_time_vector` macro

The `acts_as_time_vector` will allow us to set what are the default columns used
to calculate the data.

The `acts_as_time_vector` will inject handy scopes that wraps the
default formulas from timescaledb-toolkit extension.

It will be very powerful to build your set of abstractions over it and simplify
the maintenance of complex queries directly in the database.

## Inserting data

The `generate_series` sql function can speed up the process to seed some random
data and make it available to start playing with the queries.

The following code will insert tick data simulating prices from the previews
week until yesterday. We're using a single symbol and one tick every 10 seconds.

```ruby
ActiveRecord::Base.connection.instance_exec do
  data_range = {from: 1.week.ago.to_date, to: 1.day.from_now.to_date}
  execute(ActiveRecord::Base.sanitize_sql_for_conditions( [<<~SQL, data_range]))
    INSERT INTO ticks
    SELECT time, 'SYMBOL', 1 + (random()*30)::int, 100*(random()*10)::int
    FROM generate_series(
      TIMESTAMP :from,
      TIMESTAMP :to,
      INTERVAL '10 second') AS time;
    SQL
end
```

The database will seed a week of trade data with a randomize prices and volumes
simulating one event every 10 seconds.

The candlestick will split the timeframe by the `time_column` and use the `price`
as the default value to process the candlestick. It will also segment the
candles by the `symbol`. Symbol can be any stock trade and it's good to be
segmenting and indexing by it.

If you need to generate some data for your table, please check [this post][2].

## Query data

When the `acts_as_time_vector` method is used in the model, it will inject
several scopes from the toolkit to easily have access to functions like the
`_candlestick`.

The `candlestick` scope is available with a few parameters that inherits the
configuration from the `acts_as_time_vector` declared previously.

The simplest query is:

```ruby
Tick.candlestick(timeframe: '1m')
```

It will generate the following SQL:

```sql
 SELECT symbol,
    "time",
    toolkit_experimental.open(candlestick),
    toolkit_experimental.high(candlestick),
    toolkit_experimental.low(candlestick),
    toolkit_experimental.close(candlestick),
    toolkit_experimental.open_time(candlestick),
    toolkit_experimental.high_time(candlestick),
    toolkit_experimental.low_time(candlestick),
    toolkit_experimental.close_time(candlestick),
    toolkit_experimental.volume(candlestick),
    toolkit_experimental.vwap(candlestick)
FROM (
    SELECT time_bucket('1m', time) as time,
      "ticks"."symbol",
      toolkit_experimental.candlestick(time, price, volume)
    FROM "ticks" GROUP BY 1, 2 ORDER BY 1)
AS candlestick
```

The timeframe argument can also be skipped and the default is `1 hour`.

You can also combine other scopes to filter data before you get the data from
the candlestick:

```ruby
Tick.yesterday
  .where(symbol: "SYMBOL")
  .candlestick(timeframe: '1m')
```

The `yesterday` scope is automatically included because of the `acts_as_hypertable` macro. And it will be combining with other where clauses.

## Continuous aggregates

If you would like to continuous process the stream and aggregate the candlesticks
on a materialized view you can use continuous aggregates for it.

The next examples shows how to create a continuous aggregates of 1 minute
candlesticks:

```ruby
ActiveRecord::Base.connection.instance_exec do
  options = {
    with_data: true,
    refresh_policies: {
      start_offset: "INTERVAL '1 month'",
      end_offset: "INTERVAL '1 minute'",
      schedule_interval: "INTERVAL '1 minute'"
    }
  }
  create_continuous_aggregate('candlestick_1m', Tick._candlestick(timeframe: '1m'), **options)
end
```

Note that the `create_continuous_aggregate` calls the `to_sql` method in case
the second parameter is not a string.

Also, we're using the `_candlestick` method scope instead of the `candlestick`
one.

The reason is that the `candlestick` method already bring the attribute values
while the `_candlestick` can bring you the pre-processed data in a intermediate
state that can be rolled up with other candlesticks. For example, let's say you
already created a continuous aggregates of one minute and now you'd like to
process 5 minutes. You don't need to reprocess the raw data. You can build the
candlestick using the information from the one minute candlesticks.


## Models for views

It's very convenient to setup models for continuous aggregates which can
make it easy to inherit all smart methods to compose queries.


```ruby
class Candlestick1m < ActiveRecord::Base
  self.table_name = 'candlestick_1m'
  include Candlestick
end

class Candlestick1h < ActiveRecord::Base
  self.table_name = 'candlestick_1h'
  include Candlestick
end

class Candlestick1d < ActiveRecord::Base
  self.table_name = 'candlestick_1d'
  include Candlestick
end
```

Note that all classes include the `Candlestick` module. Let's define it to make
it easy to use the shared behavior.

### The candlestick concern

Concerns are already available through active_support and they can help you to
organize shared logic that can be included in multiple models.

In this concern, we'll have:

1. Use the `acts_as_hypertable` macro to inherit all query scopes.
2. Define attributes for all candlestick attributes
3. Define extra scopes to read the data and rollup to bigger timeframes.
4. Mark the model as readonly.


```ruby
require "active_support/concern"

module Candlestick
  extend ActiveSupport::Concern

  included do
    acts_as_hypertable time_column: "time_bucket"

    %w[open high low close].each do |name|
      attribute name, :decimal
      attribute "#{name}_time", :time
    end
    attribute :volume, :decimal
    attribute :vwap, :decimal

    scope :attributes, -> do
      select("symbol, time_bucket,
        toolkit_experimental.open(candlestick),
        toolkit_experimental.high(candlestick),
        toolkit_experimental.low(candlestick),
        toolkit_experimental.close(candlestick),
        toolkit_experimental.open_time(candlestick),
        toolkit_experimental.high_time(candlestick),
        toolkit_experimental.low_time(candlestick),
        toolkit_experimental.close_time(candlestick),
        toolkit_experimental.volume(candlestick),
        toolkit_experimental.vwap(candlestick)")
    end

    def readonly?
      true
    end
  end
end
```

## Hierarchical continuous aggregates

After you get the first one minute continuous aggregates, you don't need to
revisit the raw data to create candlesticks from it. You can build the 1 hour
candlestick from the 1 minute candlestick. The [Hierarchical continuous aggregates][hcaggs]
are very useful to save IO and processing time.

### Rollup

The [candlestick_agg][candlestick_agg] function returns a `candlesticksummary` object.

The rollup allows you to combine candlestick summaries into new structures from
smaller timeframes to bigger timeframes without needing to reprocess all the data.

With this feature, you can group by the candlesticks multiple times saving processing 
from the server and make it easier to manage aggregations with different time intervals.

In the previous example, we used the `.candlestick` function that returns already the
attributes from the different timeframes. In the SQL command it's calling the
`open`, `high`, `low`, `close`, `volume`, and `vwap` functions that can access
the values behind the candlesticksummary type.

To merge the candlesticks, the rollup method can aggregate several `candlesticksummary`
objects into a bigger timeframe.

Let's rollup the structures:

```ruby
module Candlestick
  extend ActiveSupport::Concern

  included do
    # ... previous code remains the same

    scope :rollup, -> (timeframe: '1h') do
      bucket = %|time_bucket('#{timeframe}', "time_bucket")|
      select(bucket,"symbol",
            "toolkit_experimental.rollup(candlestick) as candlestick")
      .group(1,2)
      .order(1)
    end
  end
end
```

Now, the new views in bigger timeframes can be added using it's own objects.

```ruby
ActiveRecord::Base.connection.instance_exec do
  options = -> (timeframe) {
    {
      with_data: false,
      refresh_policies: {
        start_offset: "INTERVAL '1 month'",
        end_offset: "INTERVAL '#{timeframe}'",
        schedule_interval: "INTERVAL '#{timeframe}'"
      }
    }
  }
  create_continuous_aggregate('candlestick_1h', Candlestick1m.rollup(timeframe: '1 hour'), **options['1 hour'])
  create_continuous_aggregate('candlestick_1d', Candlestick1h.rollup(timeframe: '1 day'),  **options['1 day'])
end
```

The final SQL executed to create the first [hierarchical continuous aggregates][hcaggs]
is the following:

```sql
CREATE MATERIALIZED VIEW candlestick_1h
WITH (timescaledb.continuous) AS
  SELECT time_bucket('1 hour', "time_bucket"),
    "candlestick_1m"."symbol",
    toolkit_experimental.rollup(candlestick) as candlestick
  FROM "candlestick_1m"
  GROUP BY 1, 2
  ORDER BY 1
WITH DATA;
```

So, as you can see all candlestick of one hour views follows the same interface of
one minute, having the same column names and values, allowing to be reuse in
larger timeframes.

### Refresh policy

Timescaledb is assuming you're storing real time data. Which means you can
continuous feed the `ticks` table and aggregate the materialized data from time
to time.

When `create_continuous_aggregate` is called with a `schedule_interval` it will
also execute the following SQL line:

```sql
SELECT add_continuous_aggregate_policy('candlestick_1h',
  start_offset => INTERVAL '1 month',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');
```

Instead of updating the values row by row, the refresh policy will automatically
run in background and aggregate the new data with the configured timeframe.

## Querying Continuous Aggregates with custom ActiveRecord models

With the `Candlestick1m` and `Candlestick1h` wrapping the continuous aggregates
into models, now, it's time to explore the available scopes and what to do with
it.

```ruby
Candlestick1m.yesterday.first
```

It will run the following SQL:
```sql
SELECT "candlestick_1m".*
FROM "candlestick_1m"
WHERE (DATE(time_bucket) = '2023-01-23') LIMIT 1;
```

And return the following object:

```ruby
#<Candlestick1m:0x000000010fbeff68
 time_bucket: 2023-01-23 00:00:00 UTC,
 symbol: "SYMBOL",
 candlestick:
  "(version:1,open:(ts:\"2023-01-23 00:00:00+00\",val:9),high:(ts:\"2023-01-23 00:00:10+00\",val:24),low:(ts:\"2023-01-23 00:00:50+00\",val:2),close:(ts:\"2023-01-23 00:00:50+00\",val:2),volume:Transaction(vol:2400,vwap:26200))",
 open: nil,
 open_time: nil,
 high: nil,
 high_time: nil,
 low: nil,
 low_time: nil,
 close: nil,
 close_time: nil,
 volume: nil,
 vwap: nil>
```

Note that the attributes are not available in the object but a `candlestick`
attribute is present holding all the information. That's why it's necessary to
use the `attributes` scope:
```ruby
Candlestick1m.yesterday.attributes.first
```

Which will run the following query:
```sql
SELECT symbol, time_bucket,
  toolkit_experimental.open(candlestick),
  toolkit_experimental.high(candlestick),
  toolkit_experimental.low(candlestick),
  toolkit_experimental.close(candlestick),
  toolkit_experimental.open_time(candlestick),
  toolkit_experimental.high_time(candlestick),
  toolkit_experimental.low_time(candlestick),
  toolkit_experimental.close_time(candlestick),
  toolkit_experimental.volume(candlestick),
  toolkit_experimental.vwap(candlestick)
FROM "candlestick_1m"
WHERE (DATE(time_bucket) = '2023-01-23') LIMIT 1;
```

And the object will be filled with the attributes:

```ruby
=> #<Candlestick1m:0x000000010fc3e578
 time_bucket: 2023-01-23 00:00:00 UTC,
 symbol: "SYMBOL",
 open: 0.9e1,
 open_time: 2023-01-23 00:00:00 +0000,
 high: 0.24e2,
 high_time: 2023-01-23 00:00:10 +0000,
 low: 0.2e1,
 low_time: 2023-01-23 00:00:50 +0000,
 close: 0.2e1,
 close_time: 2023-01-23 00:00:50 +0000,
 volume: 0.24e4,
 vwap: 0.1091666666666666e2>
```

It's a very convenient strategy to have the `Candlestick` as a shared concern
to allow to reuse queries in different views of the same type.

The `rollup` scope is the one that was used to redefine the data into big timeframes
and the `attributes` allow to access the attributes from the candlestick type.

In this way, the views become just shortcuts and complex sql can also be done
just nesting the model scope. For example, to rollup from a minute to one hour,
you can do:

```ruby
Candlestick1m.attributes.from(
  Candlestick1m.rollup(timeframe: '1 hour')
)
```

And from minute to one hour to a day:

```ruby
Candlestick1m.attributes.from(
  Candlestick1m.rollup(timeframe: '1 day').from(
    Candlestick1m.rollup(timeframe: '1 hour')
  )
)
```

Both examples are just using the one minute continuous aggregates view and
reprocessing it from there.

Composing the subqueries will probably be less efficient and unnecessary as we
already created more continuous aggregates in the top of another continuous
aggregates. Here is the SQL generated from the last nested rollups code:

```sql
SELECT symbol, time_bucket,
  toolkit_experimental.open(candlestick),
  toolkit_experimental.high(candlestick),
  toolkit_experimental.low(candlestick),
  toolkit_experimental.close(candlestick),
  toolkit_experimental.open_time(candlestick),
  toolkit_experimental.high_time(candlestick),
  toolkit_experimental.low_time(candlestick),
  toolkit_experimental.close_time(candlestick),
  toolkit_experimental.volume(candlestick),
  toolkit_experimental.vwap(candlestick)
FROM (
  SELECT time_bucket('1 day', "time_bucket"),
    symbol,
    toolkit_experimental.rollup(candlestick) as candlestick
  FROM (
    SELECT time_bucket('1 hour', "time_bucket"),
      "candlestick_1m"."symbol",
      toolkit_experimental.rollup(candlestick) as candlestick
    FROM "candlestick_1m" GROUP BY 1, 2 ORDER BY 1
  ) subquery GROUP BY 1, 2 ORDER BY 1
) subquery
```

## Feedback or questions?

I hope you find this tutorial interesting and you can also check the
`candlestick.rb` file in the [examples/toolkit-demo][demo] folder.

If you have any questions or concerns, feel free to reach me ([@jonatasdp][twitter]) in the [Timescale community][community] or tag timescaledb in your StackOverflow issue.

If you're interested in Data Processing with Ruby and Timescaledb, I talked at
RubyConf Thailand last December about processing data and here is the video of my presentation:

{% youtube MXAtSZ5Szgk %}

If you liked it, you can see more content like this in my [talks](/talks).


[2]: https://ideia.me/timescale-continuous-aggregates-with-ruby
[4]: https://github.com/timescale/timescaledb/pull/4668
[demo]: https://github.com/jonatas/timescaledb/tree/master/examples/toolkit-demo
[community]: https://timescale.com/community
[twitter]: https://twitter.com/jonatasdp
[hcaggs]: https://docs.timescale.com/timescaledb/latest/how-to-guides/continuous-aggregates/hierarchical-continuous-aggregates/
[candlestick_agg]: https://docs.timescale.com/api/latest/hyperfunctions/financial-analysis/candlestick_agg/
[toolkit]:  https://docs.timescale.com/timescaledb/latest/how-to-guides/install-timescaledb-toolkit/
[candlestick]: https://docs.timescale.com/api/latest/hyperfunctions/financial-analysis/candlestick/
[gem-repo]: https://github.com/jonatas/timescaledb
[timescaledb-repo]: https://github.com/timescale/timescaledb
[toolkit-repo]: https://github.com/timescale/timescaledb-toolkit
[docs-url]: https://jonatas.github.io/timescaledb
[toolkit-candlestick]: https://jonatas.github.io/timescaledb/toolkit_candlestick/
[plotting-tutorial]: https://jonatas.github.io/timescaledb/toolkit_candlestick/#plotting-data
