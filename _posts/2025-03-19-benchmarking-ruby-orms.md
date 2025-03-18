---
layout: post
title: "Benchmarking Ruby ORMs: ActiveRecord vs Sequel Performance with TimescaleDB"
categories: ruby postgresql performance
image: /images/posts/2025/orm-benchmarks.png
---

![Ruby ORM Performance Comparison](/images/posts/2025/orm-benchmarks.png "Detailed performance comparison between ActiveRecord and Sequel ORMs when used with PostgreSQL and TimescaleDB")

With Ruby 3.3's impressive performance improvements and Rails 8's focus on speed, the landscape of ORM performance is evolving rapidly. Recent benchmarks show up to 70% faster Ruby code execution with YJIT in Ruby 3.3, but how does this translate to real-world database operations? As applications scale and data grows, choosing the right ORM strategy becomes more critical than ever.

This post explores the latest performance differences between ActiveRecord and Sequel when working with TimescaleDB, a specialized PostgreSQL extension for time-series data. Our benchmarks were conducted using Ruby 3.3.6 and the latest versions of both ORMs, revealing surprising insights about when and why certain approaches outperform others.

## The ORM Performance Benchmark Challenge

When building data-intensive applications, developers often face the challenge of choosing between different ORMs. Each ORM offers unique features, syntax, and performance characteristics. Our benchmarks aim to provide insights into these performance differences to help you make informed decisions for your projects.

Let's examine the results from our comprehensive benchmarking tests:

### Query Types Performance (operations per second)

| Operation Type | ActiveRecord | Sequel | Raw SQL | Key Insights |
|---------------|--------------|--------|---------|--------------|
| Simple Select | 82.6 | 10,178.6 | 12,450.2 | Sequel is ~123x faster than ActiveRecord for simple queries |
| Complex Joins | 28.7 | 93.3 | 105.1 | Sequel offers ~3.3x better performance for complex joins |
| Aggregations | 220.2 | 164.0 | 245.3 | ActiveRecord optimizes count operations well |
| Bulk Inserts | 215.7 | 272.6 | 310.4 | Specialized bulk operations are critical for insert performance |
| JSON Operations | 145.3 | 188.9 | 195.7 | Native JSON operators improve performance across all approaches |

### Memory Usage Patterns (MB)

```
| Operation Type | ActiveRecord | Sequel | Raw SQL | Key Insights |
|---------------|--------------|--------|---------|--------------|
| Large Result Set | 125 | 45 | 30 | ActiveRecord objects consume ~2.8x more memory than Sequel |
| Batch Processing | 60 | 35 | 25 | Using `find_each` with ActiveRecord helps control memory usage |
| JSON Processing | 80 | 50 | 45 | JSONB is more memory-efficient than standard JSON |
| Aggregations | 40 | 35 | 30 | Memory patterns are similar for aggregation operations |
```

## Key Findings from Our Benchmarks

### 1. Batch Processing Comparison

```
┌─────────────────────────────────────────┬──────────┬─────────┬────────────┬────────────────┐
│ Operation                               │    Time  │ Queries │      Rate  │ Relative Speed │
├─────────────────────────────────────────┼──────────┼─────────┼────────────┼────────────────┤
│ Processing all records at once          │ 10.342 s │ 90,001  │   2.9k/s  │ baseline       │
│ Using find_each with default batch size │  9.657 s │ 90,031  │   3.1k/s  │ 1.1x faster    │
│ Using find_each with custom batch size  │  9.441 s │ 90,031  │   3.2k/s  │ 1.1x faster    │
│ Using update_all                        │  0.282 s │      1  │ 106.4k/s  │ 36.6x faster   │
└─────────────────────────────────────────┴──────────┴─────────┴────────────┴────────────────┘
```

The results are clear: bulk operations like `update_all` are dramatically faster (36.6x) but bypass ActiveRecord callbacks and validations. This represents a common trade-off between performance and application logic that developers must consider.

### 2. Bulk Insert Performance

```
┌─────────────────────────────┬─────────┬─────────┬────────────┬────────────────┐
│ Operation                   │   Time  │ Queries │      Rate  │ Relative Speed │
├─────────────────────────────┼─────────┼─────────┼────────────┼────────────────┤
│ Individual inserts          │ 0.041 s │    300  │   2.4k/s  │ baseline       │
│ Bulk insert with insert_all │ 0.002 s │      1  │  50.0k/s  │ 22.0x faster   │
└─────────────────────────────┴─────────┴─────────┴────────────┴────────────────┘
```

Bulk inserts are 22x faster than individual inserts, with a 300:1 query reduction. This demonstrates how reducing the number of database roundtrips can dramatically improve performance.

### 3. Upsert Performance

```
┌──────────────────────────────┬─────────┬─────────┬────────────┬────────────────┐
│ Operation                    │   Time  │ Queries │      Rate  │ Relative Speed │
├──────────────────────────────┼─────────┼─────────┼────────────┼────────────────┤
│ Individual find_or_create_by │ 0.049 s │    400  │   2.0k/s  │ baseline       │
│ Bulk upsert with insert_all  │ 0.002 s │      1  │  47.1k/s  │ 29.5x faster   │
│ Sequel upsert                │ 0.002 s │      2  │  46.8k/s  │ 23.2x faster   │
└──────────────────────────────┴─────────┴─────────┴────────────┴────────────────┘
```

Both ActiveRecord's `upsert_all` and Sequel's bulk upsert mechanisms offer similar performance benefits, showing ~25-30x improvement over individual operations.

### 5. Memory Optimization with OccamsRecord

This is insane how much memory can be saved here.

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

## Interactive Benchmarking Examples

You can run the following benchmark examples to see the performance differences yourself. Here's how we set up our benchmarks:

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

For complex joins:

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

And for bulk operations:

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

The infamous N+1 query problem can severely impact application performance. Our benchmarks with 1000 users (each with 10 posts and 5 comments per post) showed:

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

Based on these benchmarks, we've compiled some best practices for optimizing ORM performance:

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

This is insane how much memory can be saved here.

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

## Learn PostgreSQL Performance Optimization at Tropical on Rails 2025

Want to dive deeper into these concepts and learn how to optimize your Ruby applications with PostgreSQL? Join us at the upcoming **PostgreSQL Performance for Ruby Developers** workshop at Tropical on Rails 2025!

The workshop is based on our comprehensive PostgreSQL Performance course, which has helped hundreds of developers optimize their database interactions and improve application performance.

### Workshop Details:
- **Date**: April 2nd, 2025
- **Time**: 2 PM to 6 PM
- **Language**: English
- **Location**: Pullman Vila Olímpia, São Paulo, Brazil
- **Instructor**: Jonatas Davi Paganini
- **Price**: R$450 (Early bird until March 25th: R$350)

This hands-on workshop will cover:
- Advanced PostgreSQL features for Ruby developers
- ORM performance optimization techniques
- TimescaleDB for time-series data
- Practical query optimization strategies
- N+1 query prevention techniques
- Memory optimization approaches

**What to bring**: A laptop with PostgreSQL installed. We'll provide a Docker environment for those who prefer containerized setups.

[Register for the workshop](https://www.tropicalonrails.com/#workshops)

## Conclusion

The choice between ActiveRecord and Sequel isn't always straightforward. While Sequel generally offers better raw performance, especially for simple queries, ActiveRecord provides better integration with the Rails ecosystem and more Ruby-like syntax.

Consider these factors when choosing an ORM:
1. Use Sequel for performance-critical, data-intensive operations
2. Stick with ActiveRecord for standard CRUD and Rails integration
3. Consider using both in the same application where appropriate
4. Profile your specific use case before committing to an ORM
5. Use bulk operations whenever possible for better performance

Remember that the best ORM for your application depends on your specific requirements and constraints. These benchmarks provide a starting point for your decision-making process.

What's your experience with ORM performance? Share your thoughts and join us at Tropical on Rails 2025 to continue the conversation!

## Advanced Benchmarking Techniques You'll Learn at the Workshop

During our **PostgreSQL Performance for Ruby Developers** workshop, we'll dive deeper into advanced benchmarking techniques that go beyond simple comparisons. Here's a preview of what you'll learn:

### 1. Profiling Database Queries with TimescaleDB

TimescaleDB extends PostgreSQL with specialized time-series capabilities that can dramatically improve performance for certain workloads:

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

We'll explore practical techniques for managing memory in Ruby applications with large datasets:

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

Here's how different query building approaches affect performance:

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

### 4. Custom Performance Solutions for Your Specific Needs

During the workshop, you'll have the opportunity to discuss your specific performance challenges and get personalized recommendations. Whether you're dealing with large datasets, complex queries, or high-traffic applications, you'll leave with actionable strategies tailored to your needs.

Register today to secure your spot and take your Ruby database performance skills to the next level!

## Resources

1. [TimescaleDB Ruby Gem](https://github.com/timescale/timescaledb-ruby)
2. [PostgreSQL Performance Workshop](https://github.com/timescale/postgresql-performance-for-rubyists)
3. [Sequel Documentation](https://github.com/jeremyevans/sequel)
4. [ActiveRecord Query Interface](https://guides.rubyonrails.org/active_record_querying.html)
5. [OccamsRecord](https://github.com/jhollinger/occams-record)

### Practical Insights from Community Experience

From community discussions and survey responses, several patterns emerged regarding real-world usage:

1. **Sequel shines for raw data operations**  
   Developers consistently report 3-10x performance improvements when using Sequel for data-intensive operations, especially with large datasets.

2. **ActiveRecord remains king for typical web apps**  
   For standard CRUD operations in typical web applications, ActiveRecord's integration with Rails often outweighs the raw performance benefits of alternatives.

3. **Memory management is crucial for scaling**  
   Many teams discovered that memory usage, not query speed, was their primary bottleneck when scaling applications.

4. **Mixed approaches are increasingly common**  
   More teams are adopting hybrid approaches, using different ORMs for different parts of their application based on specific performance requirements.

5. **Specialized gems fill performance gaps**  
   Tools like OccamsRecord, BatchLoader, and ar_lazy_preload are frequently mentioned as solutions for specific performance challenges while remaining in the ActiveRecord ecosystem.

These real-world experiences highlight the importance of benchmarking your specific use cases rather than relying solely on general recommendations. Join us at the workshop to learn how to effectively benchmark and optimize for your unique requirements!

## Take Your PostgreSQL Performance to the Next Level!

Looking for even more dramatic performance improvements in your Ruby + PostgreSQL applications? Check out the [timescaledb gem](https://github.com/timescale/timescaledb-ruby) that I maintain! This powerful extension enables time-series data optimization, hypertables, and advanced query capabilities that can deliver 10-100x performance gains for time-series workloads. 

As a maintainer, I've seen teams transform their application performance with minimal code changes. Drop me a message if you have questions or need implementation advice!

👉 **[Get started with TimescaleDB for Ruby today!](https://github.com/timescale/timescaledb-ruby)**
