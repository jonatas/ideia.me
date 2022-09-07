---
layout: post
categories: time-series postgresql ruby
title: Using the Timescale gem with Ruby
---

I joined Timescale as a developer advocate. One of my creative tasks there was live streaming.
As I've been working with Ruby since 2007, I created a live streaming series about how to use Timescale with Ruby.

I'd like to teach you how to use the gem with Ruby. Not Rails. Only plain Ruby and some ActiveRecord flavor that turns it more interesting.

In this post, I will cover the basics of inserting, querying, looking at some timescale metadata, and the compression system. Soon, I'll cover more features like compression policies, continuous aggregates, and more advanced features.


If you want to run the complete example yourself, it's [alive][1] and belongs to the official [docs][2]. If you find any bugs or want to improve the example, feel free to [submit a PR][3].

If you're curious about the live streaming, you can also check the links from all episodes [here][17].

## Dependencies

The Timescale gem depends on [PG][4] and ActiveRecord. I chose ActiveRecord as it was the main wrapper for ORM in the Ruby ecosystem. In addition, the concepts are pretty simple and can be easily migrated to another framework.

Let's start requiring bundler inline to avoid the creation of the `Gemfile`. I'm adding the [timescaledb][6] gem, and the mentioned libraries will be fetched as dependencies. Also, [pry][5] is here because it's the best REPL to debug any Ruby code.

```ruby
# all_in_one.rb file
require 'bundler/inline

gemfile(true) do
  gem 'timescaledb'
  gem 'pry'
end
```

A good part of using the bundler inline is that you don't have to require the dependencies.

Now, let's start by establishing the connection. Let's use the URI as the last parameter from the command line. For example, to run from my localhost, I can refer to the database URI like this:

```bash
ruby all_in_one.RB postgres://jonatasdp@localhost:5432/playground
```

Make sure you change the `jonatasdp` to your username and the `playground` to
your database name. Check [how to install Timescale][6] first, or you can try a
free instance on the [Timescale cloud][7].

```ruby
ActiveRecord::Base.establish_connection( ARGV.last)
```

With this line, you're making the connection to the database, and you can already
start making queries or whatever you want.

## Creating the first hypertable with Ruby

The concept is that [Hypertables][9] are PostgreSQL tables designed to handle time-series data. So anything you can do with a regular PostgreSQL table, you can do with a hypertable. The advantage is that you have an outstanding performance and user experience for time-series data.

It improves performance by partitioning time-series data on its time column. While you can still perform all your operations using the table name, Timescale is smart to maintain the hypertable's partitions while you can deal with a single, regular PostgreSQL table.

It's also able to compress the data of the child tables and fold the partitions
in multiple dimensions.

As we're not going to have the Rails migrations system in this small example, we
can start defining what our hypertable looks like.

Let's call it `Event`, starting from the model, and the objective is to store events that happen at a specific time with a payload that can allow us to give the event more details.

```ruby
class Event < ActiveRecord::Base
  self.primary_key = nil
  acts_as_hypertable
end
```

Note that Timescale hypertables are all about time-series data, and you generally
don't need to have primary keys.

ActiveRecord default returns the object's id when you insert it into the database. Setting a `primary_key` to another column helps us to avoid this behavior as it would say the column `id` was not found.

The following line is about saying it's hypertable. The `acts_as_hypertable` macro allows you to override several options. By default, it uses the `created_at` as the time column, and the rest of the hypertable configurations are using the defaults just to allow us to make some progress here.

### Creating the minimum migration system

Now, let's create the minimum migration setup and use the hypertable.

Let's start moving the logs to the standard output as ActiveRecord is configured to send the information to a file. The feedback will help check how every step is executed as we test.

```ruby
ActiveRecord::Base.logger = Logger.new(STDOUT)
```

The next step is to call the `create_table` method from ActiveRecord. And here is where the timescaledb gem acts. Then, finally, we can inject the desired behavior with the `hypertable` option.

```ruby
ActiveRecord::Base.connection.instance_exec do

  drop_table(:events) if Event.table_exists?

  hypertable_options = {
    time_column: 'created_at',
    chunk_time_interval: '1 day',
    compress_segmentby: 'identifier',
    compression_interval: '7 days'
  }

  create_table(:events, id: false, hypertable: hypertable_options) do |t|
    t.string :identifier, null: false
    t.jsonb :payload
    t.timestamps
  end
end
```

I love using [instance_exec][10] as it allows me to execute several commands from a different perspective. Instead of having the connection as a variable, I can jump into the scope and declare some code similar to the rails migration files. Easier to move to an actual app later if I'm only prototyping for a while ;)

Now, let's break down what  we have in the hypertable options:

```ruby
  hypertable_options = {
    time_column: 'created_at',
    chunk_time_interval: '1 day',
    compress_segmentby: 'identifier',
    compression_interval: '7 days'
  }
```

The `time_column` option calls the `create_hypertable` function in the command line. So, converting to SQL, after creating the table, it will have an extra line like calling the [create_hypertable][11] function:

```sql
select create_hypertable('events', 'created_at' )
```

The hypertable contains several [optional arguments][12] that can also be used in this migration helper. In our case, we're overriding only the `chunk_time_interval` that the default is `7 days`, and we're going with `1 day`.

The following two options are related to the [compression][13] concept. First, it reduces the amount of space used by your data. Some queries also speed up query time because fewer bytes must be read from the disk.

```ruby
    compress_segmentby: 'identifier',
    compression_interval: '7 days'
```

The [segmentby][14] option works like a group by clause for compression. In our case, we have an `identifier` that will be used to group types of events.

Check the [segmentation guide][15] to better understand this feature's power.

Behind the scenes, the timescale gem is just inserting some SQL queries that interface with Timescale functions. For this example, it's running the
following queries:

```sql
ALTER TABLE events SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'identifier'
);
```

And the `compression_interval` is responsible for establishing a policy on when to compress the data. So in our example, after the data is 7 days old, we can already compress it to save space.

```sql
SELECT add_compression_policy('events', INTERVAL '7 days');
```

## Inserting some data

Now, let's insert some random data into the hypertable to see how it works:

```ruby
Event.insert_all [
  { identifier: "sign_up", payload: {"name" => "Eon"} },
  { identifier: "login", payload: {"email" => "eon@timescale.com"} },
  { identifier: "click", payload: {"user" => "eon", "path" => "/install/timescaledb"} },
  { identifier: "scroll", payload: {"user" => "eon", "path" => "/install/timescaledb"} },
  { identifier: "logout", payload: {"email" => "eon@timescale.com"} }
]
```

As we're using the `created_at` column as the time column, we don't need to
specify it because ActiveRecord will automatically set it.

If you want to assign it, you'll need to override this method to allow it to pass in the payload:

```ruby
class Event < ActiveRecord::Base
  def self.timestamp_attributes_for_create_in_model
    []
  end
end
```

Also, note that I'm using [insert_all][16] because it's faster than trying to go record by record.

## Generate data with faker

Now, let's use the faker gem to create some massive fake data for the events table:


```ruby
# all_in_one.rb file
require 'bundler/inline

gemfile(true) do
  gem 'timescaledb'
  gem 'faker'
  gem 'pry'
end
```

Let's create a method to generate a random payload using different emails and names.

```ruby
def generate_fake_data(total: 100_000)
  time = 1.month.ago
  total.times.flat_map do
    identifier = %w[sign_up login click scroll logout view]
    time = time + rand(60).seconds
    {
      created_at: time,
      updated_at: time,
      identifier: identifier.sample,
      payload: {
        "name" => Faker::Name.name,
        "email" => Faker::Internet.email
      }
    }
  end
end
```

The fake data generator will start creating records from 1 year ago, and the period between the records is from 1 to 60 seconds. Now, inserting a few thousand records will be easy:

```ruby
batch = generate_fake_data total: 10_000
Event.insert_all(batch, returning: false)
```

Now, it's time to query the data and learn how to use the helpers that are
available for querying data.

## Querying data

A few scopes are available to help filter the data and make it easier to work with the time column and filter by standard time frames.

### Filtering by date

Counting events from the previous month:

```ruby
Event.previous_month.count # => 10000
```

Similar scopes filtering by time can be:

* `previous_week` and `previous_day`
* `last_week` and `last_hour`
* `this_week` and `this_month`
* `yesterday`, `today` and `last_hour`

As the scopes are smart, you can combine them with more complex queries.
For example, let's count records from the previous month grouped by identifier:

```ruby
Event.previous_month.group('identifier').count
 {"click"=>1665,
 "login"=>1681,
 "logout"=>1662,
 "scroll"=>1606,
 "sign_up"=>1684,
 "view"=>1702}
```


### Using the Timescale `time_bucket` function

You can combine it with the [time_bucket][18] function. For now, I couldn't find an exciting way to build a DSL for the time bucket, but you can make it with SQL through the query.

```ruby
Event
  .previous_month
  .select("time_bucket('1 day', created_at) as time, identifier, count(*)")
  .group("1,2").map(&:attributes)
[{"time"=>2022-08-06 00:00:00 UTC, "identifier"=>"click", "count"=>224},
 {"time"=>2022-08-06 00:00:00 UTC, "identifier"=>"login", "count"=>244},
 {"time"=>2022-08-06 00:00:00 UTC, "identifier"=>"logout", "count"=>239},
 {"time"=>2022-08-06 00:00:00 UTC, "identifier"=>"scroll", "count"=>230},
 {"time"=>2022-08-06 00:00:00 UTC, "identifier"=>"sign_up", "count"=>227},
 {"time"=>2022-08-06 00:00:00 UTC, "identifier"=>"view", "count"=>245},
 {"time"=>2022-08-07 00:00:00 UTC, "identifier"=>"click", "count"=>516},
 {"time"=>2022-08-07 00:00:00 UTC, "identifier"=>"login", "count"=>471},
 {"time"=>2022-08-07 00:00:00 UTC, "identifier"=>"logout", "count"=>484},
 {"time"=>2022-08-07 00:00:00 UTC, "identifier"=>"scroll", "count"=>451},
 # ... more records here
]
```

### Querying metadata

The gem also contains several methods to inspect the Timescale metadata. So let's start diving into the methods and how they can be helpful.

The `hypertable` method is available directly from the model and can give you the details in the `timescaledb_information.hypertables` view.

```ruby
Event.hypertable
# => #<Timescaledb::Hypertable:0x00007fefc7b0ea78
 hypertable_schema: "public",
 hypertable_name: "events",
 owner: "jonatasdp",
 num_dimensions: 1,
 num_chunks: 5,
 compression_enabled: true,
 is_distributed: false,
 replication_factor: nil,
 data_nodes: nil,
 tablespaces: nil>
```

Behind the scenes, it's executing the following query:
```sql
SELECT *
FROM "timescaledb_information"."hypertables"
WHERE "hypertable_name" = 'events';
```

Remember that a model named `Timescaledb::Hypertable` is available, and you can build the same query directly in this model.

```ruby
Timescaledb::Hypertable.find_by hypertable_name: Event.table_name
 ```

 The same can be done for chunks. So, a hypertable has many chunks, and you can query them in an ActiveRecord relation style.

For example, the statement:

```ruby
Event.hypertable.chunks.count # => 5
```

Will execute the following query:

```sql
SELECT COUNT(*)
FROM "timescaledb_information"."chunks"
WHERE "hypertable_name" =  'events';
```

As the previous example, a model `Timescaledb::Chunk` is also available, and you can build the query directly on that too:

```ruby
Timescaledb::Chunk.where(hypertable_name: Event.table_name).count
```

Let's dive into some chunk objects:

 ```ruby
chunk = Event.hypertable.chunks.first
# => #<Timescaledb::Chunk:0x00007fefc77096d0
 hypertable_schema: "public",
 hypertable_name: "events",
 chunk_schema: "_timescaledb_internal",
 chunk_name: "_hyper_1415_11429_chunk",
 primary_dimension: "created_at",
 primary_dimension_type: "timestamp without time zone",
 range_start: 2022-09-07 00:00:00 UTC,
 range_end: 2022-09-08 00:00:00 UTC,
 range_start_integer: nil,
 range_end_integer: nil,
 is_compressed: false,
 chunk_tablespace: nil,
 data_nodes: nil>
```

### The TimescaleDB Compression

Chunk objects can also be compressed or decompressed. So, reusing the
last variable:

```ruby
chunk.compress!
```

That will basically execute the following query:

```sql
SELECT compress_chunk(('_timescaledb_internal._hyper_1415_11429_chunk')::regclass)
```

You can also check details about the detailed size of the hypertable. After
compressing, you can see how much space you're saving.

```ruby
size = Event.hypertable.detailed_size
#<2, total_bytes=1933312, node_name=nil>`sql
 SELECT * from hypertable_compression_stats('events')
```

As you can see in the previous data, the compression was ineffective. So now, let's compress all uncompressed chunks, as this was probably the chunk with fewer data.

```ruby
Event.hypertable.chunks.uncompressed.each(&:compress!)
```

Now, rechecking the status:
```ruby
stats = Event.hypertable.compression_stats
# => #<OpenStruct total_chunks=5
#  number_compressed_chunks=5
#  before_compression_table_bytes=1400832
#  before_compression_index_bytes=491520
#  before_compression_toast_bytes=40960
#  before_compression_total_bytes=1933312
#  after_compression_table_bytes=40960
#  after_compression_index_bytes=81920
#  after_compression_toast_bytes=688128
#  after_compression_total_bytes=811008
#  node_name=nil>
```

Now, let's do some math to calculate the compression ratio and understand how
much space we're saving in the table:

```ruby
100 - (stats.after_compression_table_bytes / stats.before_compression_table_bytes.to_f) * 100
=> 97.07602339181287
```

Not bad! 97% of the space was saved 🚀

I hope you enjoyed this first post about the gem. If you have any feedback, don't hesitate to reach out! Looking forward to seeing more Rubyists adopting TimescaleDB!

[1]: https://github.com/jonatas/timescaledb/blob/master/examples/all_in_one/all_in_one.rb
[2]: https://jonatas.github.io/timescaledb/
[3]: https://github.com/jonatas/timescaledb/pulls
[4]: https://github.com/ged/ruby-pg
[5]: http://pry.github.io
[6]: https://docs.timescale.com/install/latest/
[7]: https://www.timescale.com/timescale-signup/
[9]: https://docs.timescale.com/timescaledb/latest/overview/core-concepts/hypertables-and-chunks/
[10]: https://ruby-doc.org/core-3.1.2/BasicObject.html#method-i-instance_exec
[11]: https://docs.timescale.com/api/latest/hypertable/create_hypertable/
[12]: https://docs.timescale.com/api/latest/hypertable/create_hypertable/#create-hypertable
[13]: https://docs.timescale.com/timescaledb/latest/overview/core-concepts/compression/
[14]: https://docs.timescale.com/timescaledb/latest/overview/core-concepts/compression/architecture/#hybrid-row-columnar-format-for-chunks
[15]: https://docs.timescale.com/timescaledb/latest/how-to-guides/compression/about-compression/#segment-by-columns
[16]: https://apidock.com/rails/v6.0.0/ActiveRecord/Persistence/ClassMethods/insert_all
[17]: https://github.com/jonatas/timescaledb#more-resources
[18]: https://docs.timescale.com/api/latest/hyperfunctions/time_bucket/
[19]: https://docs.timescale.com/api/latest/hypertable/hypertable_detailed_size/
[20]: https://docs.timescale.com/api/latest/compression/hypertable_compression_stats/

