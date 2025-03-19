---
layout: post
title: "Benchmarking Ruby ORMs: ActiveRecord vs Sequel Performance with TimescaleDB"
categories: ruby postgresql performance
image: /images/postgresql-performance-workshop.webp
---

Hey Ruby friends! This year I'm super excited to offer a PostgreSQL Performance Workshop for Rubyists. I already ran the first one at the [Ruby Community Conference](https://rubycommunityconference.com), and it was a blast!

I wanted to share some key learnings we discovered during the workshop and reflect on how our technology choices impact performance. I'm particularly interested in how we can mix technologies to keep all the conveniences Rails offers while still achieving fast execution and low memory footprint for those high-throughput bottlenecks we all struggle with.

![Performance Workshop](/images/postgresql-performance-workshop.webp "Performance Workshop ORMs comparison")

With Ruby 3.3's impressive performance improvements and Rails 8's focus on speed, I've been watching the ORM performance landscape evolve rapidly. The benchmarks I've been running show up to 70% faster Ruby code execution with YJIT in Ruby 3.3, but I kept wondering: how does this translate to real-world database operations? As our applications scale and data grows, choosing the right ORM strategy becomes more critical than ever.

In this post, I'll dive into the latest performance differences I found between ActiveRecord and Sequel when working with TimescaleDB, a specialized PostgreSQL extension for time-series data. My benchmarks were conducted using Ruby 3.3.6 and the latest versions of both ORMs, and honestly, I was surprised by some of the insights about when and why certain approaches outperform others.

## The ORM Performance Benchmark Challenge

My no-brain choice is always ActiveRecord but for the Performance workshop, I started collecting also information in reddit and I decided to also build comparison between different ORMs. Each ORM offers unique features, syntax, and performance characteristics. The benchmarks I'm sharing aim to provide insights into these performance differences to help you make informed decisions for your projects.

It's important to note that these benchmarks focus purely on execution time and memory usage - they don't account for developer productivity, which is a crucial factor when choosing an ORM. While Sequel may outperform ActiveRecord in raw speed for certain operations, ActiveRecord's integration with Rails and familiar syntax can significantly reduce development time. The true cost of an ORM includes both execution performance and the time developers spend writing and maintaining code.

Let's check out the results from my comprehensive benchmarking tests:

### Query Types Performance (operations per second)

| Operation Type | ActiveRecord | Sequel | Raw SQL | Key Insights |
|---------------|--------------|--------|---------|--------------|
| Simple Select | 82.6 | 10,178.6 | 12,450.2 | Sequel is ~123x faster than ActiveRecord for simple queries |
| Complex Joins | 28.7 | 93.3 | 105.1 | Sequel offers ~3.3x better performance for complex joins |
| Aggregations | 220.2 | 164.0 | 245.3 | ActiveRecord optimizes count operations well |
| Bulk Inserts | 215.7 | 272.6 | 310.4 | Specialized bulk operations are critical for insert performance |
| JSON Operations | 145.3 | 188.9 | 195.7 | Native JSON operators improve performance across all approaches |

### Memory Usage Patterns (MB)

| Operation Type | ActiveRecord | Sequel | Raw SQL | Key Insights |
|----------------|--------------|--------|---------|--------------|
| Large Result Set | 125 | 45 | 30 | ActiveRecord objects consume ~2.8x more memory than Sequel |
| Batch Processing | 60 | 35 | 25 | Using `find_each` with ActiveRecord helps control memory usage |
| JSON Processing | 80 | 50 | 45 | JSONB is more memory-efficient than standard JSON |
| Aggregations | 40 | 35 | 30 | Memory patterns are similar for aggregation operations |

## Key Findings from My Benchmarks

Before diving into the detailed results, I want to share some key insights from my comprehensive benchmarking study. These findings represent patterns I observed across multiple test scenarios and real-world applications I've worked on.

![Jeremy Evans and I discussing Ruby performance at RubyConf Thailand](/images/jonatas-paganini-jeremy-evans-polished-ruby-book-rubyconf-thailand-2023.jpeg "Meeting with Jeremy Evans, the creator of Sequel, at RubyConf Thailand 2023")

I had the incredible privilege of meeting Jeremy Evans (that's us in the photo above), the creator of Sequel and author of "Polished Ruby Programming," at RubyConf Thailand 2023. His insights have been invaluable in helping me understand the design decisions that make Sequel so performant in many scenarios.

My benchmarks revealed several consistent patterns:

1. **Sequel excels at raw speed for simple queries** - For basic CRUD operations, I consistently saw Sequel outperform ActiveRecord by significant margins, often 10-100x faster for simple selects. This blew my mind the first time I measured it!

2. **ActiveRecord shines with complex associations** - When I worked with deeply nested associations and complex Rails-integrated workflows, ActiveRecord's eager loading optimizations sometimes outperformed manual Sequel approaches. This makes sense given Rails' tight integration.

3. **Memory usage is often the limiting factor** - In my high-throughput applications, I found that memory consumption frequently becomes the bottleneck before query speed, making lightweight ORMs particularly valuable. I've experienced this pain point firsthand in production.

4. **Bulk operations provide the biggest performance gains** - Regardless of which ORM I chose, using bulk operations instead of row-by-row processing offered the most dramatic performance improvements. This was consistent across all my tests.

5. **TimescaleDB optimizations amplify performance differences** - When I worked with time-series data in TimescaleDB, I noticed the performance gap between optimized and unoptimized queries grows even wider.

Let's examine these findings in more detail with specific benchmark results I captured:

### 1. Batch Processing Comparison

|  Operation                              |    Time  | Queries |     Rate  | Relative Speed |
|-----------------------------------------|----------|---------|-----------|----------------|
| Processing all records at once          | 10.342 s | 90,001  |   2.9k/s  | baseline       |
| Using find_each with default batch size |  9.657 s | 90,031  |   3.1k/s  | 1.1x faster    |
| Using find_each with custom batch size  |  9.441 s | 90,031  |   3.2k/s  | 1.1x faster    |
| Using update_all                        |  0.282 s |      1  | 106.4k/s  | 36.6x faster   |

The results are clear: bulk operations like `update_all` are dramatically faster (36.6x) but bypass ActiveRecord callbacks and validations. I've found this represents a common trade-off I need to make between performance and application logic. Sometimes I choose performance, sometimes I need those callbacks!

### 2. Bulk Insert Performance

| Operation                   |   Time  | Queries |      Rate  | Relative Speed |
|-----------------------------|---------|---------|-----------|----------------|
| Individual inserts          | 0.041 s |    300  |   2.4k/s  | baseline       |
| Bulk insert with insert_all | 0.002 s |      1  |  50.0k/s  | 22.0x faster   |

I was amazed to see bulk inserts are 22x faster than individual inserts, with a 300:1 query reduction. This demonstrates how reducing the number of database roundtrips can dramatically improve performance. I use this technique all the time now.

### 3. Upsert Performance

| Operation                    |   Time  | Queries |     Rate  | Relative Speed |
|------------------------------|---------|---------|-----------|----------------|
| Individual find_or_create_by | 0.049 s |    400  |   2.0k/s  | baseline       |
| Bulk upsert with insert_all  | 0.002 s |      1  |  47.1k/s  | 29.5x faster   |
| Sequel upsert                | 0.002 s |      2  |  46.8k/s  | 23.2x faster   |

Both ActiveRecord's `upsert_all` and Sequel's bulk upsert mechanisms offered similar performance benefits in my tests, showing ~25-30x improvement over individual operations. This is huge when you're processing lots of data!

### 5. Memory Optimization with OccamsRecord

OccamsRecord was another gem I learned on reddit when I created my thread and it was amazing that I added it to the benchmark.  This blew my mind - the memory savings here are insane:

```ruby
# Standard ActiveRecord (27.30 MB allocated, 68.34 KB retained)
users_data = User.includes(:posts).map do |user|
  {
    name: user.name,
    email: user.email,
    post_count: user.posts.size
  }
end

# OccamsRecord (16.03 MB allocated, 16.30 KB retained)
users_data = OccamsRecord
  .query(User.all)
  .eager_load(:posts)
  .run
  .map { |user| {
    name: user.name,
    email: user.email,
    post_count: user.posts.size
  }}
```

#### Understanding Memory Allocation Metrics

When looking at the memory metrics above, it's important to understand the difference between "allocated" and "retained" memory:

- **Allocated Memory**: The total amount of memory requested from the system during execution. This includes all temporary objects created and later discarded.
  
- **Retained Memory**: The memory that remains in use after the operation completes and isn't released back to the system. This represents the "memory footprint" that persists.

High allocation with low retention (like in the OccamsRecord example) indicates efficient garbage collection - objects are created but quickly discarded when no longer needed. This pattern is ideal for memory-intensive operations, as it reduces the risk of memory bloat and out-of-memory errors in production.

The dramatic difference in retained memory (68.34 KB vs 16.30 KB) shows why OccamsRecord can be a game-changer for memory-constrained environments or when processing large datasets.


## Interactive Benchmarking Examples

You can run these benchmark examples yourself to see the performance differences. Here's how I set up my benchmarks:

```ruby
# Simple Query Performance
Benchmark.ips do |x|
  x.config(time: 2, warmup: 1)

  x.report("ActiveRecord - all") do
    User.all.to_a
  end

  x.report("Sequel - all") do
    DB[:users].all
  end

  x.report("ActiveRecord - where") do
    User.where(created_at: 1.day.ago..Time.current).to_a
  end

  x.report("Sequel - where") do
    DB[:users].where(created_at: 1.day.ago..Time.current).all
  end

  x.compare!
end
```

For complex joins, I used:

```ruby
# Complex Join Performance
Benchmark.ips do |x|
  x.config(time: 2, warmup: 1)

  x.report("ActiveRecord - complex join") do
    User.joins(posts: :comments)
        .select('users.*, COUNT(DISTINCT posts.id) as posts_count, COUNT(comments.id) as comments_count')
        .group('users.id')
        .to_a
  end

  x.report("Sequel - complex join") do
    DB[:users]
      .join(:posts, user_id: :id)
      .join(:comments, post_id: Sequel[:posts][:id])
      .select(
        Sequel[:users][:id],
        Sequel[:users][:name],
        Sequel.function(:count, Sequel[:posts][:id]).as(:posts_count),
        Sequel.function(:count, Sequel[:comments][:id]).as(:comments_count)
      )
      .group(Sequel[:users][:id], Sequel[:users][:name])
      .all
  end

  x.compare!
end
```

And for bulk operations, I tested:

```ruby
# Bulk Operation Performance
Benchmark.ips do |x|
  x.config(time: 2, warmup: 1)

  x.report("ActiveRecord - bulk insert") do
    User.insert_all((1..100).map { |i| 
      { name: "User #{i}", email: "user#{i}@example.com", created_at: Time.current, updated_at: Time.current }
    })
  end

  x.report("Sequel - bulk insert") do
    DB[:users].multi_insert((1..100).map { |i| 
      { name: "User #{i}", email: "user#{i}@example.com", created_at: Time.current, updated_at: Time.current }
    })
  end

  x.compare!
end
```

## N+1 Query Prevention

The infamous N+1 query problem is something I've battled many times. It can severely impact application performance. My benchmarks with 1000 users (each with 10 posts and 5 comments per post) showed:

```ruby
# Bad - N+1 Query (51 queries, 0.01s)
User.limit(50).each do |user|
  puts user.posts.count  # N+1 query for each user
end

# Good - Eager Loading (2 queries, 0.02s)
User.includes(:posts).limit(50).each do |user|
  puts user.posts.length  # No additional queries
end
```

## Best Practices for ORM Performance

Based on my benchmarks, I've compiled some best practices that I now use for optimizing ORM performance:

### 1. Batch Processing

```ruby
# Inefficient
User.all.each { |user| user.update(status: 'active') }

# Efficient (36x faster)
User.update_all(status: 'active')
```

### 2. Bulk Operations

```ruby
# Inefficient
users.each { |user| User.create!(user) }

# Efficient (22x faster)
User.insert_all(users)
```

### 3. Query Optimization

```ruby
# Inefficient
User.joins(:posts).where(posts: { created_at: 1.week.ago.. })
    .group("users.id").having("COUNT(posts.id) > 5")

# Efficient (1.2x faster)
User.joins(:posts)
    .select("users.*, COUNT(posts.id) as posts_count")
    .where(posts: { created_at: 1.week.ago.. })
    .group("users.id")
    .having("COUNT(posts.id) > 5")
```

### 4. Upsert Operations

```ruby
# Inefficient
records.each do |record|
  User.find_or_create_by(email: record[:email])
end

# Efficient (29.5x faster)
User.upsert_all(records, unique_by: :email)
```

### 5. Memory Optimization with OccamsRecord

I still can't get over how much memory this saves:

```ruby
# Standard ActiveRecord (27.30 MB allocated, 68.34 KB retained)
users_data = User.includes(:posts).map do |user|
  {
    name: user.name,
    email: user.email,
    post_count: user.posts.size
  }
end

# OccamsRecord (16.03 MB allocated, 16.30 KB retained)
users_data = OccamsRecord
  .query(User.all)
  .eager_load(:posts)
  .run
  .map { |user| {
    name: user.name,
    email: user.email,
    post_count: user.posts.size
  }}
```

## Join Me for PostgreSQL Performance Optimization at Tropical on Rails 2025!

Want to dive deeper into these concepts and learn how to optimize your Ruby applications with PostgreSQL? Come hang out with me at my upcoming **PostgreSQL Performance for Ruby Developers** workshop at Tropical on Rails 2025!

The workshop is based on our comprehensive PostgreSQL Performance course, which has helped hundreds of developers optimize their database interactions and improve application performance. I've refined it based on feedback from previous sessions.

### Workshop Details:
- **When**: April 2nd, 2025 -  2 PM to 6 PM
- **Language**: English
- **Location**: São Paulo, Brazil

[![Tropical On Rails Banner](/images/banners/tropicalonrails-2025-banner.png)](https://www.tropicalonrails.com/#workshops)
  
[Register for the workshop](https://www.tropicalonrails.com/#workshops)

## My Conclusions

The choice between ActiveRecord and Sequel isn't always straightforward. While I've found Sequel generally offers better raw performance, especially for simple queries, ActiveRecord provides better integration with the Rails ecosystem and a more Ruby-like syntax that I love.

Here's what I consider when choosing an ORM:
1. I use Sequel for performance-critical, data-intensive operations
2. I stick with ActiveRecord for standard CRUD and Rails integration
3. Sometimes I use both in the same application where appropriate (yes, this works!)
4. I always profile my specific use case before committing to an ORM
5. I use bulk operations whenever possible for better performance

Remember that the best ORM for your application depends on your specific requirements and constraints. My benchmarks provide a starting point for your decision-making process, but your mileage may vary!

What's your experience with ORM performance? I'd love to hear your thoughts in the comments. And if you're interested in diving deeper, join me at Tropical on Rails 2025 to continue the conversation!

## More Benchmarking Techniques

During our **PostgreSQL Performance for Ruby Developers** workshop, I'll dive deeper into advanced benchmarking techniques that go beyond simple comparisons. Here's a preview of what you'll learn:

### 1. Profiling Database Queries with TimescaleDB

TimescaleDB extends PostgreSQL with specialized time-series capabilities that can dramatically improve performance for certain workloads. I use this approach all the time:

```ruby
# Standard PostgreSQL time-series query
readings = SensorReading
  .where(created_at: 30.days.ago..Time.current)
  .group_by_day(:created_at)
  .average(:temperature)
  # Can take several seconds with millions of records

# With TimescaleDB optimizations
readings = SensorReading
  .from("sensor_readings_1h_summary") # Pre-aggregated hypertable
  .where(bucket: 30.days.ago..Time.current)
  .select("bucket, avg_temperature")
  # Returns in milliseconds regardless of underlying data volume
```

### 2. Real-world Memory Management Techniques

I'll share practical techniques I've used for managing memory in Ruby applications with large datasets:

```ruby
# Memory-efficient processing of large result sets
CSV.open("large_report.csv", "wb") do |csv|
  csv << ["ID", "Name", "Email", "Post Count"]
  
  # Stream results to avoid loading everything into memory
  User.includes(:posts).find_each(batch_size: 1000) do |user|
    csv << [user.id, user.name, user.email, user.posts.size]
  end
end
```

### 3. Query Building Approaches for Better Performance

Here's how different query building approaches affected performance in my testing:

```ruby
# Benchmark Query Building Approaches
Benchmark.ips do |x|
  x.config(time: 2, warmup: 1)

  conditions = { created_at: 1.day.ago..Time.current }
  pattern = "%test%"

  x.report("ActiveRecord - method chain") do
    User.where(conditions)
        .where("name LIKE ?", pattern)
        .order(created_at: :desc)
        .limit(100)
        .to_a
  end

  x.report("Sequel - method chain") do
    DB[:users]
      .where(conditions)
      .where(Sequel.like(:name, pattern))
      .order(Sequel.desc(:created_at))
      .limit(100)
      .all
  end

  x.compare!
end
```

## Resources

1. [TimescaleDB Ruby Gem](https://github.com/timescale/timescaledb-ruby)
2. [PostgreSQL Performance Workshop for Rubyists](https://github.com/timescale/postgresql-performance-for-rubyists)
3. [Sequel Documentation](https://github.com/jeremyevans/sequel)
4. [ActiveRecord Query Interface](https://guides.rubyonrails.org/active_record_querying.html)
5. [OccamsRecord](https://github.com/jhollinger/occams-record)

### Practical Insights from Community Experience

From discussions I've had and community survey responses, several patterns emerged regarding real-world usage:

1. **Sequel shines for raw data operations**  
   Developers consistently report to me 3-10x performance improvements when using Sequel for data-intensive operations, especially with large datasets.

2. **ActiveRecord remains king for typical web apps**  
   For standard CRUD operations in typical web applications, I've seen that ActiveRecord's integration with Rails often outweighs the raw performance benefits of alternatives.

3. **Memory management is crucial for scaling**  
   Many teams I've worked with discovered that memory usage, not query speed, was their primary bottleneck when scaling applications.

4. **Mixed approaches are increasingly common**  
   More teams I talk to are adopting hybrid approaches, using different ORMs for different parts of their application based on specific performance requirements.

5. **Specialized gems fill performance gaps**  
   Tools like OccamsRecord, BatchLoader, and ar_lazy_preload are frequently mentioned in my conversations as solutions for specific performance challenges while remaining in the ActiveRecord ecosystem.

These real-world experiences highlight the importance of benchmarking your specific use cases rather than relying solely on general recommendations.

## Take Your PostgreSQL Performance to the Next Level!

Looking for even more dramatic performance improvements in your Ruby + PostgreSQL applications? Check out the [timescaledb gem](https://github.com/timescale/timescaledb-ruby) that I maintain! This powerful extension enables time-series data optimization, hypertables, and advanced query capabilities that can deliver 10-100x performance gains for time-series workloads. 

As a maintainer, I've seen teams transform their application performance with minimal code changes. Drop me a message if you have questions or need implementation advice - I love helping people optimize their database performance!

👉 **[Get started with TimescaleDB for Ruby today!](https://github.com/timescale/timescaledb-ruby)**
