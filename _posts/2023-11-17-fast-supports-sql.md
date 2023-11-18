---
layout: post
title: Fast supports SQL from Postgresql!
---

Hey, I'm thrilled to share my recent work on the [Fast gem][fast] - an update that's close to my heart.
I've just merged a pull request that's all about bringing SQL support.
This journey wasn't just about coding; it was about creating something that could
really make a difference in how we handle SQL within our projects.

{% youtube _p651dSIFIQ %}

I always visualize one day I'd translate the pg_query AST to a format closer to
Ruby AST that I can use Fast to search and refactor code.

My journey started with a clear goal: to enable a rewrite interface for SQL in the Fast gem. It was a challenging yet exciting to understand and translate the source buffer, finding the positions from the tokens and allowing to refactor.

As I delved deeper, I realized the potential impact of this feature. The idea was to make SQL handling through Ruby language not just easier, but more intuitive and efficient.

I always work in a prototyping mode which I begin the groundwork by trying short POCs of the building blocks I need to explore.

My first challenge was just get a clear AST similar to Ruby, without blanks and
default nodes. This required deep diving into several SQL statments and analyze the SQL AST to see what was really key representation of the features.

Long story short, this is the type of thing that you can do with the library:

```ruby
Fast
  .parse_sql("select * from my_table")
  .replace("relname", "customers")
# "select * from customers"
```

It's the same as:

```ruby
Fast
  .parse_sql("select * from customerss")
  .replace("relname", &->(e){ replace(e.loc.expression, "customers") })
```

Looks like boring and you could easily do with string replacement right?

Probably, But let's analyze deeper why it matters.

This is the AST representation:

```ruby
Fast.parse_sql("select * from customers")
 => s(:select_stmt,
  s(:target_list,
    s(:res_target,
      s(:val,
        s(:column_ref,
          s(:fields))))),
  s(:from_clause,
    s(:range_var,
      s(:relname, "customers"),
      s(:inh, true),
      s(:relpersistence, "p"))))
```

Note that the `#replace` method is a shortcut to `replace` method from the
TreeRewriter that comes from the parser gem. So the previous code is exactly as
the next. The `relname` is just the "search" for node type "relname". Then, you
can use a block of code to also do your edits or just the previous replace
method that is a shortcut to the lambda function:

```ruby
Fast.parse_sql("select * from customerss")
  .replace("relname", &->(e){replace(e.loc.expression, "customers")})
```

The function runs on `TreeRewriter#instance_exec` allowing you to do several
things at once:

Example:

```ruby
Fast.parse_sql("select * from customerss").replace("_") do |node|
  insert_before(node.loc.expression, "-- some comment in the beginning \n")
  replace(node.first("relname").loc.expression, "customers")
  insert_after(node.loc.expression, "\n-- some comment after")
end
```

The output will be:

```
-- some comment in the beginning
select * from customers
-- some comment after
```

Same replacement of relname. Now, let's compare the AST of both cases:

```sql
Fast.parse_sql("table customers") ==
  Fast.parse_sql("select * from customers") # => true
```

As you can see, different statements have same AST. It can allow you to get
several syntax styles and refactor them at once.

## Key Features of the Update

Here's what the latest update brings to the table:

- **SQL Rewrite Interface**: A new way to handle SQL queries within Ruby projects. This interface is designed to be intuitive and user-friendly, making SQL interactions seamless.
- **Enhanced Documentation**: To ensure everyone can make the most of this new feature, I've put together comprehensive documentation. It's detailed, yet easy to follow – your guide to mastering SQL handling in Fast: https://jonatas.github.io/fast/sql-support/
- **A Fresh Look**: Along with functional upgrades, the Fast gem also got a visual facelift with an updated logo. It's all about keeping things fresh and modern.

## Conclusion

I hope this update to the Fast gem is more than just a new feature; it's a testament to the power of community and open-source collaboration. I'm so happy to be able to just use projects like [pg_query](https://github.com/pganalyze/pg_query) and I can't wait to see what people will do with it!

Your feedback is not just welcome, it's essential for continuous improvement. If you use fast of anything and want to share, feel free to reach out via [linkedin](!https://www.linkedin.com/in/jonatasdp) or open an issue on [fast][fast]

Happy coding!

[fast]: https://github.com/jonatas/fast
