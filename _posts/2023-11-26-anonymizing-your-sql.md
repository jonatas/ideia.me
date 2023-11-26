---
layout: post
title: Anonymize your SQL statements
---

As a community manager at Timescale, I frequently engage with our vibrant community, helping members tackle a variety of SQL-related challenges. One common concern that arises is the need to share SQL queries for collaboration or troubleshooting, without exposing sensitive data. Recognizing this need, I've embarked on developing a tool to anonymize SQL data effectively.

Following my previous work on a SQL formatter, this new venture focuses on SQL anonymization - transforming sensitive database identifiers into non-sensitive equivalents while retaining the query's structure and logic.

In the realm of data management and privacy, anonymizing SQL data is an essential practice. Building on the capabilities of [Fast, which now supports SQL](/fast-supports-sql), I'm excited to share my explorations in this field. 

Let's take a basic SQL query as an example:

```sql
SELECT name FROM weather_data ORDER BY 1 ASC
```

Our goal is to transform it into:

```sql
SELECT something FROM somewhere ORDER BY 1 ASC
```

The anonymize here is very basic, but it can go further, replacing not just table names, but column names and all identifiers.

## Understanding AST Tokens

The best way to start is with a hands-on example. Here's a SQL script that showcases a range of interconnected database objects, such as tables and views:

```sql
CREATE TABLE "ticks" ("time" timestamp with time zone not null, "symbol" text, "price" decimal, "volume" float);

SELECT create_hypertable('ticks', 'time', chunk_time_interval => INTERVAL '1 day');

CREATE MATERIALIZED VIEW candlestick_1m
WITH (timescaledb.continuous) AS
SELECT time_bucket('1m', time),
       "ticks"."symbol",
       candlestick_agg(time, price, volume) as candlestick
FROM "ticks"
GROUP BY 1, 2
ORDER BY 1
WITH DATA;

CREATE MATERIALIZED VIEW candlestick_1h
WITH (timescaledb.continuous ) AS
SELECT time_bucket('1 hour', "time_bucket"),
       symbol,
       rollup(candlestick) as candlestick 
FROM "candlestick_1m"
GROUP BY 1, 2
ORDER BY 1
WITH NO DATA;
```

Which should be represented with anonymized references but keep all the example
with consistent references. 

```sql
CREATE TABLE x1 ("time" timestamp with time zone not null, "symbol" text, "price" decimal, "volume" float);

SELECT create_hypertable('x1', 'time', chunk_time_interval => INTERVAL '1 day');

CREATE MATERIALIZED VIEW x3
WITH (timescaledb.continuous) AS
SELECT time_bucket('1m', time),
       x1."symbol",
       candlestick_agg(time, price, volume) as candlestick
FROM x1
GROUP BY 1, 2
ORDER BY 1
WITH DATA;

CREATE MATERIALIZED VIEW x5
WITH (timescaledb.continuous ) AS
SELECT time_bucket('1 hour', "time_bucket"),
       symbol,
       rollup(candlestick) as candlestick
FROM x4
GROUP BY 1, 2
ORDER BY 1
WITH NO DATA;
```

The output example is just anonymizing table names. Column names, aliases,
view names and other scenarios could also reveal business information.

This script presents a complex scenario with hierarchical views referencing in
cascade.

If you want to go deep, watch my live coding session exploring this topic.

<div style="position: relative; padding-bottom: 56.25%; height: 0;"><iframe src="https://www.loom.com/embed/dd9e9e18be564907afe518024110502e?sid=dabb247f-a567-4128-b74e-a83783722322" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>

The short steps to cover this small scenario anonymizing table and view names are:

1. **Parsing SQL with AST**: Using Fast, we begin by parsing the SQL file into an AST,
providing us with a structured format for manipulation.

In this example, we use "gemfile inline" to fetch the library dynamicaly.

```ruby
require 'bundler/inline'

gemfile(true) do
  gem 'ffast' # , path: "../fast"
  gem 'pry'
end

require 'fast'
require 'fast/sql'

ast = Fast.parse_sql_file('file.sql')

binding.pry
```

Observing the entire ast structure:

```ruby
ast
=> [s(:create_stmt,
  s(:relation,
    s(:relname, "ticks"),
    s(:inh, true),
    s(:relpersistence, "p")),
  s(:table_elts,
    s(:column_def,
      s(:colname, "time"),
      s(:type_name,
        s(:names,
          s(:string,
            s(:sval, "pg_catalog")),
          s(:string,
            s(:sval, "timestamptz"))),
        s(:type_oid, 0),
        s(:typemod, -1)),
      s(:inhcount, 0),
      s(:is_local, true),
      s(:coll_oid, 0),
      s(:constraints,
        s(:constraint,
          s(:contype, :CONSTR_NOTNULL),
          s(:old_pktable_oid, 0)))),
    s(:column_def,
      s(:colname, "symbol"),
      s(:type_name,
        s(:names,
          s(:string,
            s(:sval, "text"))),
        s(:type_oid, 0),
        s(:typemod, -1)),
      s(:inhcount, 0),
      s(:is_local, true),
      s(:coll_oid, 0)),
    s(:column_def,
      s(:colname, "price"),
      s(:type_name,
        s(:names,
          s(:string,
            s(:sval, "pg_catalog")),
          s(:string,
            s(:sval, "numeric"))),
        s(:type_oid, 0),
        s(:typemod, -1)),
      s(:inhcount, 0),
      s(:is_local, true),
      s(:coll_oid, 0)),
    s(:column_def,
      s(:colname, "volume"),
      s(:type_name,
        s(:names,
          s(:string,
            s(:sval, "pg_catalog")),
          s(:string,
            s(:sval, "float8"))),
        s(:type_oid, 0),
        s(:typemod, -1)),
      s(:inhcount, 0),
      s(:is_local, true),
      s(:coll_oid, 0))),
  s(:oncommit, :ONCOMMIT_NOOP)),
 s(:select_stmt,
  s(:target_list,
    s(:res_target,
      s(:val,
        s(:func_call,
          s(:funcname,
            s(:string,
              s(:sval, "create_hypertable"))),
          s(:args,
            s(:a_const,
              s(:sval,
                s(:sval, "ticks"))),
            s(:a_const,
              s(:sval,
                s(:sval, "time"))),
            s(:named_arg_expr,
              s(:arg,
                s(:type_cast,
                  s(:arg,
                    s(:a_const,
                      s(:sval,
                        s(:sval, "1 day")))),
                  s(:type_name,
                    s(:names,
                      s(:string,
                        s(:sval, "pg_catalog")),
                      s(:string,
                        s(:sval, "interval"))),
                    s(:type_oid, 0),
                    s(:typemod, -1)))),
              s(:name, "chunk_time_interval"),
              s(:argnumber, -1))),
          s(:funcformat, :COERCE_EXPLICIT_CALL)))))),
 s(:create_table_as_stmt,
  s(:query,
    s(:select_stmt,
      s(:target_list,
        s(:res_target,
          s(:val,
            s(:func_call,
              s(:funcname,
                s(:string,
                  s(:sval, "time_bucket"))),
              s(:args,
                s(:a_const,
                  s(:sval,
                    s(:sval, "1m"))),
                s(:column_ref,
                  s(:fields,
                    s(:string,
                      s(:sval, "time"))))),
              s(:funcformat, :COERCE_EXPLICIT_CALL)))),
        s(:res_target,
          s(:val,
            s(:column_ref,
              s(:fields,
                s(:string,
                  s(:sval, "ticks")),
                s(:string,
                  s(:sval, "symbol")))))),
        s(:res_target,
          s(:name, "candlestick"),
          s(:val,
            s(:func_call,
              s(:funcname,
                s(:string,
                  s(:sval, "candlestick_agg"))),
              s(:args,
                s(:column_ref,
                  s(:fields,
                    s(:string,
                      s(:sval, "time")))),
                s(:column_ref,
                  s(:fields,
                    s(:string,
                      s(:sval, "price")))),
                s(:column_ref,
                  s(:fields,
                    s(:string,
                      s(:sval, "volume"))))),
              s(:funcformat, :COERCE_EXPLICIT_CALL))))),
      s(:from_clause,
        s(:range_var,
          s(:relname, "ticks"),
          s(:inh, true),
          s(:relpersistence, "p"))),
      s(:group_clause,
        s(:a_const,
          s(:ival,
            s(:ival, 1))),
        s(:a_const,
          s(:ival,
            s(:ival, 2)))),
      s(:sort_clause,
        s(:sort_by,
          s(:node,
            s(:a_const,
              s(:ival,
                s(:ival, 1)))),
          s(:sortby_dir, :SORTBY_DEFAULT),
          s(:sortby_nulls, :SORTBY_NULLS_DEFAULT))))),
  s(:into,
    s(:rel,
      s(:relname, "candlestick_1m"),
      s(:inh, true),
      s(:relpersistence, "p")),
    s(:options,
      s(:def_elem,
        s(:defnamespace, "timescaledb"),
        s(:defname, "continuous"),
        s(:defaction, :DEFELEM_UNSPEC))),
    s(:on_commit, :ONCOMMIT_NOOP)),
  s(:objtype, :OBJECT_MATVIEW)),
 s(:create_table_as_stmt,
  s(:query,
    s(:select_stmt,
      s(:target_list,
        s(:res_target,
          s(:val,
            s(:func_call,
              s(:funcname,
                s(:string,
                  s(:sval, "time_bucket"))),
              s(:args,
                s(:a_const,
                  s(:sval,
                    s(:sval, "1 hour"))),
                s(:column_ref,
                  s(:fields,
                    s(:string,
                      s(:sval, "time_bucket"))))),
              s(:funcformat, :COERCE_EXPLICIT_CALL)))),
        s(:res_target,
          s(:val,
            s(:column_ref,
              s(:fields,
                s(:string,
                  s(:sval, "symbol")))))),
        s(:res_target,
          s(:name, "candlestick"),
          s(:val,
            s(:func_call,
              s(:funcname,
                s(:string,
                  s(:sval, "rollup"))),
              s(:args,
                s(:column_ref,
                  s(:fields,
                    s(:string,
                      s(:sval, "candlestick"))))),
              s(:funcformat, :COERCE_EXPLICIT_CALL))))),
      s(:from_clause,
        s(:range_var,
          s(:relname, "candlestick_1m"),
          s(:inh, true),
          s(:relpersistence, "p"))),
      s(:group_clause,
        s(:a_const,
          s(:ival,
            s(:ival, 1))),
        s(:a_const,
          s(:ival,
            s(:ival, 2)))),
      s(:sort_clause,
        s(:sort_by,
          s(:node,
            s(:a_const,
              s(:ival,
                s(:ival, 1)))),
          s(:sortby_dir, :SORTBY_DEFAULT),
          s(:sortby_nulls, :SORTBY_NULLS_DEFAULT))))),
  s(:into,
    s(:rel,
      s(:relname, "candlestick_1h"),
      s(:inh, true),
      s(:relpersistence, "p")),
    s(:options,
      s(:def_elem,
        s(:defnamespace, "timescaledb"),
        s(:defname, "continuous"),
        s(:defaction, :DEFELEM_UNSPEC))),
    s(:on_commit, :ONCOMMIT_NOOP),
    s(:skip_data, true)),
  s(:objtype, :OBJECT_MATVIEW))]
```

2. **Identifying sensitive data**: Use Fast to identify sensitive elements such as table names within the AST.

```ruby
relnames = Fast.search("(relname $_)", ast).grep(String).uniq
# => ["ticks", "candlestick_1m", "candlestick_1h"]
```

3. **Anonymizing Data**: We then replace these elements with generic placeholders. The anonymization process involves
replacing identified elements in the AST with 'x' followed by a unique number.

```ruby
pattern = "{relname (sval {#{relnames.map(&:inspect).join(' ')}})}"
puts "searching with #{pattern}"

content = Fast::SQL.replace(pattern, ast) do |node|
  new_name = memo[node.source.tr(%|"'|, '')] ||= "x#{memo.size}"
  new_name = "'#{new_name}'" if node.type == :sval
  replace(node.loc.expression, new_name)
end
```

4. **Visualizing Changes**: `Fast.highlight` is employed to color-code and display the changes for better understanding.

```ruby
puts Fast.highlight(content, sql: true)
```

Transform sensitive SQL data into anonymized & shareable code allow community to
bring more complex scenarios closer to production using such idea.

It can also serve as a third eye to see the data structures from a blind spot.
Allowing you to understand standards that repeats over different business
models.

Small shortcuts can also be introduced into your security culture and enables safe sharing of SQL queries within the community.

The power and flexibility of using AST and Fast for anonymizing SQL data open up new horizons in data privacy and security 🫶

I encourage you to experiment with the code and adapt it to your specific needs. If you have questions or insights, feel free to reach out. For more insights into manipulating SQL with Fast, revisit my [previous post on building a SQL formatter](https://ideia.me/building-a-sql-formatter-with-fast).


