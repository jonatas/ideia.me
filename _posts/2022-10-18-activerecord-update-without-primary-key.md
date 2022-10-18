---
layout: post
categories: ruby postgresql activerecord timescale
title: ActiveRecord update without primary key
---

This weekend I [crossed a Twitter thread][1] that ended up motivating me to write this blog post.

> Thanks, find_by works perfectly, but IIRC, ActiveRecord needs an ID field to save/modify data. I'll try out composite_primary_keys with an ID+Timestamp combo, then. I've got a use case where I want to change a record in a hypertable to add metadata info.

In this scenario, there's an enriching process to add metadata.
Generally, time-series data comes from sensors and other sources representing a state of something or action of someone at a point in time. These states and actions are generally unchangeable, so I never overthought them.

On the core concepts of the TimescaleDB, hypertables use local indices
instead of having a unique index for the entire hypertable. Check what the [official documentation][2] says:

> Rather than building a global index over an entire hypertable, TimescaleDB builds local indexes on each chunk. In other words, each chunk has its own index that only indexes data within that chunk. Even with multiple local indexes, TimescaleDB can still ensure global uniqueness for keys. It enforces an important constraint: any key that requires uniqueness, such as a PRIMARY KEY, must include all columns that are used for data partitioning.

So, if you need to update the data, record by record, here is a small idea that might help you make it using [update_all][3].

I will get a random scenario from the test database I used to build the gem.

I have the following ActiveRecord model as an example:

```ruby
Tick # => Timescaledb::Tick(symbol: text, price: decimal, time: datetime)
tick = Tick.create(symbol: "TEST", price: 123.4, time: Time.now)
# => #<Timescaledb::Tick:0x00007f9fd96f5358 symbol: "TEST", price: 0.1234e3, time: 2022-10-18 12:56:13.409779 UTC>
```

Now, if I try to update an attribute of the record:

```ruby
tick.symbol = "OTHER" # => "OTHER"
```

And then, when I try to save it:

```ruby
tick.save
ActiveRecord::StatementInvalid: PG::SyntaxError: ERROR:  zero-length delimited identifier at or near """"
LINE 1: UPDATE "ticks" SET "symbol" = $1 WHERE "ticks"."" IS NULL
                                                       ^
Caused by PG::SyntaxError: ERROR:  zero-length delimited identifier at or near """"
LINE 1: UPDATE "ticks" SET "symbol" = $1 WHERE "ticks"."" IS NULL
```

Boom! 💥

Here comes the problem. A primary key will be necessary to update it. As the ActiveRecord depends on `id` to update records, now you need to find a new way
to specify it.

For that reason, there's a gem [composite_primary_key][4] that allows you to specify
the attributes that should be used in the primary key.

I initially added it to the timescaledb gem, but as most of the use cases will not depend on updates, I dropped the dependency and covered a possible solution using the [update_all][2] as a solution.


## Understanding the `changes`

Let's continue using the Tick model  as an example:

```ruby
class Tick < ActiveRecord::Base
  self.primary_key = nil

  acts_as_hypertable ...
end
```

The primary key is nil, but we can get a simple record by limiting it. Probably you'll also be managing a few records that are already in the memory, so it will work fine:
```ruby
t = Tick.first # => #<Timescaledb::Tick:0x00007fb0a77a9360 symbol: "TEST", price: 0.1234e3, time: 2022-10-18 12:56:13.409779 UTC>
```

Now, let's change the record attributes:

```ruby
t.symbol = "Other" # => "Other"
```

Now, you can see the [changes][5] are being tracked on memory:

```ruby
t.changes # => {"symbol"=>["TEST", "Other"]}
```

If you make more changes, they'll continue being tracked:

```ruby
t.price = 999 # => 999
t.changes # => {"symbol"=>["TEST", "Other"], "price"=>[0.1234e3, 0.999e3]}
```

Now, let's rebuild hashes to use `before` and `after` the changes:

```ruby
before = t.changes.transform_values(&:first)
# => {"symbol"=>"TEST", "price"=>0.1234e3}
after = t.changes.transform_values(&:last)
# => {"symbol"=>"Other", "price"=>0.999e3}
```
We still need to combine and merge the values with the
`attributes`:

```ruby
t.attributes # => {"symbol"=>"Other", "price"=>0.999e3, "time"=>2022-10-18 12:56:13.409779 UTC}
```

Now, we can build a variable merging the actual attributes which the changes `before`, meaning where they came `from`.

```ruby
from = t.attributes.merge(before)
# => {"symbol"=>"TEST", "price"=>0.1234e3, "time"=>2022-10-18 12:56:13.409779 UTC}
```

And another variable merging attributes with where they're going `to`:

```ruby
to = t.attributes.merge(after)
# => {"symbol"=>"Other", "price"=>0.999e3, "time"=>2022-10-18 12:56:13.409779 UTC}
```

Indeed this is the same as `attributes`, and the `to` variable could be simply `t.attributes`, but for learning purposes, let's use the explicit mode here.


Now, [update_all][3] can use select data-building conditions `from` the original scenario and update all `to` the new state:

```ruby
Tick.where(from).update_all(to) # => 1
```
Note that it can be expensive if you don't build the proper indices
to find the records and you have a huge dataset. Keep in mind this example is for learning purposes, and you'll need to update and adjust it to your needs if you want to use it in production.

Also, creating the indices will depend on how often you make updates and how fast you need to have the results up to date.

## Wrapping `update_all` into a new `save` method

Now, to wrap up here, let's implement the new `save` method that allows you to reuse the scenario in several models.

```ruby
class Tick < ActiveRecord::Base
  self.primary_key = nil

  acts_as_hypertable ...

  def save
    if self.class.primary_key ||
       self.class.respond_to?(:primary_keys) && self.class.primary_keys.any?

      return super
    end

    before = changes.transform_values(&:first)
    from = attributes.merge(before)
    to = changes.transform_values(&:last)

    self.class.where(from).update_all(to)
    clear_changes_information
  end
end
```

Note that in the first lines of the save method, there's a clause to use
the default behavior in case the model is configured with a primary key or has a composite primary key.

The `update_all` doesn't run the model validations, so be careful with this
kind of usage that is highly dependent on your control. We could make the behavior precisely the same by adding an extra guard clause to `return unless valid?` at the top of the methods and ensuring it will update only validated records.

The only point I haven't covered is the `clear_changes_information` that cleans the `changes` attribute to track new changes in case the user
makes several changes in the same record without reloading it.


If you have any concerns or comments, feel free to drop me a comment on [Twitter](https://twitter.com/jonatasdp) or reach out on
[linkedin](https://www.linkedin.com/in/jonatasdp/)!

Thanks for reading.

[1]: https://twitter.com/XasinTheSystem/status/1581424684301979648
[2]: https://docs.timescale.com/timescaledb/latest/overview/core-concepts/hypertables-and-chunks/hypertable-architecture/#chunk-local-indexes
[3]: https://apidock.com/rails/ActiveRecord/Base/update_all/class
[4]: https://github.com/composite-primary-keys/composite_primary_keys
[5]: https://apidock.com/rails/ActiveRecord/Dirty/changes

