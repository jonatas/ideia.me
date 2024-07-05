---
layout: post
categories: [time-series, timescaledb, opensource, performance, ruby]
---

Adding to my goal of being helpful in the software world, I had my first contribution to RubyGems
[merged][new_pr] 🎉

It effectively just adds [timescaledb gem][ts-gem] to the RubyGems server and
it marks the beginning of a journey.

This merge is not just about adding the gem to the server, but also about opening
a commitment path to maintain the work and keep it up-to-date.

I created the [timescaledb][ts-gem] gem to help Ruby developers interact with
TimescaleDB, a time-series database built on top of PostgreSQL. As I work as a
Developer Advocate at Timescale, I created the library but never used it in a
production case. Now, let's take a look at what we have and what it will look like.

If you're curious about the full example, check out the [PoC of downloads][gist] I made,
which parses a sample log file and builds the ingest pipeline to track and build
statistics around the downloads.

## How are downloads tracked today?

The RubyGems dump is available for download. You can run it locally quite easily
to fetch [latest data](https://rubygems.org/pages/data).

The main model storing the gems is the `Rubygem` model. It has a `name` field
that tracks the name and is also unique. Let's use [ffast](https://rubygems.org/gems/ffast) as an example,
a gem that I created for another purpose.

```ruby
Rubygem.find_by(name: "ffast")
  Rubygem Load (53.9ms)  SELECT "rubygems".* FROM "rubygems" WHERE "rubygems"."name" = 'ffast' LIMIT 1
=>
#<Rubygem:0x000000012b902fa0
 id: 162483,
 name: "ffast",
 created_at: Fri, 07 Jul 2017 03:14:59.930836000 UTC +00:00,
 updated_at: Fri, 17 Nov 2023 22:35:13.843324000 UTC +00:00,
 indexed: true>
```

The `gem_downloads` table stores the download counts for each gem and version.

```ruby
Rubygem.find_by(name: "ffast").gem_download
# => #<GemDownload:0x000000012ba18bb0 id: 1040717, rubygem_id: 162483, version_id: 0, count: 61240>
```

The version 0 is used to store the total number of downloads for a gem.
Let's check the timescaledb gem downloads version by version:

```ruby
GemDownload.where rubygem: Rubygem.where(name: "timescaledb")
# GemDownload Load (19.0ms)  SELECT "gem_downloads".* FROM "gem_downloads" WHERE "gem_downloads"."rubygem_id" IN (SELECT "rubygems"."id" FROM "rubygems" WHERE "rubygems"."name" = 'timescaledb') /* loading for pp */ LIMIT 11
=>
[#<id: 1535560, rubygem_id: 202908, version_id: 1416878, count: 1888>,
 #<id: 1625766, rubygem_id: 202908, version_id: 1503257, count: 11117>,
 #<id: 1552678, rubygem_id: 202908, version_id: 1433205, count: 1156>,
 #<id: 1491839, rubygem_id: 202908, version_id: 1375481, count: 1359>,
 #<id: 1491667, rubygem_id: 202908, version_id: 1375327, count: 1229>,
 #<id: 1872196, rubygem_id: 202908, version_id: 1729060, count: 1198>,
 #<id: 1647372, rubygem_id: 202908, version_id: 1524050, count: 389>,
 #<id: 1488577, rubygem_id: 202908, version_id: 1372457, count: 1285>,
 #<id: 1622843, rubygem_id: 202908, version_id: 1500448, count: 484>,
 #<id: 1512167, rubygem_id: 202908, version_id: 1394533, count: 1274>,
 "..."]
```

You can also combine the counter version by version in a single query:

```ruby
Rubygem
  .find_by(name: "timescaledb")
  .versions.includes(:gem_download)
  .pluck :number, :count

#  Rubygem Load (4.0ms)  SELECT "rubygems".* FROM "rubygems" WHERE "rubygems"."name" = 'timescaledb' LIMIT 1
#  Version Pluck (4.8ms)  SELECT "versions"."number", "count" FROM "versions" LEFT OUTER JOIN "gem_downloads" ON "gem_downloads"."version_id" = "versions"."id" WHERE "versions"."rubygem_id" = 202908
=>
[["0.1.0", 1285],
 ["0.1.2", 1266],
 ["0.1.3", 1229],
 ["0.1.4", 1359],
 ["0.1.5", 1274],
 ["0.2.0", 1888],
 ["0.2.1", 1156],
 ["0.2.2", 484],
 ["0.2.3", 11117],
 ["0.2.4", 389],
 ["0.2.5", 4265],
 ["0.2.6", 445],
 ["0.2.7", 24963],
 ["0.2.8", 1198],
 ["0.2.9", 1128]]
```

And, probably as you're learning and getting excited about the numbers, let's watch the
amazing growth of the rails gem only on stable releases:

```ruby
Rubygem.find_by(name: "rails").versions.includes(:gem_download).where("number ~ '.0.0$'").pluck :number, :count
  Rubygem Load (4.0ms)  SELECT "rubygems".* FROM "rubygems" WHERE "rubygems"."name" = 'rails' LIMIT 1
  Version Pluck (8.7ms)  SELECT "versions"."number", "count" FROM "versions" LEFT OUTER JOIN "gem_downloads" ON "gem_downloads"."version_id" = "versions"."id" WHERE "versions"."rubygem_id" = 15494 AND (number ~ '.0.0$')
=>
[["0.10.0", 5424],
 ["1.0.0", 6887],
 ["2.0.0", 7113],
 ["3.0.0", 478487],
 ["4.0.0", 2682776],
 ["5.0.0", 1031696],
 ["6.0.0", 2244407],
 ["7.0.0", 298492]]
```

As you can see almost 3M downloads on the Rails 4.0.0 version. It's a huge number!

## How the downloads are tracked?

Moving on, the download counts are updated by the `FastlyLogProcessor` job that
runs every 5 minutes. A new log file is generated every few minutes. The files
are around 2 MB and are stored in the S3 bucket. I don't have access to the logs
yet, but a core tem member gave me a sample anonymized log to work on the PoC.

The job reads the logs from the S3 bucket and processes the logs to update the
download counts.

The [download_counts][processor] method is the log processor that sums the number
of downloads per gem per day and update the counters.

Then, the `GemDownload` model is used to store the download counts for each gem
and version.

```ruby
  counts = download_counts(log_ticket)
  # ...

  processed_count = counts.sum { |_, v| v }
  GemDownload.for_all_gems.with_lock do
    GemDownload.bulk_update(counts)
    # ...
  end
```

To track the overall number of downloads per gem, the `GemDownload` accumulate them
all in the version 0 as a way to track the total number of downloads for a gem.

## How will it looks like?

Downloads are events, and events are time-series data. The data is stored in a
relational database, but it's not optimized for time-series data. The actual
data is only the final counters being incremented every 5 minutes.

With the [timescaledb extension][tsdb_extension], we can store the raw data as events and build
materialized views to track the downloads per gem, version, and day.

The `timescaledb` extension will help ingest the data into the database and build
the materialized views to track the downloads.


## Advantages of using TimescaleDB

While the actual solution is very lean and works well, it's not optimized for
timeseries data. It's not exploring the full potential of the data because of the
way the data is being saved.

Timeseries data is about events that happen over time. The data is stored in
a way that allows querying and aggregating data efficiently. It allows you to
understand user behavior and track the growth of downloads, the rush hours,
and the most popular gems.

We'll also be able to detect anomalies and build a dashboard to track the downloads
in real time.

The main advantage of using TimescaleDB is that it's PostgreSQL. You just speak
SQL, and that's it. You can use the same tools and libraries you're used to.

Now, let's break down the PoC and build the ingest pipeline to track and build
statistics around the downloads.

Let's start with the plain logs we have:

```
<134>2024-04-26T00:10:54Z cache-pao-kpao1770049 downloads[262515]: 1.2.3.4 Fri, 26 Apr 2024 00:10:54 GMT /gems/racc-1.7.3-java.gem 200 bundler/2.5.9 rubygems/3.3.25 ruby/3.1.0 (x86_64-Eclipse Adoptium-linux) command/install jruby/1.2.3.4 options/jobs,no_install,path ci/ci,github 47244d1623b8b050
<134>2024-04-26T00:10:54Z cache-iad-kiad7000157 downloads[262515]: 1.2.3.4 Fri, 26 Apr 2024 00:10:54 GMT /gems/aws-sdk-core-3.193.0.gem 200 Ruby, RubyGems/3.1.4 x86_64-linux Ruby/2.7.2 (2020-10-01 patchlevel 137)
<134>2024-04-26T00:10:54Z cache-pao-kpao1770049 downloads[262515]: 1.2.3.4 Fri, 26 Apr 2024 00:10:54 GMT /gems/regexp_parser-2.9.0.gem 200 bundler/2.5.9 rubygems/3.3.25 ruby/3.1.0 (x86_64-Eclipse Adoptium-linux) command/install jruby/1.2.3.4 options/jobs,no_install,path ci/ci,github 47244d1623b8b050
<134>2024-04-26T00:10:54Z cache-iad-kiad7000022 downloads[262515]: 1.2.3.4 Fri, 26 Apr 2024 00:10:54 GMT /gems/debase-ruby_core_source-3.3.1.gem 200 Ruby, RubyGems/3.4.1 x86_64-linux Ruby/2.6.10 (2022-04-12 patchlevel 210)
<134>2024-04-26T00:10:54Z cache-iad-kjyo7100141 downloads[262515]: 1.2.3.4 Fri, 26 Apr 2024 00:10:54 GMT /gems/apollo_upload_server-2.1.5.gem 200 Ruby, RubyGems/3.4.4 x86_64-linux Ruby/3.1.4 (2023-03-30 patchlevel 223)
<134>2024-04-26T00:10:54Z cache-chi-klot8100092 downloads[262515]: 1.2.3.4 Fri, 26 Apr 2024 00:10:54 GMT /gems/database_cleaner-core-2.0.1.gem 200 bundler/2.5.9 rubygems/3.4.4 ruby/3.0.6 (x86_64-pc-linux) command/install options/no_install,path 8d319b4f02ec22c1
<134>2024-04-26T00:10:54Z cache-iad-kiad7000088 downloads[262515]: 1.2.3.4 Fri, 26 Apr 2024 00:10:54 GMT /gems/unicode-display_width-2.5.0.gem 200 Ruby, RubyGems/3.1.6 x86_64-linux Ruby/2.7.8 (2023-03-30 patchlevel 225)
<134>2024-04-26T00:10:54Z 2024-04-26T00:10:54.586614839+00:00 downloads[262515]: 1.2.3.4 Fri, 26 Apr 2024 00:10:54 GMT /gems/tomlrb-2.0.3.gem 200 bundler/2.5.9 rubygems/3.5.3 ruby/3.3.0 (x86_64-pc-linux) command/install options/app_config,ignore_messages,no_install,rubygems.pkg.github.com,silence_root_warning 4d2c9a175ea7b626
<134>2024-04-26T00:10:54Z cache-iad-kcgs7200148 downloads[262515]: 1.2.3.4 Fri, 26 Apr 2024 00:10:54 GMT /gems/rspec-its-1.3.0.gem 200 Ruby, RubyGems/3.1.0 x86_64-linux Ruby/2.5.7 (2019-10-01 patchlevel 206)
<134>2024-04-26T00:10:54Z cache-iad-kcgs7200148 downloads[262515]: 1.2.3.4 Fri, 26 Apr 2024 00:10:54 GMT /gems/rspec-mocks-3.13.0.gem 200 Ruby, RubyGems/3.1.0 x86_64-linux Ruby/2.5.7 (2019-10-01 patchlevel 206)
```

Now, let's parse this info:

```ruby
def parse_file(file)
  downloads = []
  File.open(file).each_line do |log_line|
    fragments = log_line.split
    path, response_code = fragments[10, 2]
    case response_code.to_i
      # Only count successful downloads
      # NB: we consider a 304 response a download attempt
    when 200, 304
      m = path.match(PATH_PATTERN)
      gem_name = m[:gem_name] || path
      gem_version = m[:gem_version]
      # ip = fragments[3]
      ts = Time.parse fragments[4..9].join(' ')
      env = parse_env fragments[12..-1]

      payload = {env:}

      downloads << {ts:, gem_name:, gem_version:, payload:}
      if downloads.size == 5000
        insert_downloads(downloads)
        downloads.clear
      end
    end
  end

  if downloads.any?
    insert_downloads(downloads)
  end
end
```

As you can see, we hardcoded 5k batches to insert the data. This is a good practice
to avoid memory issues and to keep the data flowing.

For inserting the data, we can use the `timescaledb` along with the `bulk_insert`
to insert the data in batches.

```ruby
def insert_downloads(downloads)
  Download.bulk_insert values: downloads
end
```

The `Download` model is a simple ActiveRecord model that maps the `downloads` table
which is also a simple table with the columns `ts`, `gem_name`, `gem_version`, and
`payload`.

So, you can imagine a migration with the following content:

```ruby
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
```

Then you can build the materialized views to track the downloads per gem, version,
and day. Now, let's build the materialized views to track the downloads per gem.

Interestingly, there are quite a few hierarchical continuous aggregates, and I
believe it’s a good idea to keep them in a separate migration.

Now, let me try to break down all the cyclomatic complexity and build a simple
model to track the downloads per gem, version, and day.

```ruby
class Download < ActiveRecord::Base
  acts_as_hypertable time_column: 'ts'

  scope :time_bucket, -> (range='1m', query="count(*)") do
    select("time_bucket('#{range}', #{time_column}) as #{time_column}, #{query}")
  end

  scope :per_minute, -> (query="count(*) as downloads") do
    time_bucket('1m', query).group(1)
  end

  scope :gems_per_minute, -> do
    per_minute("gem_name, count(*) as downloads").group(1,2)
  end

  scope :versions_per_minute, -> do
    per_minute("gem_name, gem_version, count(*) as downloads").group(1,2,3)
  end
  ...
end
```

Now, think about rolling up these statistics per hour, day, week, month, and year.

I believe it's a good idea to keep them in a separate module and use the `cagg`
as a factory to build the models for each view.

This way, you can keep the code for each continuous aggregate in a separate
module but nested to the hypertable model, which I think is a good convention.


```ruby
  cagg = -> (view_name) do
    Class.new(ActiveRecord::Base) do
      self.table_name = "downloads_#{view_name}"

      QUERIES = {
        sum_downloads: "sum(downloads)::bigint as downloads",
        avg_downloads: "avg(downloads)::bigint as avg_downloads"
      }

      scope :rollup, -> (range='1d', query=:sum_downloads) do
        select("time_bucket('#{range}', ts) as ts, #{QUERIES[query] || query}")
          .group(1)
      end

      scope :per_hour, -> (query=:sum_downloads) do
        rollup('1h', query)
      end

      scope :per_day, -> (query=:sum_downloads) do
        rollup('1d', query)
      end

      scope :per_week, -> (query=:sum_downloads) do
        rollup('1w', query)
      end

      scope :per_month, -> (query=:sum_downloads) do
        rollup('1mon', query)
      end

      scope :per_year, -> (query=:sum_downloads) do
        rollup('1y', query)
      end

      def readonly?
        true
      end

      def self.refresh!
        ActiveRecord::Base.connection.execute <<-SQL
        CALL refresh_continuous_aggregate('#{table_name}', null, null);  
        SQL
      end
    end
  end
```

In the end, you can use the `cagg` to build the models for each continuous aggregate
and keep the code clean and organized.

In this way, we keep the most important metadata in the code and then
make it easy to build the materialized views and keep them up-to-date.

```ruby
  PerMinute = cagg['per_minute']
  PerHour= cagg['per_hour']
  PerDay = cagg['per_day']
  PerMonth = cagg['per_month']
  GemsPerMinute = cagg['gems_per_minute']
  GemsPerHour= cagg['gems_per_hour']
  GemsPerDay = cagg['gems_per_day']
  GemsPerMonth= cagg['gems_per_month']
  VersionsPerMinute= cagg['versions_per_minute']
  VersionsPerHour = cagg['versions_per_hour']
  VersionsPerDay = cagg['versions_per_day']
  VersionsPerMonth = cagg['versions_per_month']
end # Download class
```

Now, the materialized views are just a massive naming for each query:

```ruby
  {
    per_minute: Download.per_minute,
    per_hour: Download::PerMinute.per_hour(:sum_downloads).group(1),
    per_day: Download::PerHour.per_day(:sum_downloads).group(1),
    per_month: Download::PerDay.per_month(:sum_downloads).group(1),

    gems_per_minute: Download.gems_per_minute,
    gems_per_hour: Download::GemsPerMinute.per_hour("gem_name, count(*) as downloads").group(1,2),
    gems_per_day: Download::GemsPerHour.per_day("gem_name, count(*) as downloads").group(1,2),
    gems_per_month: Download::GemsPerDay.per_month("gem_name, count(*) as downloads").group(1,2),

    versions_per_minute: Download.versions_per_minute,
    versions_per_hour: Download::VersionsPerMinute.per_hour("gem_name, gem_version, count(*) as downloads").group(1,2,3),
    versions_per_day: Download::VersionsPerHour.per_day("gem_name, gem_version, count(*) as downloads").group(1,2,3),
    versions_per_month: Download::VersionsPerDay.per_month("gem_name, gem_version, count(*) as downloads").group(1,2,3)
  }.each do |name, scope|
    puts "Creating continuous aggregate #{name}", scope.to_sql
    frame = name.to_s.split('per_').last
    create_continuous_aggregate(
      "downloads_#{name}",
      scope.to_sql,
      refresh_policies: {
        schedule_interval: "INTERVAL '1 #{frame}'",
        start_offset: "INTERVAL '3 #{frame}'",
        end_offset: "INTERVAL '1 minute'"
      })
  end
```

And with such a simple code, you can build the materialized views to track the
downloads per gem, version, and day.

Let's explore a bit what we have built so far:

```ruby
Download.first
# => #<Download:0x000000012791f050
 ts: 2024-04-26 00:10:54 UTC,
 gem_name: "racc",
 gem_version: "1.7.3-java",
 payload: {"env"=>{"ruby"=>"3.1.0", "bundler"=>"2.5.9", "rubygems"=>"3.3.25"}}>
```

Now, let's explore overall downloads per gem:

```ruby
Download.gems_per_minute.map(&:attributes)
```

This is going to raw data not using the materialized views:
```ruby
[
{"ts"=>2024-04-26 00:11:00 UTC, "gem_name"=>"google-cloud-env", "downloads"=>3},
 {"ts"=>2024-04-26 00:15:00 UTC, "gem_name"=>"systemu", "downloads"=>2},
 {"ts"=>2024-04-26 00:11:00 UTC, "gem_name"=>"racc", "downloads"=>6},
 {"ts"=>2024-04-26 00:14:00 UTC, "gem_name"=>"message_bus", "downloads"=>1},
 {"ts"=>2024-04-26 00:15:00 UTC, "gem_name"=>"rails-dom-testing", "downloads"=>4},
 # ...
]
```

# Exploring the materialized views

Continuous aggregates are a way to keep the materialized views up-to-date. The
background jobs will just check what is the missing data and update the materialized
views.

Now, start with the sum of all gems per minute in the continuous aggregate:

```ruby
Download::PerMinute.first
# D, [2024-07-04T16:49:51.714221 #94112] DEBUG -- :   Download::PerMinute Load (2.9ms)  SELECT "downloads_per_minute".* FROM "downloads_per_minute" LIMIT $1  [["LIMIT", 1]]
# => #<Download::PerMinute:0x0000000128a012d8 ts: 2024-04-26 00:10:00 UTC, downloads: 110>
```


Now, let's explore downloads of rails gems per minute:

```ruby
Download::GemsPerMinute.where gem_name: "rails"
# D, [2024-07-04T16:51:12.707122 #94112] DEBUG -- :   Download::GemsPerMinute Load (5.0ms)  SELECT "downloads_gems_per_minute".* FROM "downloads_gems_per_minute" WHERE "downloads_gems_per_minute"."gem_name" = $1 /* loading for pp */ LIMIT $2  [["gem_name", "rails"], ["LIMIT", 11]]
# => [#<Download::GemsPerMinute:0x000000012822c1c0
  ts: 2024-04-26 00:15:00 UTC,
  gem_name: "rails",
  downloads: 1>,
 #<Download::GemsPerMinute:0x000000012822c080
  ts: 2024-04-26 00:14:00 UTC,
  gem_name: "rails",
  downloads: 4>,
```

Let's break down using the version now:

```ruby
Download::VersionsPerMinute.where gem_name: "rails"
# D, [2024-07-04T16:53:35.566434 #94112] DEBUG -- :   Download::VersionsPerMinute Load (6.0ms)  SELECT "downloads_versions_per_minute".* FROM "downloads_versions_per_minute" WHERE "downloads_versions_per_minute"."gem_name" = $1 /* loading for pp */ LIMIT $2  [["gem_name", "rails"], ["LIMIT", 11]]
# => [#<Download::VersionsPerMinute:0x000000012882e320
  ts: 2024-04-26 00:15:00 UTC,
  gem_name: "rails",
  gem_version: "1.2.3.4",
  downloads: 1>,
 #<Download::VersionsPerMinute:0x0000000128264890
  ts: 2024-04-26 00:14:00 UTC,
  gem_name: "rails",
  gem_version: "1.2.3.4",
  downloads: 2>,
 #<Download::VersionsPerMinute:0x0000000128264750
  ts: 2024-04-26 00:14:00 UTC,
  gem_name: "rails",
  gem_version: "6.1.7",
  downloads: 1>,
  # ...
]
```

We have built a simple ingest pipeline to track the downloads per gem, version,
and day. We have built the materialized views to track the downloads per gem,
version, by minute, hour, and day.

## Next steps

The PoC is complete, and my next step is to migrate all the important pieces as
production-ready code. But as production code, we need to keep it clean and make
it step by step.

1. Introduce the migration to build the tables and the continuous aggregates.
2. Introduce a new [FastlyLogProcessor][processor] that uses the already-implemented parser.
3. Schedule a Job that uses the processor to get new files from the [SQS][sqs_worker] the logs when a new log is
   available.
4. Create a refresh policy to keep the materialized views up-to-date.
5. Create a maintenance task to migrate all previous logs available.
6. Create a dashboard to track the downloads and offer more insights to gem
   creators and users.

I hope you enjoyed this journey and I'm going to be implementing the next steps.
Keep an eye on the [open issue][issue] to check for new updates.

If you want to know more about TimescaleDB, check out the [timescaledb gem][ts-gem]
and the [timescaledb extension][tsdb_extension].

## Thanks RubyGems team

I just want to say thanks to the RubyGems team for the opportunity, especially
[@simi][simi] and [@colby-swandale][colby] for their support and guidance in
helping me merge this contribution.

I’m looking forward to the next steps, and I’m excited to keep contributing to the RubyGems project.

I just want to say thanks to the RubyGems team for the opportunity and
especially the support and guidance from 
to help me to get this contribution merged.

I'm looking forward to the next steps and I'm excited to keep contributing to the
RubyGems project.

[old_pr]: https://github.com/rubygems/rubygems.org/pull/3560
[issue]: https://github.com/rubygems/rubygems.org/issues/4642
[new_pr]: https://github.com/rubygems/rubygems.org/pull/4716
[gist]: https://gist.github.com/jonatas/418f360d45c890e1d86c30547a0cf6a4
[processor]: https://github.com/rubygems/rubygems.org/blob/6e919e3cc077abde5553b19afe6efbdcb04e106a/app/jobs/fastly_log_processor.rb#L44-L67
[tsdb_extension]: https://github.com/timescale/timescaledb
[ts-gem]: https://rubygems.org/gems/timescaledb
[simi]: https://github.com/simi
[colby]: https://github.com/colby-swandale
[sqs_worker]: https://github.com/rubygems/rubygems.org/blob/e7faec5ad1b43162368b77e0f4add8f6bd932cbb/lib/shoryuken/sqs_worker.rb#L26
