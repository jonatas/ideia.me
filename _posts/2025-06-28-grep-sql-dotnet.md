---
title: "GrepSQL: Bringing SQL AST Pattern Matching to .NET"
layout: post
categories: ['programming', 'technology']
tags: ['sql', 'dotnet', 'automation', 'postgresql', 'best-practices']
description: "I'm becoming a .NET developer! Here's how I ported my SQL AST pattern matching from Ruby to C# with the help of AI, creating a powerful tool for searching and analyzing SQL code."
---

I'm becoming a .NET developer. Yes, I can't believe it either, but it's happening! 🚀

Here we go: [github.com/jonatas/grepsql](https://github.com/jonatas/grepsql)

Since I joined [Bax Energy](/joining-bax-energy-as-staff-engineer), I've been diving deep into the .NET ecosystem. To leverage my learning process, I decided to port one of my favorite Ruby projects - the SQL AST matcher from [Fast](https://github.com/jonatas/fast) - to C#.

This journey has been incredible. I've been "vibe coding" with an insane amount of help from AI, both for development and learning .NET fundamentals. What's mind-blowing is how AI has accelerated the learning curve. I probably spent at least 200 hours building and debugging AST patterns for the Ruby version, but now I'm making rapid progress with intelligent assistance.

As someone who spent the last few years at Timescale in a role where programming wasn't the main activity, I'm incredibly excited about how much progress I've made building this .NET tool from scratch.

## What is GrepSQL?

GrepSQL is a .NET wrapper for libpg_query that provides PostgreSQL query parsing and advanced SQL pattern matching capabilities. Think of it as "grep for SQL" but with the power of Abstract Syntax Tree (AST) navigation.

Instead of simple string matching, GrepSQL understands the structure of your SQL queries and lets you search for patterns at the semantic level. Want to find all SELECT statements that query a specific table? Or locate hardcoded passwords in your SQL files? GrepSQL makes these tasks trivial.

## Quick Start: Installation

### Pre-built Binaries (Recommended)

The easiest way to get started is downloading the ready-to-use binaries from [GitHub Releases](https://github.com/jonatas/grepsql/releases):

```bash
# Download and extract (Linux example)
wget https://github.com/jonatas/grepsql/releases/latest/download/grepsql-linux-x64.tar.gz
tar -xzf grepsql-linux-x64.tar.gz
chmod +x GrepSQL

# Use immediately
./GrepSQL "SelectStmt" *.sql --highlight
```

Available for Linux x64, macOS (Intel & Apple Silicon), and Windows x64. The binaries are automatically built and released via GitHub Actions.

### NuGet Package (.NET Library)

For integration into your .NET projects:

```bash
dotnet add package GrepSQL
```

## Core Features

### 1. Command Line Power Tool

The command-line interface makes SQL analysis accessible to everyone:

```bash
# Find all SELECT statements
./grepsql.sh "SelectStmt" --from-sql "SELECT id FROM users"

# Find table references with highlighting
./grepsql.sh "(relname \"users\")" --from-sql "SELECT * FROM users JOIN products ON users.id = products.user_id" --highlight

# Show AST structure for debugging
./grepsql.sh "SelectStmt" --from-sql "SELECT id FROM users" --tree
```

### 2. S-Expression Pattern Language

GrepSQL uses a LISP-inspired s-expression syntax for pattern matching. This might look unfamiliar at first, but it's incredibly powerful:

```bash
# Basic node type matching
SelectStmt                           # Any SELECT statement
InsertStmt                          # Any INSERT statement

# Field-specific matching
(relname "users")                   # Table named "users"
(relname _)                         # Any table name
(sval "admin")                      # String constant "admin"
(ival 42)                          # Integer constant 42

# Set matching (OR logic)
(relname {users orders products})   # Any of these tables
(sval {admin user guest})          # Any of these strings

# Nested patterns
(RangeVar (relname "users"))       # Table reference to "users"
```

### 3. Advanced Pattern Matching

Here's where GrepSQL shines. Let's look at practical examples:

#### Finding Security Issues

```bash
# Find hardcoded credentials
./grepsql.sh "(sval \"password\")" *.sql
./grepsql.sh "(sval \"admin\")" *.sql --highlight

# Find sensitive data patterns
./grepsql.sh "(sval {password secret key token})" *.sql
```

#### Code Quality Analysis

```bash
# Find magic numbers
./grepsql.sh "(ival _)" *.sql

# Find SELECT * patterns (potential performance issues)
./grepsql.sh "A_Star" *.sql --highlight

# Find all table references for migration planning
./grepsql.sh "(relname _)" migration.sql
```

#### Complex Structural Patterns

```bash
# Find SELECTs with WHERE clauses containing comparisons
./grepsql.sh "(SelectStmt ... (whereClause (A_Expr ...)))" *.sql

# Find any query containing a specific table, regardless of context
./grepsql.sh "(... (relname \"users\"))" *.sql

# Find JOIN operations
./grepsql.sh "JoinExpr" *.sql --tree
```

### 4. .NET API Integration

For developers who want to integrate GrepSQL into their applications:

```csharp
using GrepSQL.SQL;

// Basic pattern matching
var sql = "SELECT name FROM users WHERE age > 18";
var matches = PatternMatcher.Search("(relname _)", sql);
Console.WriteLine($"Found {matches.Count} table references");

// Parse SQL into AST
var result = Postgres.ParseSql(sql);
Console.WriteLine(TreePrinter.Print(result.ParseTree));

// Check if pattern matches
bool hasUserTable = PatternMatcher.Match("(relname \"users\")", sql);

// Advanced analysis
PatternMatcher.SetDebug(true);
var analysis = PatternMatcher.Analyze("(relname _)", sql);
```

## Understanding the S-Expression Syntax

The pattern language is inspired by LISP's s-expressions. Here's a quick reference:

### Basic Structure: `(head children...)`

```bash
(SelectStmt ...)              # Any SELECT statement
(SelectStmt (targetList ...)) # SELECT with specific target list
(A_Const (ival _))           # Any integer constant
```

### Wildcards and Logic

```bash
# Wildcards
_                             # Match any single node
nil                          # Match exactly null/empty
...                          # Match any node with children

# Logical operators
{a b c}                      # OR: match any of a, b, or c
[a b c]                      # AND: all conditions must be true
!pattern                     # NOT: pattern must not match
?pattern                     # MAYBE: optional pattern
```

### Ellipsis Navigation

The ellipsis (`...`) provides structured traversal:

```bash
# Find pattern anywhere in subtree
(SelectStmt ... (relname "users"))           # SELECT containing table "users"
(... (whereClause (A_Expr ...)))             # Any query with WHERE expression
(SelectStmt ... (A_Const (ival 42)))         # SELECT containing integer 42
```

## Real-World Examples

Let me share some practical scenarios where GrepSQL shines:

### Database Migration Analysis

When planning database migrations, you need to understand how tables are used:

```bash
# Find all references to a table you're planning to rename
./grepsql.sh "(relname \"old_table_name\")" *.sql

# Find all schema references
./grepsql.sh "(schemaname _)" *.sql

# Find all foreign key references
./grepsql.sh "FkConstraint" *.sql --tree
```

### Security Auditing

```bash
# Find potential SQL injection risks (string concatenation patterns)
./grepsql.sh "(sval _)" *.sql | grep -E "(SELECT|INSERT|UPDATE|DELETE)"

# Find administrative access patterns
./grepsql.sh "(sval {admin root superuser})" *.sql --highlight

# Identify hardcoded connection strings
./grepsql.sh "(sval {localhost 127.0.0.1 password})" *.sql
```

### Performance Optimization

```bash
# Find queries that might benefit from indexing
./grepsql.sh "(... (whereClause ...))" *.sql

# Find potentially slow SELECT * queries
./grepsql.sh "(SelectStmt (targetList (ResTarget (val (ColumnRef (fields))))))" *.sql

# Find subqueries that could be optimized
./grepsql.sh "SubLink" *.sql --tree
```

## The Development Journey

Building GrepSQL has been an intro to the .NET ecosystem. Coming from a Ruby background, I was amazed by:

1. **The Tooling**: Visual Studio Code with C# extensions provides incredible IntelliSense and debugging capabilities
2. **Performance**: The compiled nature of C# delivers impressive performance compared to interpreted Ruby
3. **Ecosystem**: NuGet package management and the rich .NET ecosystem made integrating libpg_query straightforward
4. **Cross-Platform**: Building for Linux, macOS, and Windows from a single codebase is seamless

The most challenging part was understanding the libpg_query C bindings and how to properly wrap them in C#. The Google Protocol Buffers integration required careful marshaling of data between C and managed code.

## Error Handling and Debugging

GrepSQL provides robust error handling with detailed information:

```csharp
try
{
    var result = Postgres.ParseSql("SELECT * FROM");
}
catch (PgQueryException ex)
{
    Console.WriteLine($"Error: {ex.Message}");
    Console.WriteLine($"Position: {ex.CursorPosition}");
}
```

For debugging patterns, use:

```bash
# Show expression tree for pattern debugging
./grepsql.sh "SelectStmt" --only-exp

# Enable verbose debug output
./grepsql.sh "pattern" *.sql --debug --verbose
```

## Contributing and Future Plans

GrepSQL follows modern .NET development practices and welcomes contributions! The codebase is organized with:

- Clean separation between SQL parsing and pattern matching
- Automated CI/CD pipeline
- Cross-platform compatibility

My next goals include:

1. **Enhanced Pattern Syntax**: More logical operators and syntactic sugar
2. **IDE Integration**: Visual Studio Code extension for real-time SQL analysis
3. **Additional Output Formats**: JSON, XML, and structured data formats
4. **Performance Optimizations**: Caching and parallel processing for large codebases

## Acknowledgments

This project wouldn't exist without the incredible work of:

- [libpg_query](https://github.com/pganalyze/libpg_query) - The PostgreSQL query parsing foundation 🫶🏼
- [Fast](https://github.com/jonatas/fast) - My Ruby AST pattern matching inspiration
- The .NET and C# communities for their excellent documentation and tooling

## Try It Yourself!

I encourage you to download GrepSQL and experiment with your own SQL files. Whether you're doing security audits, planning migrations, or just exploring your SQL codebase, GrepSQL can provide insights that traditional grep simply can't match.

The intersection of AST parsing, pattern matching, and modern tooling creates powerful possibilities for code analysis. As AI continues to accelerate development workflows, tools like GrepSQL become even more valuable for understanding and maintaining large codebases.

Ready to grep your SQL like a boss? Check out the [releases page](https://github.com/jonatas/grepsql/releases) and give it a try!

Happy coding! 🚀

[Follow me on LinkedIn](https://www.linkedin.com/in/jonatasdp) or [open an issue on GitHub](https://github.com/jonatas/grepsql) if you have questions or ideas to share!

