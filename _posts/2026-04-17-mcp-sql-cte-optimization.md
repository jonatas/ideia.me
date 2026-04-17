---
title: "MCP and Fast: Grepping SQL Code Like a Boss Part 2"
layout: post
image: /images/banner-mcp-sql-cte-optimization.png
categories: ['programming']
tags: ['sql', 'ruby', 'automation', 'mcp', 'ast', 'optimization']
description: "Discover the newest MCP integration in the Fast gem, expanding our ability to grep and optimize massive SQL structures, including CTE duplication detection."
---

Two years ago, I gave a talk at Lambda Days 2024 titled *"Grepping SQL Code like a boss"*. In that talk, I explored how we could use the [`fast`](https://github.com/jonatas/fast) gem—originally designed for Ruby ASTs—to parse, navigate, and refactor SQL code using PostgreSQL's native parser.

Since then, the AI landscape has shifted massively, and the tools we use to navigate codebases have evolved. Today, I'm thrilled to announce a game-changing update to the `fast` gem: **Model Context Protocol (MCP) Support for SQL**.

## Expanding Fast with MCP

We recently integrated full MCP support directly into the `fast` CLI. This allows modern AI assistants (like Claude, Gemini, or custom agents) to seamlessly interface with your SQL and Ruby codebase through structured, semantic queries rather than fragile regular expressions.

The new MCP server provides three incredibly powerful SQL tools:
1. `search_sql_ast`: Search SQL files using Fast AST patterns.
2. `rewrite_sql`: Preview structural SQL transformations safely.
3. `rewrite_sql_file`: Apply AST pattern replacements to SQL files in-place.

By coupling MCP with `fast`, AI agents can understand the deep semantic structure of your SQL queries, not just the text. They can find specific nodes (like `create_hypertable` in TimescaleDB) or locate poorly optimized queries, and even rewrite them autonomously.

## The Problem: Massive CTE Duplication

Let's look at a concrete optimization problem where AST analysis shines. In massive analytical queries, it's common to use Common Table Expressions (CTEs) to organize logic. However, developers or ORMs often accidentally duplicate the inner logic of a CTE later in the query.

Consider this example:

```sql
WITH sales_2023 AS (
  SELECT region, SUM(amount) as total_sales
  FROM sales
  WHERE extract(year from date) = 2023
  GROUP BY region
),
top_regions AS (
  SELECT region
  FROM (
    -- This inner query is identical to the sales_2023 CTE!
    -- The database might re-compute this unnecessarily.
    SELECT region, SUM(amount) as total_sales
    FROM sales
    WHERE extract(year from date) = 2023
    GROUP BY region
  ) sub
  WHERE total_sales > 100000
)
SELECT s.region, s.total_sales
FROM sales_2023 s
JOIN top_regions t ON s.region = t.region;
```

This query re-compiles the exact same aggregation twice. In a large database, this is an expensive mistake.

## Automating CTE Optimization with Fast

Using `fast`, we can write a script to automatically map all defined CTEs and then scan the rest of the AST to see if any subqueries are structurally identical to the CTEs we just declared.

Here is the `Fastfile` shortcut we built to prove the concept:

```ruby
Fast.shortcut :find_duplicate_ctes do
  require 'fast/sql'
  file = ARGV.last
  ast = Fast.parse_sql_file(file)

  # Map all CTEs
  ctes = {}
  Fast.search('(common_table_expr ...)', ast).each do |node|
    name_node = node.search('(ctename $_)').first
    query_wrapper = node.search('(ctequery $_)').first
    if name_node && query_wrapper
      name = name_node.children.first # extract string name
      ctes[name] = query_wrapper.children.first # the actual select_stmt
    end
  end

  # Helper to recursively walk the AST for all SELECT statements
  def self.walk(node, results = [])
    results << node if node.respond_to?(:type) && node.type == :select_stmt
    if node.respond_to?(:children)
      node.children.each do |child|
        if child.is_a?(Array)
          child.each { |c| walk(c, results) }
        else
          walk(child, results)
        end
      end
    end
    results
  end

  # Compare inner subqueries against defined CTEs
  walk(ast).each do |node|
    ctes.each do |name, query|
      # Deep AST structural comparison ignoring whitespace formatting
      if node.to_s.gsub(/\s+/, ' ') == query.to_s.gsub(/\s+/, ' ') && node.object_id != query.object_id
        puts "Found duplication of CTE '#{name}'!"
        puts "Lines: #{node.loc.expression.first_line}..#{node.loc.expression.last_line}"
      end
    end
  end
end
```

Running this via `fast .find_duplicate_ctes cte_example.sql` instantaneously finds the duplicated logic without getting confused by varying indentation or line breaks.

## The Future with MCP

With the `fast` MCP server, you no longer have to write these Ruby scripts manually every time. An AI assistant can perform the AST structural analysis for you on the fly. 

We can instruct the AI to:
> "Analyze all `.sql` files in the repository. Identify any subqueries that are identical to existing CTEs, and rewrite the file to use the CTE reference instead."

The agent will leverage `search_sql_ast` and `rewrite_sql_file` to perform surgical, AST-aware refactoring that is magnitudes safer than any Regex approach could ever be.

## Conclusion

The integration of MCP into the `fast` gem marks a significant milestone in how we interact with SQL and Ruby codebases. By providing AI agents with the ability to understand and manipulate ASTs directly, we unlock new levels of automation and optimization that were previously too complex or risky. 

Whether you're hunting for duplicate CTEs or refactoring legacy queries, the combination of structured analysis and AI intelligence makes the process faster, safer, and much more intuitive.

Happy hacking!
