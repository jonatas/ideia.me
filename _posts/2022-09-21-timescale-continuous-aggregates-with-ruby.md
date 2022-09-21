---
  layout: post
  title: Creating continuous aggregates with Ruby and Timescale
  categories: time-series PostgreSQL ruby
---

I created the [timescale gem][1] and wrote an introductory post on how [using the timescale gem with ruby][2].

Now, it's time to learn more about the [continuous aggregates][3] feature. Accordingly, the Timescale website says:

    Continuous aggregates are designed to make queries on very large datasets run faster. TimescaleDB continuous aggregates use PostgreSQL materialized views to continuously and incrementally refresh a query in the background, so that when you run the query, only the data that has changed needs to be computed, not the entire dataset.

This feature is a core feature of the TimescaleDB. If you're already using TimescaleDB probably, you'll find an excellent opportunity to use this.

We're going to use the [time_bucket][5] function that was already explored in the [previous post][4] but now using applying the [candlestick][6] pattern.

> Candlesticks are graphical representations of price movements for a given period. They are commonly formed by a financial instrument's opening, high, low, and closing prices. [Learn more][6].


### Migration for the hypertable creation

Let's continue with a minimal migration system to prove the concept before we jump into a more advanced migration scenario.
In this example, we'll start with creating the ticks table representing stock market events and then group the events by minute to show the candlestick pattern.

```ruby
ActiveRecord::Base.connection.instance_exec do
  drop_table :ticks, force: :cascade

  hypertable_options = {
    time_column: 'time',
    chunk_time_interval: '1 day',
    compress_segmentby: 'symbol',
    compress_orderby: 'created_at',
    compression_interval: '7 days'
  }

  create_table :ticks, hypertable: hypertable_options, id: false do |t|
    t.timestamp :time
    t.string :symbol
    t.decimal :price
    t.integer :volume
  end
end
```

The previous code instruction only involves the hypertable creation, and \ the continuous aggregate steps will be covered soon.

Note that the `drop_table` statement uses `force: :cascade` as it will also destroy the respective view if it exists. This example is also intended to be for **testing purposes only** as it's also dropping and recreating the table every time you run it.

### ActiveRecord model for the hypertable

And here is the ActiveRecord model simplified for the example.

```ruby
class Tick < ActiveRecord::Base
  self.table_name = 'ticks'
  self.primary_key = nil

  acts_as_hypertable time_column: 'time'
end
```

The only data we need to override for now is the `time_column`, but you can override anything in the official documentation.

### Generating data

During this example, we're not going to connect to a market data stream, but
generate some fake data to just understand how to use it.

Let's create fake data for the [FAANG stocks][7].

Let's define some helper variables that can help to generate the data:

```ruby
FAANG = %w[META AMZN AAPL NFLX GOOG]
OPERATION = [:+, :-]
RAND_VOLUME = -> { (rand(10) * rand(10)) * 100 }
```

Clarifying step by step:

* `FAANG` will be the symbols that we will iterate.
* `OPERATION` is the pricing signal that will be added or reduced randomly.
* `RAND_VOLUME` will simply generate a contract volume for each event.

Now defining the fake data:

```ruby
def generate_fake_data(total: 100)
  previous_price = {}
  time = Time.now
  (total / FAANG.size).times.flat_map do
    FAANG.map do |symbol|
      time += rand(1)
      if previous_price[symbol]
        price = previous_price[symbol].send(OPERATION.sample, rand(10) / 100.0)
      else
        price = 50 + rand(100)
      end
      payload = { time: time, symbol: symbol, price: rand(), volume: RAND_VOLUME.() }
      previous_price[symbol] = price
      payload
    end
  end
end
```
It will generate a bunch of payloads that can be inserted.

The last step in generating the data is combining the data generated with the insert command. Again, we can go with `insert_all`, a faster method to persist the data using ActiveRecord.

```ruby
batch = generate_fake_data total: 50
ActiveRecord::Base.logger = nil
Tick.insert_all(batch, returning: false)
ActiveRecord::Base.logger = Logger.new(STDOUT)
```

To confirm the data is of good quality, take a look on what are the generated prices:

```ruby
FAANG.inject({}) do |h, s|
  h[s] = Tick.where( symbol: s).order(:time).pluck(:price).map(&:to_f)
  h
end
```

The results will be a hash like this:

```ruby
{"META"=>[142.0, 141.98, 141.96, 141.98, 141.98, 141.98, 141.96, 141.96, 141.97, 141.97],
 "AMZN"=>[103.0, 103.0, 103.01, 103.0, 103.01, 103.0, 103.0, 103.01, 103.03, 103.05],
 "AAPL"=>[82.0, 81.99, 81.98, 81.96, 81.96, 81.96, 81.97, 81.99, 81.97, 81.97],
 "NFLX"=>[60.0, 59.99, 60.0, 59.99, 59.99, 60.01, 60.0, 60.02, 60.02, 60.02],
 "GOOG"=>[148.0, 147.99, 147.98, 148.0, 148.01, 148.02, 148.03, 148.02, 148.02, 148.01]}
```

The data varies very slowly, as expected. Now, feel free to change the fake data generation to generate at least a few hours of data. 10k will generate at least a few hours.

```ruby
batch = generate_fake_data total: 10_000
```

### Querying the candlestick

Now, it's time to focus on the `Tick` model again and add the `OHLC` method to return the candlestick from ActiveRecord. As it will return attributes not recognized by the model, let's declare the accessors to be easier to read the values later.

```ruby
class Tick < ActiveRecord::Base
  # skipping previous code for readability
  %w[open high low close].each{|name| attribute name, :decimal}

  scope :ohlc, -> (timeframe='1m') do
    select("time_bucket('#{timeframe}', time) as time,
      symbol,
      FIRST(price, time) as open,
      MAX(price) as high,
      MIN(price) as low,
      LAST(price, time) as close,
      SUM(volume) as volume").group("1,2")
  end
```

Testing the data:

```ruby
Tick.where(symbol: "GOOG").ohlc
[#<Tick:0x00007f9d62fdbb58 time: 2022-09-20 12:00:00 UTC, symbol: "GOOG", volume: 18600, open: 0.83e2, high: 0.8305e2, low: 0.8298e2, close: 0.8305e2>,
 #<Tick:0x00007f9d62fdba90 time: 2022-09-20 12:01:00 UTC, symbol: "GOOG", volume: 6000, open: 0.8305e2, high: 0.8307e2, low: 0.8305e2, close: 0.8306e2>,
 #<Tick:0x00007f9d62fdb9c8 time: 2022-09-20 12:02:00 UTC, symbol: "GOOG", volume: 55400, open: 0.8307e2, high: 0.8314e2, low: 0.8307e2, close: 0.8313e2>,
 #<Tick:0x00007f9d62fdb900 time: 2022-09-20 12:03:00 UTC, symbol: "GOOG", volume: 29300, open: 0.8315e2, high: 0.832e2, low: 0.8315e2, close: 0.832e2>,
 ... # more records here ]
```

Now testing with one-hour intervals:

```ruby
Tick.order('time').where(symbol: "GOOG").ohlc('1h')
# => [#<Tick:0x00007f9d62f2ae98 time: 2022-09-20 12:00:00 UTC, symbol: "GOOG", volume: 1617800, open: 0.83e2, high: 0.8325e2, low: 0.829e2, close: 0.83e2>,
#   #<Tick:0x00007f9d62f2add0 time: 2022-09-20 13:00:00 UTC, symbol: "GOOG", volume: 1634600, open: 0.83e2, high: 0.832e2, low: 0.8261e2, close: 0.8261e2>,
#   #<Tick:0x00007f9d62f2ad08 time: 2022-09-20 14:00:00 UTC, symbol: "GOOG", volume: 783300, open: 0.826e2, high: 0.826e2, low: 0.8231e2, close: 0.8249e2>]
```

It seems like everything is working as expected, and the last step is finally to create the continuous aggregates 🎉

### Creating the continuous aggregates

Every time the `ohlc` scope is invoked, it queries the raw data from the ticks table and groups the data to consume. So let's go with a materialized view that will make the same for us and continuously aggregate the values.

Continuous aggregates will persist the data from past minutes and only compute the data for the still open candlesticks. So, for example, if you're processing buckets of one hour, it will materialize the data from previous hours and only compute the data from the last hour.

```ruby
ActiveRecord::Base.connection.instance_exec do
  create_continuous_aggregates('ohlc_1m', Tick.ohlc('1m'), with_data: true)
end
```

In the background, the following query is being executed:

```sql
CREATE MATERIALIZED VIEW ohlc_1m
WITH (timescaledb.continuous) AS
SELECT time_bucket('1m', time) as time,
      symbol,
      FIRST(price, time) as open,
      MAX(price) as high,
      MIN(price) as low,
      LAST(price, time) as close,
      SUM(volume) as volume FROM "ticks" GROUP BY 1,2
WITH DATA;
```

The last parameter, `with_data`, will automatically process the present data. If false, the [refresh_continous_aggregates][8] can do the job later. If you have too much data to process, and you're adding it to a Rails migration, maybe that's a good idea to process it in a background job to not block your deployment.

```ruby
class Ohlc1m < ActiveRecord::Base
  self.table_name = 'ohlc_1m'
  attribute :time, :time
  attribute :symbol, :string
  %w[open high low close volume].each{|name| attribute name, :decimal}

  def readonly?
   true
  end
end
```

Comparing performance here is unfair as we don't have enough data to see too much difference. But, testing with 10k, it's already 4 times faster using pre-processed data:

```ruby
Tick.where(symbol:"AAPL").ohlc('1m') # Tick Load (13.8ms) 
Ohlc1m.where(symbol:"AAPL").all      # Ohlc1m Load (3.6ms)
```

### Scenic support

If you're using the [scenic][9] views, it will work smoothly too. However, the scenic gem doesn't support the `WITH` clause in the views, and the Timescale gem adds this support.
It dumps the views with the `WITH (timescaledb.continuous)` statement in SQL that is [skipped in the official gem][10].

## Extra resources

Download the code from this tutorial [here][5] and test yourself!

Here are a few extra resources that can be useful if you're hacking TimescaleDB
with Ruby.

1. [Using TimescaleDB gem with Ruby][2]
2. [Official Gem documentation][11]
3. [Timescale Gem GitHub project][1]
4. [Official examples from source code][12]

Also, there is a fantastic [video][14] from Ryan Booz that dives deeper into Continuous
Aggregates and how it compares to PostgreSQL materialized views.

[1]: https://github.com/jonatas/timescaledb
[2]: /using-the-timescale-gem-with-ruby
[3]: https://docs.timescale.com/timescaledb/latest/how-to-guides/continuous-aggregates/
[4]: https://ideia.me/using-the-timescale-gem-with-ruby#using-the-timescale-time_bucket-function
[5]: https://docs.timescale.com/api/latest/hyperfunctions/time_bucket/
[6]: https://en.wikipedia.org/wiki/Candlestick_pattern
[7]: https://www.investopedia.com/terms/f/faang-stocks.asp
[8]: https://docs.timescale.com/api/latest/continuous-aggregates/refresh_continuous_aggregate/#refresh-continuous-aggregate
[9]: https://github.com/scenic-views/scenic
[10]: https://github.com/scenic-views/scenic/issues/310
[11]: https://jonatas.github.io/timescaledb/migrations/#the-create_continuous_aggregate-helper
[12]: https://github.com/jonatas/timescaledb/tree/master/examples
[13]: https://gist.github.com/jonatas/b3df4592ab93eb98d45935687ef9a105
[14]: https://www.youtube.com/watch?v=5KNY_5mH040
