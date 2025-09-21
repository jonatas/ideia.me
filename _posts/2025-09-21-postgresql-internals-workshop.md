---
layout: post
title: "PostgreSQL Internals Workshop: Learn how Postgresql works and make it performant for you!"
categories: postgresql database performance storage
image: /images/postgresql-performance-workshop.webp
---

![PostgreSQL Storage Deep Dive](/images/postgresql-performance-workshop.webp)

Hello dear reader, I'm a PostgreSQL fan and I have been using it since the beginning of my career in 2004. Indeed, one of my first tasks was migrating DBF files to a PostgreSQL database. I was honored to have had the opportunity to work with DBF files and understand how the simple world of DBFs worked. I remember it was only DBFs and DBIs for the indices. You would open the index and use the `Seek` method to find the row and then you would open the DBF and go to the row.

PostgreSQL has many components working together, even its own language. Each part helps with data storage, consistency, and performance. During my last 4 years at Timescale, now TigerData, I got a lot of learnings through community users sharing their scenarios.

The recurrent issues all users have are related to scalability and performance, and that's why they choose TimescaleDB. 

This content is the material of a 4-hour workshop. It gets into PostgreSQL's internal architecture using simple analogies. Covering indexes, TOAST storage, and buffer management. More importantly, we'll solve common problems: why storage grows unexpectedly, why queries slow down, and how to fix performance issues.

I presented this workshop 3 times this year. I'm so glad I made it. I started with a version in Ruby, which I entitled "PostgreSQL Performance Workshop for Rubyists" at the Ruby Community Conference in Poland, and also at Tropical on Rails, in São Paulo, Brazil. Later, in the last few weeks, I presented it at [PGConf Brazil 2025](/pgconfbr-2025).

Now, I want to leave a memory of this in my blog, as this is all content that is very useful for any developer who needs to master PostgreSQL and build performant systems.

![Workshop presenting in Krakow](/images/krakow-ruby-community-conference-performance-workshop-full-room.jpg)

> Picture of the PostgreSQL Performance Workshop for Rubyists in Krakow

Let's review what will be covered on each chapter.

## **Chapter 1: Understanding 8KB Pages**

![PostgreSQL Ocean Pages](/images/postgresql-ocean-pages.png)

PostgreSQL stores all data in 8KB pages. Every table, index, and data structure uses this same 8KB size. This design helps with memory and disk operations.

**The Problem**: Your 2-row table uses 64KB of space. Sometimes indexes use more space than the actual data.

**What You'll Learn**: How pages work, why storage overhead exists, and how page size affects performance. We'll see the math behind storage calculations.

> **[Start with Docker Setup →](#quick-start-with-docker)** 
> *Let's set up PostgreSQL and see how 8KB pages actually work.*

## **Chapter 2: TOAST Storage**
*How PostgreSQL handles large data*

![PostgreSQL TOAST Root System](/images/postgresql-toast-roots.png)

When data gets too large, PostgreSQL moves it to a separate TOAST table. TOAST means "The Oversized-Attribute Storage Technique." Large values are stored separately and accessed through pointers.

**The Problem**: Your table looks small, but disk usage is huge. Large JSON documents disappear from queries, but storage keeps growing.

**What You'll Learn**: When TOAST activates, how compression works, and how to monitor TOAST storage. We'll calculate compression ratios and storage efficiency.

> **[Learn about TOAST →](#understanding-toast-the-oversized-attribute-storage-technique)** 
> *Let's see how PostgreSQL handles large data automatically.*

## **Chapter 3: Index Efficiency and Scale**
*How index overhead changes with data size*

![PostgreSQL Index Lightning](/images/postgresql-index-lightning.png)

Small tables make indexes look expensive. But as data grows, index overhead decreases. We'll see index overhead drop from 25% to 5% as data grows from 2 rows to 3,000 rows.

**The Problem**: When do indexes help vs hurt performance? Why do some indexes never get used? Why does performance change over time?

**What You'll Learn**: The math behind index efficiency, B-tree vs BRIN trade-offs, and how to calculate when an index becomes useful.

> **[See the Index Math →](#index-overhead-at-scale-a-dramatic-demonstration)** 
> *Let's measure how index efficiency improves with scale.*


## **Chapter 4: Buffer Management**
*PostgreSQL's memory caching system*

![PostgreSQL Buffer Whirlpool](/images/postgresql-buffer-whirlpool.png)

PostgreSQL keeps frequently used data in memory. Often-accessed data stays in the buffer cache, while less-used data gets moved to disk. A 95% buffer hit ratio means good performance.

**The Problem**: Adding more RAM doesn't always help performance. Some queries clear the buffer cache while others don't affect it.

**What You'll Learn**: How buffer algorithms work, why large scans can hurt caching, and how to calculate memory efficiency.

> **[Learn Buffer Math →](#buffer-management-and-performance)** 
> *Let's measure buffer hit ratios and see how caching works.*


## **Chapter 5: WAL and Checkpoints**
*PostgreSQL's transaction logging system*

![PostgreSQL WAL Seasonal Cycle](/images/postgresql-wal-seasonal-cycle.png)

PostgreSQL writes all changes to a log (WAL - Write-Ahead Log) before changing data files. Checkpoints save changes from WAL to data files at regular intervals. This ensures no data is lost during crashes.

**The Problem**: WAL files use unexpected disk space. Checkpoints sometimes slow the system. How do you balance data safety with performance?

**What You'll Learn**: WAL patterns, checkpoint timing, and how to monitor transaction logs. We'll calculate WAL growth rates and checkpoint intervals.

> **[Learn WAL Math →](#write-ahead-log-wal-and-durability)** 
> *Let's see how PostgreSQL ensures data safety.*

### 🌸 Spring: Checkpoint Blooming
> **[See Spring Checkpoint Analysis →](#-spring-checkpoint-blooming---the-fresh-start)** 
> *Real PostgreSQL checkpoint timing and behavior with 31.17ms performance data.*

In Spring, the fresh "checkpoint flowers" blooming represent a CHECKPOINT command. At regular intervals, PostgreSQL takes all the changes from the WAL and applies them to the main data files. This "blooming" of new, consistent data allows the system to clean up old WAL files.

### ☀️ Summer: Data Growth
![PostgreSQL WAL Summer Growth](/images/postgresql-wal-summer-growth.png)

> **[Explore Summer Hot Data →](#️-summer-hot-data-growth---active-operations)** 
> *500 active records, 99.82% buffer hit ratio, and hot data performance analysis.*

Summer is the time of "warm data growth." Your database is busy, and new data is being added and modified constantly. The lush, thriving foliage represents the live, active data pages in memory, which the system can access quickly. The warm colors reflect the "hot" data that is frequently accessed.

### 🍂 Autumn: Archiving Old Logs  
![PostgreSQL WAL Autumn Archiving](/images/postgresql-wal-autumn-archiving.png)

> **[Learn Autumn Archiving →](#-autumn-archiving-old-logs---compression-and-storage)** 
> *100 archived logs, WAL compression insights, and long-term storage strategies.*

In Autumn, the leaves fall like "old log files." The WAL is a continuous stream, and once a checkpoint is completed, the older log files are no longer needed for crash recovery. The falling leaves represent these old WAL segments being safely archived to long-term storage.

### ❄️ Winter: Peaceful Archive Storage
> **[Understand Winter Storage →](#️-winter-peaceful-archive-storage---minimal-activity)** 
> *Dormant data patterns, minimal maintenance, and efficient long-term preservation.*

Winter represents the final state of your data in "peaceful archive storage." Just as nature rests under a blanket of snow, your old data and log files are safely stored away, dormant but not forgotten. The sleeping data mounds under their "snow blankets" symbolize archived data.

> **Want to Practice More?** The complete WAL exercises are available in both [SQL](https://github.com/jonatas/postgresql-performance-workshops/tree/main/sql/01_storage) and [Ruby](https://github.com/jonatas/postgresql-performance-workshops/tree/main/ruby/01_storage) versions of the PostgreSQL Performance Workshop.


## **Chapter 6: Performance Monitoring**
*Tracking PostgreSQL performance*

<!-- ![PostgreSQL Ecosystem Monitoring](/images/postgresql-ecosystem-monitoring.png) -->

A healthy database has all parts working together. Monitoring PostgreSQL means understanding relationships between storage, memory, CPU, and disk I/O.

**The Problem**: Which metrics are important vs which are just noise? How do you find problems before they cause outages? What's normal vs what's a real issue?

**What You'll Learn**: Important monitoring queries, how to build useful dashboards, and warning signs of performance problems. We'll calculate key performance ratios.

> **[Learn Monitoring Math →](#performance-monitoring-dashboard)** 
> *Let's track the important numbers that show database health.*


### **What We'll Cover**

This guide explains PostgreSQL internals using practical examples. All code runs in Docker. Every query shows real output. Each concept connects to problems you'll see in production.

You'll learn what PostgreSQL does and why it makes certain choices. This helps you work with PostgreSQL effectively instead of fighting against it.

Let's get started.


## Quick Start with Docker

Let's begin by setting up a PostgreSQL environment using Docker. This approach ensures we have a clean, reproducible environment for our experiments.

```bash
# Pull the TimescaleDB image (includes PostgreSQL 17)
docker pull timescale/timescaledb:latest-pg17

# Run PostgreSQL container
docker run -d --rm -it \
  --name postgres-internals \
  -e POSTGRES_HOST_AUTH_METHOD=trust \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=internals_lab \
  -p 5434:5432 \
  timescale/timescaledb:latest-pg17

# Connect to the database
psql postgres://postgres:password@localhost:5434/internals_lab
```

Once connected, let's verify our setup:

```sql
-- Check PostgreSQL version
SELECT version();

-- Verify we're in the right database
SELECT current_database();
```

## Understanding PostgreSQL Storage Architecture

PostgreSQL stores data in **pages** (also called blocks) of exactly 8KB each. These pages are the fundamental unit of storage and I/O operations. Understanding this architecture is key to optimizing performance.

### The Anatomy of an 8KB Page

```ascii
+--------------------------------+ 0
|           Page Header          |
|             (24B)              |
+--------------------------------+ 24
|         Item Pointers          |
| (4B each, points to row data)  |
+--------------------------------+ varies
|                                |
|          Free Space            |
|     (available for growth)     |
|                                |
+--------------------------------+ varies
|    Row 1 Data                  |
|    - Header (23B)              |
|    - Null bitmap               |
|    - User data                 |
|    - Alignment padding         |
+--------------------------------+
|    Row 2 Data                  |
|    - Header (23B)              |
+--------------------------------+ 8192
```

## Hands-On Storage Exploration

Let's create a practical example to explore PostgreSQL's storage behavior. We'll build a documents table that demonstrates various storage concepts.

```sql
-- Create our test table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,           -- Regular text
    metadata JSONB,         -- JSONB storage
    attachment BYTEA,       -- TOAST candidate
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clean up any existing data
TRUNCATE documents RESTART IDENTITY;
```

> The `RESTART IDENTITY` option resets the sequence counter for the `id` column back to 1, ensuring our examples start with predictable ID values.

### Creating Test Data: Small vs Large Documents

Now let's insert different types of documents to observe storage behavior:

```sql
-- Small document (fits comfortably in main table)
INSERT INTO documents (title, content, metadata, attachment) VALUES (
    'Small Document',
    'Small content',
    '{"tags": ["small"]}'::jsonb,
    'Small attachment'::bytea
);

-- Large document (triggers TOAST storage)
INSERT INTO documents (title, content, metadata, attachment) VALUES (
    'Large Document',
    repeat('A', 10000),  -- 10KB of content
    ('{"tags": ["large"], "description": "' || repeat('B', 1000) || '"}')::jsonb,
    repeat('Large binary content', 1000)::bytea
);

-- Update statistics for accurate analysis
VACUUM ANALYZE documents;
```

## Deep Dive: Storage Analysis

Let's analyze how PostgreSQL stores our data using built-in system views and functions.

### 1. Table Statistics Overview

```sql
-- Basic table statistics
SELECT 
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables
WHERE relname = 'documents';
```

**Output:**
```
 live_tuples | dead_tuples | inserts | updates | deletes 
-------------+-------------+---------+---------+------           2 |           0 |       2 |       0 |       0
(1 row)
```

This shows we have 2 live tuples (our small and large documents), with no dead tuples, updates, or deletes. PostgreSQL tracks these statistics to help with query planning and maintenance decisions.

### 2. Storage Size Analysis

```sql
-- Comprehensive storage breakdown
SELECT 
    'Total Size' as size_type,
    pg_size_pretty(pg_total_relation_size('documents')) as size
UNION ALL
SELECT 
    'Table Size',
    pg_size_pretty(pg_relation_size('documents'))
UNION ALL
SELECT 
    'Index Size',
    pg_size_pretty(pg_indexes_size('documents'))
UNION ALL
SELECT 
    'TOAST Size',
    COALESCE(
        pg_size_pretty(pg_total_relation_size(reltoastrelid)), 
        'No TOAST table'
    )
FROM pg_class 
WHERE relname = 'documents' 
AND reltoastrelid != 0;
```

**Output:**
```
 size_type  |    size    
------------+--------- Total Size | 64 kB
 Table Size | 8192 bytes
 Index Size | 16 kB
 TOAST Size | 8192 bytes
(4 rows)
```

Notice how PostgreSQL automatically created a TOAST table! Even with just 2 rows, the large content triggered TOAST infrastructure creation. The breakdown shows:
- **Total Size**: 64 kB (everything combined including metadata and unused space)
- **Table Size**: 8192 bytes (exactly one 8KB page)
- **Index Size**: 16 kB (primary key index - typically takes 2 pages minimum)
- **TOAST Size**: 8192 bytes (infrastructure allocated, though data may be compressed in main table)

Note: The total size includes additional PostgreSQL metadata, relation files, and space allocation that accounts for the full 64 kB.

### 3. Document-Level Storage Analysis

```sql
-- Analyze storage per document
SELECT 
    id,
    title,
    pg_column_size(content) as content_size,
    pg_column_size(metadata) as metadata_size,
    pg_column_size(attachment) as attachment_size,
    pg_column_size(content) + pg_column_size(metadata) + pg_column_size(attachment) as total_data_size
FROM documents
ORDER BY id;
```

**Output:**
```
 id |     title      | content_size | metadata_size | attachment_size | total_data_size 
----+----------------+--------------+---------------+-----------------+--------------  1 | Small Document |           14 |            30 |              17 |              61
  2 | Large Document |           58 |          1053 |             117 |            1228
(2 rows)
```

Here's the important part: the large document's content shows only 58 bytes instead of 10,000! This is because PostgreSQL automatically compressed the large content and what we're seeing is the compressed size plus any TOAST pointer overhead.

**Compression Effectiveness**:
```
Original logical size: 10,000 bytes  
Compressed storage: 58 bytes (includes compression + any overhead)
Compression ratio: ~172:1 (99.4% reduction)
```

The `pg_column_size()` function shows the actual storage bytes used, which includes compression. This dramatic compression happens because our content uses `repeat('A', 10000)` - highly repetitive data compresses extremely well using PostgreSQL's built-in compression algorithms.

## Understanding TOAST (The Oversized-Attribute Storage Technique)

TOAST is PostgreSQL's mechanism for handling large attribute values. When a row would exceed certain thresholds, PostgreSQL automatically:

1. **Compresses** large values
2. **Moves** them to a separate TOAST table
3. **Maintains** transparent access through the main table

### Analyzing TOAST Storage

```sql
-- TOAST table analysis
SELECT 
    c.relname as table_name,
    t.relname as toast_table_name,
    pg_size_pretty(pg_total_relation_size(t.oid)) as toast_size,
    pg_size_pretty(pg_relation_size(t.oid)) as toast_table_size,
    pg_size_pretty(pg_total_relation_size(t.oid) - pg_relation_size(t.oid)) as toast_index_size
FROM pg_class c
JOIN pg_class t ON c.reltoastrelid = t.oid
WHERE c.relname = 'documents';
```

**Output:**
```
 table_name | toast_table_name | toast_size | toast_table_size | toast_index_size 
------------+------------------+------------+------------------+--------------- documents  | pg_toast_23268   | 8192 bytes | 0 bytes          | 8192 bytes
(1 row)
```

Interesting! The TOAST table infrastructure has been created (8192 bytes allocated for the index) but the actual TOAST table storage shows 0 bytes. This indicates that our large values, while triggering TOAST preparation, are being handled through compression within the main table rather than being moved to separate TOAST storage. The compression was effective enough to keep the data in the main table.

> **TOAST Storage**: Like underground root systems that support trees, TOAST creates hidden storage infrastructure. PostgreSQL prepared the TOAST system even though our current data fits in the main table. This shows PostgreSQL's planning - it's ready for larger data when needed.

### Storage Efficiency Analysis

```sql
-- Calculate storage efficiency
SELECT 
    'Storage Efficiency' as analysis_type,
    pg_size_pretty(pg_total_relation_size('documents')) as total_size,
    pg_size_pretty(pg_relation_size('documents')) as table_size,
    ROUND(
        (pg_relation_size('documents')::numeric / pg_total_relation_size('documents')::numeric) * 100, 
        2
    ) as table_size_percentage,
    pg_size_pretty(pg_indexes_size('documents')) as index_size,
    ROUND(
        (pg_indexes_size('documents')::numeric / pg_total_relation_size('documents')::numeric) * 100, 
        2
    ) as index_size_percentage;
```

**Output:**
```
   analysis_type    | total_size | table_size | table_size_percentage | index_size | index_size_percentage 
--------------------+------------+------------+-----------------------+------------+-------------------- Storage Efficiency | 64 kB      | 8192 bytes |                 12.50 | 16 kB      |                 25.00
(1 row)
```

This reveals an important insight: with only 2 rows, the index overhead is significant! The indexes (25%) are twice as large as the actual table data (12.5%). 

**Storage Math for Small Tables**:
```
Total storage: 64 kB
Index overhead: 16 kB / 64 kB = 25%
Table data: 8 kB / 64 kB = 12.5%
Overhead ratio: 25% / 12.5% = 2:1 (indexes cost 2x the data)
```

This is normal for small tables but shows why index strategy matters as tables grow.

## Index Overhead Test with `generate_series`

Let's see how index overhead changes when we scale up to a thousand scale dataset. We'll insert 1000 records of each document type (small, medium, large) for a total of 3000 documents:

```sql
-- Insert 1000 small documents
INSERT INTO documents (title, content, metadata, attachment)
SELECT 
    'Small Document ' || i,
    'Small content for document ' || i,
    ('{"id": ' || i || ', "type": "small", "category": "' || (i % 10) || '"}')::jsonb,
    ('Small binary data ' || i)::bytea
FROM generate_series(1, 1000) i;

-- Insert 1000 medium documents  
INSERT INTO documents (title, content, metadata, attachment)
SELECT 
    'Medium Document ' || i,
    repeat('Medium content with more varied text for document ' || i || '. ', 50),
    ('{"id": ' || (i + 1000) || ', "type": "medium", "category": "' || (i % 10) || '", "details": "' || repeat('detail', 10) || '"}')::jsonb,
    repeat('Medium binary data chunk ', 25)::bytea
FROM generate_series(1, 1000) i;

-- Insert 1000 large documents
INSERT INTO documents (title, content, metadata, attachment)
SELECT 
    'Large Document ' || i,
    repeat('Large content with extensive text for document ' || i || '. This contains much more detailed information. ', 200),
    ('{"id": ' || (i + 2000) || ', "type": "large", "category": "' || (i % 10) || '", "description": "' || repeat('Large document description with lots of details. ', 50) || '"}')::jsonb,
    repeat('Large binary data with extensive content for document ' || i || '. ', 100)::bytea
FROM generate_series(1, 1000) i;

VACUUM ANALYZE documents;
```

### Scale Impact Analysis

**Table Statistics:**
```
 live_tuples | dead_tuples | inserts | updates | deletes 
-------------+-------------+---------+---------+------        3000 |           0 |    3000 |       0 |       0
(1 row)
```

**Storage Distribution (3000 documents):**
```
 size_type  |    size    
------------+--------- Total Size | 1744 kB
 Table Size | 1616 kB
 Index Size | 88 kB
 TOAST Size | 8192 bytes
(4 rows)
```

**Storage Efficiency:**
```
   analysis_type    | total_size | table_size | table_size_percentage | index_size | index_size_percentage 
--------------------+------------+------------+-----------------------+------------+-------------------- Storage Efficiency | 1744 kB    | 1616 kB    |                 92.66 | 88 kB      |                  5.05
(1 row)
```


## The anatomy of a tuple

A **tuple** is PostgreSQL's term for a single row of data stored in a table. While developers think of "rows" and "columns," PostgreSQL internally works with "tuples" and "attributes." Understanding this distinction helps explain PostgreSQL's storage behavior and performance characteristics.

### Tuple vs Row: The Key Difference

```sql
-- What developers see: a row with columns
SELECT id, title, content FROM documents WHERE id = 1;
```

```
 id |     title      |    content    
----+----------------+------------  1 | Small Document | Small content
```

**What PostgreSQL stores**: A tuple containing:
- **Tuple header**: 23 bytes of metadata
- **Null bitmap**: Tracks which attributes are NULL
- **User data**: The actual column values
- **Alignment padding**: Ensures proper memory alignment

### Physical Tuple Structure

```ascii
Tuple Layout (within an 8KB page):
+---------------------------+ ← Tuple Start
|     Tuple Header (23B)    |
|  - Transaction info       |
|  - Tuple size & flags     |
|  - Object ID              |
+---------------------------+
|     Null Bitmap           |
|  (1 bit per attribute)    |
+---------------------------+
| Attribute 1: id (4B)      |
+---------------------------+
| Attribute 2: title        |
|   - Length (1-4B)         |
|   - Data (variable)       |
+---------------------------+
| Attribute 3: content      |
|   - Length (1-4B)         |
|   - Data (or TOAST ptr)   |
+---------------------------+
| Padding for alignment     |
+---------------------------+ ← Tuple End
```

### Understanding Tuple Headers

Every tuple carries essential metadata in its 23-byte header:

```sql
-- First, create the pageinspect extension
CREATE EXTENSION IF NOT EXISTS pageinspect;

-- Now examine tuple header information
-- Look at the first page of our documents table
SELECT 
    lp as "Item#",
    lp_off as "Offset", 
    lp_len as "Length",
    t_xmin as "Insert_XID",
    t_xmax as "Delete_XID",
    t_ctid as "Physical_Location"
FROM heap_page_items(get_raw_page('documents', 0))
WHERE lp_len > 0
LIMIT 5;
```

**Output:**
```
 Item# | Offset | Length | Insert_XID | Delete_XID | Physical_Location 
-------+--------+--------+------------+------------+----------------     1 |   8144 |     47 |       1453 |          0 | (0,1)
     2 |   8040 |    103 |       1454 |          0 | (0,2)
     3 |   7984 |     55 |       1455 |          0 | (0,3)
     4 |   7928 |     55 |       1456 |          0 | (0,4)
     5 |   7872 |     55 |       1457 |          0 | (0,5)
```

This reveals how PostgreSQL manages tuples:
- **Item#**: Position within the page
- **Offset**: Byte position from start of page (8192 - offset = position from end)
- **Length**: Total tuple size including header
- **Insert_XID**: Transaction that created this tuple
- **Delete_XID**: Transaction that deleted this tuple (0 = not deleted)
- **Physical_Location**: (page, item) tuple identifier

### Tuple to Row Translation

When you query a table, PostgreSQL translates tuples to rows:

```sql
-- This simple query triggers complex internal operations
SELECT id, title FROM documents WHERE id = 1;
```

**Internal Process**:
1. **Page Access**: Load 8KB page containing the tuple
2. **Tuple Location**: Use item pointer to find tuple within page
3. **Header Parsing**: Read 23-byte header for transaction info
4. **MVCC Check**: Verify tuple visibility to current transaction
5. **Attribute Extraction**: Read each requested column's data
6. **Type Conversion**: Convert storage format to query result format

### Column Storage within Tuples

Different column types have different storage characteristics:

```sql
-- Analyze storage for different data types
SELECT 
    'INTEGER' as data_type,
    pg_column_size(1) as storage_bytes,
    'Fixed width, 4 bytes' as notes
UNION ALL
SELECT 
    'BIGINT',
    pg_column_size(1::bigint),
    'Fixed width, 8 bytes'
UNION ALL  
SELECT 
    'VARCHAR(50)',
    pg_column_size('Hello'::varchar(50)),
    'Variable width: 1-4B length + data'
UNION ALL
SELECT 
    'TEXT',
    pg_column_size(repeat('A', 100)),
    'Variable width, TOAST candidate'
UNION ALL
SELECT 
    'JSONB',
    pg_column_size('{"key": "value"}'::jsonb),
    'Compressed, optimized format'
UNION ALL
SELECT
    'TIMESTAMP',
    pg_column_size(now()),
    'Fixed width, 8 bytes';
```

**Output:**
```
 data_type  | storage_bytes |              notes               
------------+---------------+------------------------------- INTEGER    |             4 | Fixed width, 4 bytes
 BIGINT     |             8 | Fixed width, 8 bytes
 VARCHAR(50)|             9 | Variable width: 1-4B length + data
 TEXT       |           104 | Variable width, TOAST candidate
 JSONB      |            32 | Compressed, optimized format
 TIMESTAMP  |             8 | Fixed width, 8 bytes
```

### Tuple Size Calculations

Understanding tuple size helps predict storage requirements:

```sql
-- Calculate actual tuple size for our documents
SELECT 
    id,
    title,
    pg_column_size(id) as id_bytes,
    pg_column_size(title) as title_bytes,
    pg_column_size(content) as content_bytes,
    pg_column_size(metadata) as metadata_bytes,
    pg_column_size(attachment) as attachment_bytes,
    pg_column_size(created_at) as timestamp_bytes,
    pg_column_size(updated_at) as timestamp2_bytes,
    -- Header overhead
    23 as tuple_header_bytes,
    -- Total tuple size (approximate)
    23 + pg_column_size(id) + pg_column_size(title) + pg_column_size(content) + 
    pg_column_size(metadata) + pg_column_size(attachment) + 
    pg_column_size(created_at) + pg_column_size(updated_at) as estimated_tuple_size
FROM documents 
WHERE id <= 3
ORDER BY id;
```

**Output:**
```
 id |      title       | id_bytes | title_bytes | content_bytes | metadata_bytes | attachment_bytes | timestamp_bytes | timestamp2_bytes | tuple_header_bytes | estimated_tuple_size 
----+------------------+----------+-------------+---------------+----------------+------------------+-----------------+------------------+--------------------+-------------------  1 | Small Document   |        4 |          19 |            14 |             30 |               17 |               8 |                8 |                 23 |                  123
  2 | Large Document   |        4 |          19 |            58 |           1053 |              117 |               8 |                8 |                 23 |                 1290
  3 | Small Document 1 |        4 |          21 |            31 |             59 |               22 |               8 |                8 |                 23 |                  176
```

### Relationship: Tuples → Pages → Tables

Here's how the hierarchy works:

```ascii
Database Structure Hierarchy:

TABLE "documents"
├── Page 0 (8192 bytes)
│   ├── Page Header (24 bytes)
│   ├── Item Pointers (4 bytes each)
│   ├── Tuple 1 (123 bytes)
│   ├── Tuple 2 (1290 bytes) 
│   ├── Tuple 3 (176 bytes)
│   └── Free Space (5579 bytes)
├── Page 1 (8192 bytes)
│   ├── Page Header (24 bytes)
│   ├── Tuple 4...N
│   └── Free Space
└── Page N...
```

**Mathematical Relationship**:
```
Tuples per Page = (8192 - Page_Header - Item_Pointers) / Average_Tuple_Size
                = (8192 - 24 - (4 × Tuple_Count)) / Average_Tuple_Size

For our example with ~150 byte average tuples:
Tuples per Page ≈ (8192 - 24 - 240) / 150 ≈ 53 tuples/page
```

### Practical Implications

Understanding tuples helps with:

1. **Storage Planning**: Predict space requirements based on column types
2. **Performance Optimization**: Smaller tuples = more rows per page = fewer I/O operations
3. **Query Tuning**: Wide result sets read more tuple data
4. **Schema Design**: Column order affects tuple padding and size

### MVCC and Tuple Versions

PostgreSQL's MVCC (Multi-Version Concurrency Control) creates new tuple versions for updates:

```sql
-- Update creates a new tuple version
UPDATE documents SET title = 'Updated Small Document' WHERE id = 1;

-- Check for dead tuples
SELECT 
    schemaname,
    relname,
    n_live_tup,
    n_dead_tup,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables 
WHERE relname = 'documents';
```

**Output:**
```
 schemaname | relname   | n_live_tup | n_dead_tup | last_vacuum | last_autovacuum 
------------+-----------+------------+------------+-------------+-------------- public     | documents |         52 |         11 |             | 
```

Each update creates a new tuple while keeping the old one as a "dead tuple" until VACUUM removes it. This is why understanding tuples is crucial for PostgreSQL maintenance and performance.


### The Index Efficiency Mathematics

Here's the key relationship between data size and index overhead:

| Dataset Size | Index Overhead | Table Data | Efficiency Ratio |
|--------------|----------------|------------|------------------|
| **2 rows** | 25% | 12.5% | 1:2 (index costs 2x the data) |
| **3000 rows** | 5.05% | 92.66% | 1:18.3 (index costs 1/18th the data) |

**Mathematical Formula**: As row count increases, index overhead percentage decreases according to:
```
Index Overhead % = (Fixed Index Size) / (Total Storage Size) × 100
```

The index size grows logarithmically (O(log n)) while table data grows linearly (O(n)). This means:
- Index overhead = O(log n / n) → approaches 0 as n increases
- At 2 rows: log₂(2)/2 = 1/2 = 50% overhead factor  
- At 3000 rows: log₂(3000)/3000 ≈ 11.5/3000 = 0.38% overhead factor

With 3000 rows, the 88 kB index serves 1500x more records than the 2-row version.

### Document Type Performance Analysis

```sql
-- Storage distribution by document type (3000 documents)
WITH document_sizes AS (
    SELECT 
        id,
        metadata->>'type' as doc_type,
        pg_column_size(content) as content_size,
        pg_column_size(metadata) as metadata_size,
        pg_column_size(attachment) as attachment_size
    FROM documents
)
SELECT 
    doc_type,
    COUNT(*) as document_count,
    round(avg(content_size)) as avg_content_size,
    round(avg(metadata_size)) as avg_metadata_size,
    round(avg(attachment_size)) as avg_attachment_size,
    pg_size_pretty(sum(content_size + metadata_size + attachment_size)) as total_size
FROM document_sizes
WHERE doc_type IS NOT NULL
GROUP BY doc_type
ORDER BY sum(content_size + metadata_size + attachment_size) DESC;
```

**Output:**
```
 doc_type | document_count | avg_content_size | avg_metadata_size | avg_attachment_size | total_size 
----------+----------------+------------------+-------------------+---------------------+--------- medium   |           1000 |               83 |               139 |                 629 | 831 kB
 large    |           1000 |              191 |               145 |                  99 | 424 kB
 small    |           1000 |               31 |                59 |                  22 | 109 kB
(3 rows)
```

Fascinating insights emerge:
- **Medium documents** still consume the most space (831 kB) due to varied, less-compressible content
- **Large documents** with repetitive content compress better (424 kB)
- **Small documents** are most efficient (109 kB)

### Page Distribution Analysis

```sql
-- Page count analysis
SELECT 
    'Table Pages' as type,
    pg_relation_size('documents') / 8192 as page_count,
    pg_size_pretty(pg_relation_size('documents')) as size
UNION ALL
SELECT 
    'Index Pages',
    pg_relation_size('documents_pkey') / 8192,
    pg_size_pretty(pg_relation_size('documents_pkey'))
UNION ALL
SELECT 
    'TOAST Pages',
    COALESCE(pg_relation_size(reltoastrelid) / 8192, 0),
    COALESCE(pg_size_pretty(pg_relation_size(reltoastrelid)), '0 bytes')
FROM pg_class 
WHERE relname = 'documents';
```

**Output:**
```
    type     | page_count |  size   
-------------+------------+------ Table Pages |        202 | 1616 kB
 Index Pages |         11 | 88 kB
 TOAST Pages |          0 | 0 bytes
(3 rows)
```

This shows PostgreSQL's efficient page management:
- **202 pages** for table data (about 15 rows per 8KB page)
- **11 pages** for the primary key index  
- **0 TOAST pages** (compression kept everything in main table)

**Page Efficiency Calculation**:
```
Rows per page: 3000 rows / 202 pages = 14.9 rows/page
Page utilization: 14.9 × average_row_size / 8192 bytes ≈ 90%
```

> ⚡ **Index Efficiency**: Like any tool, indexes become more cost-effective with more use. Our change from 25% overhead (2 rows) to 5.05% overhead (3000 rows) shows how indexes need sufficient data volume to be worthwhile. Small tables don't provide enough benefit to justify the index cost.

## Column-Level Storage Insights

Different data types have different storage characteristics and alignment requirements:

```sql
-- Column storage analysis
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    CASE 
        WHEN data_type = 'jsonb' THEN 'Compressed JSON storage'
        WHEN data_type = 'text' THEN 'Variable length text'
        WHEN data_type = 'bytea' THEN 'Binary data (TOAST candidate)'
        WHEN data_type = 'integer' THEN 'Fixed 4 bytes'
        WHEN data_type = 'bigint' THEN 'Fixed 8 bytes'
        WHEN data_type LIKE 'timestamp%' THEN 'Fixed 8 bytes'
        ELSE 'Standard storage'
    END as storage_notes
FROM information_schema.columns 
WHERE table_name = 'documents'
ORDER BY ordinal_position;
```

**Output:**
```
 column_name |          data_type          | character_maximum_length |         storage_notes         
-------------+-----------------------------+--------------------------+---------------------------- id          | integer                     |                          | Fixed 4 bytes
 title       | character varying           |                      255 | Standard storage
 content     | text                        |                          | Variable length text
 metadata    | jsonb                       |                          | Compressed JSON storage
 attachment  | bytea                       |                          | Binary data (TOAST candidate)
 created_at  | timestamp without time zone |                          | Fixed 8 bytes
 updated_at  | timestamp without time zone |                          | Fixed 8 bytes
(7 rows)
```

This breakdown shows how PostgreSQL optimizes storage for different data types. Fixed-width columns (integers, timestamps) have predictable storage requirements, while variable-length columns (text, jsonb, bytea) can trigger TOAST storage for large values.

**Storage Alignment**: PostgreSQL aligns data on specific boundaries:
- BIGINT (8 bytes): 8-byte alignment
- INTEGER (4 bytes): 4-byte alignment  
- SMALLINT (2 bytes): 2-byte alignment
- CHAR/VARCHAR: 1-byte alignment

Column order affects storage efficiency due to padding between misaligned columns.

## Buffer Management and Performance

PostgreSQL uses a shared buffer pool to cache frequently accessed pages in memory. Let's examine buffer usage:

```sql
-- Buffer hit ratio (should be > 95% in production)
SELECT 
    datname,
    round(100.0 * blks_hit / (blks_hit + blks_read), 2) as hit_ratio,
    blks_read as disk_reads,
    blks_hit as buffer_hits
FROM pg_stat_database
WHERE datname = current_database();
```

**Output:**
```
    datname    | hit_ratio | disk_reads | buffer_hits 
---------------+-----------+------------+---------- internals_lab |     99.53 |        589 |      124057
(1 row)
```

Excellent! Our buffer hit ratio is 99.53%, which means 99.53% of page requests were served from memory rather than disk. This is well above the recommended 95% threshold.

**Buffer Hit Ratio Calculation**:
```
Hit Ratio = (buffer_hits / (buffer_hits + disk_reads)) × 100
Hit Ratio = (124,057 / (124,057 + 589)) × 100 = 99.53%
```

**Performance Impact**: The difference between 95% and 99.53% hit ratio:
- 95% = 50 disk reads per 1000 requests
- 99.53% = 4.7 disk reads per 1000 requests
- **10.6x fewer disk operations** = much faster response times

> 🌀 **Buffer Cache**: PostgreSQL keeps frequently used data in memory, like keeping important books on your desk instead of walking to the bookshelf. Our 99.53% hit ratio shows the cache is working well - most data requests are answered from memory rather than slow disk reads.

### Monitoring Table Access Patterns

```sql
-- Table access patterns
SELECT 
    schemaname,
    relname as table_name,
    seq_scan as sequential_scans,
    seq_tup_read as rows_read_sequentially,
    idx_scan as index_scans,
    idx_tup_fetch as rows_fetched_via_index,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables
WHERE relname = 'documents';
```

**Output (after running some index queries):**
```
 schemaname | table_name | sequential_scans | rows_read_sequentially | index_scans | rows_fetched_via_index | inserts | updates | deletes 
------------+------------+------------------+------------------------+-------------+------------------------+---------+---------+------ public     | documents  |                1 |                      0 |           5 |                     14 |      52 |      10 |       0
(1 row)
```

This shows our table has had:
- **1 sequential scan** (probably during VACUUM ANALYZE)
- **5 index scans** (from our test queries using primary key lookups)
- **14 rows fetched via index** (more efficient than sequential scanning)
- **52 inserts**, **10 updates**, **0 deletes**

## Write-Ahead Log (WAL) and Durability

PostgreSQL's WAL ensures ACID compliance and crash recovery. Let's examine WAL settings:

```sql
-- WAL configuration
SELECT name, setting, unit, context 
FROM pg_settings 
WHERE name IN (
    'wal_level',
    'synchronous_commit',
    'checkpoint_timeout',
    'max_wal_size',
    'wal_buffers'
);
```

**Output:**
```
        name        | setting | unit |  context   
--------------------+---------+------+--------- checkpoint_timeout | 300     | s    | sighup
 max_wal_size       | 1024    | MB   | sighup
 synchronous_commit | on      |      | user
 wal_buffers        | 2048    | 8kB  | postmaster
 wal_level          | replica |      | postmaster
(5 rows)
```

This shows PostgreSQL's WAL configuration:
- **wal_level**: `replica` - enables replication
- **synchronous_commit**: `on` - ensures durability by waiting for WAL flush
- **checkpoint_timeout**: `300s` (5 minutes) - automatic checkpoint interval
- **max_wal_size**: `1024MB` - maximum WAL size before triggering checkpoint
- **wal_buffers**: `2048 * 8kB = 16MB` - WAL buffer memory

### Understanding Checkpoints: The WAL-to-Disk Bridge

Checkpoints are PostgreSQL's way of creating consistent snapshots of your database. Think of them as periodic "save points" that ensure all changes recorded in the WAL are safely written to the actual data files on disk.

**The WAL → Checkpoint Relationship:**

```ascii
WAL Process Flow:
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Changes   │ →  │     WAL      │ →  │   Checkpoint    │
│  (Memory)   │    │   (Log)      │    │  (Data Files)   │
└─────────────┘    └──────────────┘    └─────────────────┘
     Fast              Durable             Persistent
```

**Why Checkpoints Matter:**

1. **Data Durability**: Without checkpoints, your data would only exist in WAL logs
2. **Recovery Speed**: Checkpoints limit how much WAL needs to be replayed during crash recovery
3. **WAL Management**: Completed checkpoints allow old WAL files to be recycled or archived
4. **Performance Balance**: Too frequent = I/O overhead; too rare = slow recovery

**Checkpoint Triggers:**

PostgreSQL creates checkpoints automatically when:
- **Time-based**: Every `checkpoint_timeout` seconds (default: 300s = 5 minutes)
- **WAL-based**: When WAL reaches `max_wal_size` (default: 1GB)
- **Manual**: When you run `CHECKPOINT` command
- **Shutdown**: During clean database shutdown

Now let's examine checkpoint behavior with real statistics:

```sql
-- Checkpoint statistics
-- Note: PostgreSQL 17+ uses pg_stat_checkpointer, older versions use pg_stat_bgwriter
SELECT 
    num_timed,
    num_requested,
    write_time,
    sync_time,
    buffers_written
FROM pg_stat_checkpointer;
```

**Output:**
```
 num_timed | num_requested | write_time | sync_time | buffers_written 
-----------+---------------+------------+-----------+--------------
         0 |             1 |          7 |       236 |            2294
(1 row)
```

Checkpoint activity analysis:
- **0 timed checkpoints** - No automatic checkpoints triggered yet
- **1 requested checkpoint** - Manual checkpoint occurred (likely during startup)
- **Write time**: 7ms - Time spent writing dirty buffers to disk
- **Sync time**: 236ms - Time spent syncing files to ensure durability
- **2294 buffers written** - Pages written during checkpoints (about 18 MB)

> 🔄 **WAL Timing**: PostgreSQL constantly logs changes to prepare for crash recovery. Our configuration shows a 5-minute checkpoint cycle, 16MB of WAL buffer memory, and 1GB capacity before forcing a checkpoint. The timing shows the balance: 7ms to write changes, 236ms to ensure data is safely stored (durability guarantee).

## The PostgreSQL WAL Seasonal Cycle: A Deep Dive

The WAL (Write-Ahead Log) system follows natural patterns that we can understand through seasonal metaphors. Let's explore each season with real PostgreSQL data and insights from our workshop experiments.

### 🌸 Spring: Checkpoint Blooming - The Fresh Start

Spring represents the checkpoint process where PostgreSQL takes accumulated changes and "blooms" them into the main data files. Let's see this in action:

```sql
-- Spring Checkpoint Analysis
SELECT 
    'Before Checkpoint' as timing,
    pg_current_wal_lsn() as current_lsn,
    pg_walfile_name(pg_current_wal_lsn()) as wal_file;

-- Force a checkpoint (the blooming moment!)
CHECKPOINT;

SELECT 
    'After Checkpoint' as timing,
    pg_current_wal_lsn() as current_lsn,
    pg_walfile_name(pg_current_wal_lsn()) as wal_file;
```

**Real Workshop Results:**
```
       timing        | current_lsn |         wal_file         
---------------------+-------------+--------------------------
 Before Checkpoint   | 0/2A28B70   | 000000010000000000000002
 After Checkpoint    | 0/2A28C40   | 000000010000000000000002
```

**Spring Checkpoint Statistics:**
- **Checkpoint Duration**: 31.17ms (very fast!)
- **Buffers Written**: 59 pages (472 KB)
- **Type**: Manual checkpoint (requested: 2, timed: 63)

> **Spring Insights**: Like flowers blooming in a coordinated way, checkpoints happen at regular intervals (300 seconds by default) or when WAL reaches 1GB. Each checkpoint ensures all dirty pages are safely written to disk, allowing old WAL files to be recycled - just like spring cleaning!

### ☀️ Summer: Hot Data Growth - Active Operations

Summer represents peak database activity with frequent operations, updates, and "hot" data access patterns:

```sql
-- Summer Hot Data Simulation
INSERT INTO wal_test_records (name, description, metadata) 
SELECT 
    'Summer Heat ' || i,
    'Active summer growth with lots of warm data access: ' || repeat('hot ', 20),
    json_build_object('season', 'summer', 'temperature', 'hot', 
                     'activity_id', i, 'access_pattern', 'frequent')::jsonb
FROM generate_series(1, 500) i;

-- Frequent updates (hot data pattern)
UPDATE wal_test_records 
SET description = description || ' [UPDATED IN SUMMER HEAT]',
    metadata = metadata || '{"last_accessed": "summer_hot_time"}'::jsonb
WHERE name LIKE 'Summer Heat%' AND id % 3 = 0;
```

**Summer Performance Metrics:**
- **Records Created**: 500 summer records
- **Buffer Hit Ratio**: 99.82% (excellent caching performance)
- **Total Disk Reads**: 641 (minimal, thanks to buffer cache)
- **Total Buffer Hits**: 346,055 (hot data staying in memory)

**Summer WAL Growth:**
- **Description Length**: 140 characters average (more verbose than other seasons)
- **Access Pattern**: Frequent updates simulating high activity
- **Memory Efficiency**: Hot data stays in PostgreSQL's buffer cache

> **Summer Performance**: Just like summer's abundant growth, busy databases generate more WAL traffic. Our test showed a 99.82% buffer hit ratio, meaning hot data stays in memory where PostgreSQL can access it quickly. This is why monitoring buffer hit ratios is crucial for summer-like workloads.

### 🍂 Autumn: Archiving Old Logs - Compression and Storage

Autumn represents the archival process where old WAL logs are compressed and stored for long-term retention:

```sql
-- Autumn Archival Process
INSERT INTO wal_test_records (name, description, metadata) 
SELECT 
    'Archived Log ' || i,
    'Old system log entry from previous season, now being archived for long-term storage.',
    json_build_object('season', 'autumn', 'archive_id', i, 
                     'status', 'archived', 'retention', 'long_term')::jsonb
FROM generate_series(1, 100) i;
```

**Autumn Archival Results:**
- **WAL Generated**: 36 kB during archival operations
- **Records Archived**: 100 log entries
- **Description Length**: 116 characters average (detailed archival metadata)
- **Compression Opportunity**: Repetitive archival patterns are ideal for WAL compression

**Autumn Configuration Insights:**
```
wal_compression = off     # Could be enabled for better archival efficiency
wal_keep_size = 0 MB      # No specific retention size set
max_wal_size = 1024 MB    # Checkpoint trigger threshold
```

> **Autumn Archival**: Like leaves falling in predictable patterns, archived logs often contain repetitive structures perfect for compression. Enabling `wal_compression = on` can significantly reduce storage requirements for write-heavy workloads, especially during archival operations.

### ❄️ Winter: Peaceful Archive Storage - Minimal Activity

Winter represents dormant, safely stored data with minimal access patterns and efficient maintenance:

```sql
-- Winter Archive Storage
INSERT INTO wal_test_records (name, description, metadata) 
SELECT 
    'Winter Archive ' || i,
    'Dormant data safely stored under winter conditions. Minimal access, long-term preservation.',
    json_build_object('season', 'winter', 'archive_id', i, 
                     'status', 'dormant', 'access_pattern', 'minimal')::jsonb
FROM generate_series(1, 50) i;

-- Minimal winter maintenance
UPDATE wal_test_records 
SET metadata = metadata || '{"last_check": "winter_maintenance"}'::jsonb
WHERE name LIKE 'Winter Archive%' AND id % 10 = 0;
```

**Winter Storage Efficiency:**
- **Records**: 50 winter archives (minimal activity)
- **Maintenance Updates**: Only 5 records updated (10% maintenance rate)
- **Description Length**: 91 characters average (concise, efficient)
- **Access Pattern**: Minimal, focusing on long-term preservation

**Winter WAL Characteristics:**
- **WAL Growth**: Minimal during winter operations
- **Efficiency**: Low maintenance overhead
- **Storage**: Optimized for long-term retention

> **Winter Dormancy**: Winter storage mimics how PostgreSQL handles infrequently accessed data. The system maintains minimal overhead while ensuring data integrity. This is when VACUUM operations are most effective, and when you can safely archive old WAL files to long-term storage.

### 🌱 Complete Seasonal Cycle Summary

Our workshop simulation created a complete seasonal cycle with real PostgreSQL metrics:

| Season | Records | Avg Description | WAL Pattern | Performance Focus |
|--------|---------|----------------|-------------|-------------------|
| **Spring** | 101 | 65 chars | Checkpoint blooming | Fresh starts, cleanup |
| **Summer** | 500 | 140 chars | Hot data activity | Buffer efficiency, frequent access |
| **Autumn** | 100 | 116 chars | Archival compression | Log retention, compression |
| **Winter** | 50 | 91 chars | Dormant storage | Minimal overhead, long-term storage |

**Final System State:**
- **Total WAL Generated**: 43 MB
- **Buffer Hit Ratio**: 99.82% (excellent performance)
- **Checkpoint Efficiency**: 102.68 seconds total write time, 0.46 seconds sync time
- **Total Records**: 751 across all seasons

This seasonal approach helps understand when different PostgreSQL optimizations matter most: buffer tuning for summer workloads, compression for autumn archival, efficient checkpoints for spring cleanup, and minimal overhead for winter storage.

## Performance Optimization Insights

### 1. Column Order Optimization

The order of columns in a table affects storage efficiency due to alignment requirements:

```sql
-- Create a table with optimal column order
CREATE TABLE optimized_table (
    -- Fixed-width columns first (better alignment)
    id BIGINT,
    created_at TIMESTAMP,
    is_active BOOLEAN,
    score NUMERIC(10,2),
    
    -- Variable-width columns last
    title VARCHAR(255),
    description TEXT,
    metadata JSONB
);
```

### 2. Monitoring Dead Tuples and Bloat

```sql
-- Table bloat analysis
SELECT 
    schemaname,
    relname as tablename,
    n_dead_tup,
    n_live_tup,
    ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_percentage
FROM pg_stat_user_tables
WHERE relname = 'documents';
```

**Output (after some updates):**
```
 schemaname | tablename | n_dead_tup | n_live_tup | dead_percentage 
------------+-----------+------------+------------+-------------- public     | documents |         10 |         52 |           16.13
(1 row)
```

This shows **16.13% dead tuples** from our updates. When this percentage gets high (>20%), it's time to run `VACUUM` to reclaim space and maintain performance. PostgreSQL's MVCC creates new row versions for updates, leaving old versions as "dead tuples" until VACUUM cleans them up.

## Advanced Storage Techniques

### Using BRIN Indexes for Large Tables

BRIN (Block Range) indexes are perfect for large, append-only tables:

```sql
-- Create a BRIN index for time-series data
CREATE INDEX idx_documents_created_brin 
ON documents 
USING brin(created_at)
WITH (pages_per_range = 128);

-- Compare index sizes
SELECT 
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes 
WHERE tablename = 'documents';
```

### Monitoring Index Usage

```sql
-- Index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as times_used,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_stat_user_indexes
WHERE tablename = 'documents'
ORDER BY idx_scan DESC;
```

## Real-World Storage Patterns

Let's simulate a more realistic scenario with multiple document types:

```sql
-- Insert various document types to observe patterns
INSERT INTO documents (title, content, metadata, attachment)
SELECT 
    'Document ' || i,
    CASE 
        WHEN i % 3 = 0 THEN repeat('Large content ', 1000)  -- Large documents
        WHEN i % 3 = 1 THEN repeat('Medium content ', 100)  -- Medium documents  
        ELSE 'Small content'                                -- Small documents
    END,
    ('{"id": ' || i || ', "type": "' || 
        CASE WHEN i % 3 = 0 THEN 'large' 
             WHEN i % 3 = 1 THEN 'medium' 
             ELSE 'small' END || '"}')::jsonb,
    CASE 
        WHEN i % 5 = 0 THEN repeat('Binary data ', 500)::bytea
        ELSE 'Small binary'::bytea
    END
FROM generate_series(1, 100) i;

-- Update statistics
VACUUM ANALYZE documents;
```

With 100 additional documents, let's see how storage scales:

### Analyzing Storage Distribution

```sql
-- Storage distribution by document type
WITH document_sizes AS (
    SELECT 
        id,
        metadata->>'type' as doc_type,
        pg_column_size(content) as content_size,
        pg_column_size(metadata) as metadata_size,
        pg_column_size(attachment) as attachment_size
    FROM documents
)
SELECT 
    doc_type,
    COUNT(*) as document_count,
    round(avg(content_size)) as avg_content_size,
    round(avg(metadata_size)) as avg_metadata_size,
    round(avg(attachment_size)) as avg_attachment_size,
    pg_size_pretty(sum(content_size + metadata_size + attachment_size)) as total_size
FROM document_sizes
WHERE doc_type IS NOT NULL
GROUP BY doc_type
ORDER BY sum(content_size + metadata_size + attachment_size) DESC;
```

**Output:**
```
 doc_type | document_count | avg_content_size | avg_metadata_size | avg_attachment_size | total_size 
----------+----------------+------------------+-------------------+---------------------+--------- medium   |             34 |             1504 |                43 |                  21 | 52 kB
 large    |             33 |               86 |                42 |                  20 | 4893 bytes
 small    |             33 |               14 |                42 |                  21 | 2557 bytes
(3 rows)
```

Notice something counterintuitive: the "medium" documents use the most total storage (52 kB), while "large" documents only use 4.9 kB! This is because PostgreSQL compresses the repetitive content in large documents, while medium documents with diverse content compress less efficiently.

**Storage Sizes:**
```
 size_type  |    size    
------------+--------- Total Size | 128 kB
 Table Size | 72 kB
 Index Size | 16 kB
 TOAST Size | 8192 bytes
(4 rows)
```

With 102 total documents, we now use 9 pages (72 kB) for the main table data, while indexes remain at 16 kB and TOAST storage is still minimal due to compression.

## Performance Monitoring Dashboard

Create a comprehensive view of your table's performance:

```sql
-- Complete storage and performance overview
SELECT 
    'documents' as table_name,
    pg_size_pretty(pg_total_relation_size('documents')) as total_size,
    pg_size_pretty(pg_relation_size('documents')) as table_size,
    pg_size_pretty(pg_indexes_size('documents')) as indexes_size,
    (SELECT pg_size_pretty(pg_total_relation_size(reltoastrelid)) 
     FROM pg_class WHERE relname = 'documents' AND reltoastrelid != 0) as toast_size,
    (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname = 'documents') as live_tuples,
    (SELECT n_dead_tup FROM pg_stat_user_tables WHERE relname = 'documents') as dead_tuples,
    (SELECT round(100.0 * blks_hit / (blks_hit + blks_read), 2) 
     FROM pg_stat_database WHERE datname = current_database()) as buffer_hit_ratio;
```

**Output:**
```
 table_name | total_size | table_size | indexes_size | toast_size | live_tuples | dead_tuples | buffer_hit_ratio 
------------+------------+------------+--------------+------------+-------------+-------------+--------------- documents  | 112 kB     | 56 kB      | 16 kB        | 8192 bytes |          52 |          10 |            99.55
(1 row)
```

This comprehensive dashboard shows:
- **Total size**: 112 kB (table + indexes + TOAST)
- **Table size**: 56 kB (7 pages of actual data)
- **Index size**: 16 kB (2 pages for primary key)
- **TOAST size**: 8 kB (1 page allocated but unused)
- **Live/Dead tuples**: 52/10 (16.13% bloat from updates)
- **Buffer hit ratio**: 99.55% (excellent memory efficiency)

> 🌿 **Database Health**: Database health shows through specific metrics that reflect system balance. Our dashboard shows good health: 99.55% buffer efficiency, controlled bloat at 16.13%, and proper space allocation across table/index/TOAST components. These numbers indicate the system is working well.

### Additional Monitoring Queries

For ongoing monitoring, consider these additional queries:

```sql
-- Monitor table and index usage patterns
SELECT schemaname, relname,
       seq_scan, seq_tup_read,
       idx_scan, idx_tup_fetch
FROM pg_stat_user_tables
WHERE relname = 'documents';

-- Monitor index efficiency
SELECT schemaname, relname as tablename, indexrelname as indexname,
       idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE relname = 'documents';
```

These statistics help identify:
- Tables that might benefit from indexes (high `seq_scan`, low `idx_scan`)
- Unused indexes (zero `idx_scan`)
- Query patterns and performance trends

## Key Takeaways

1. **8KB Pages**: PostgreSQL's fundamental storage unit affects all I/O operations
2. **TOAST Storage**: Automatically handles large values, keeping main tables efficient
3. **Buffer Management**: High hit ratios (>95%) are crucial for performance
4. **Column Order**: Affects storage efficiency due to alignment requirements
5. **Monitoring**: Regular analysis of storage patterns helps optimize performance

## Best Practices for Production

1. **Monitor buffer hit ratios** regularly
2. **Use appropriate data types** for your data
3. **Consider column order** for frequently accessed tables
4. **Implement proper indexing strategies** (B-tree, BRIN, etc.)
5. **Monitor TOAST usage** for tables with large objects
6. **Regular VACUUM and ANALYZE** to maintain statistics

## Cleanup

When you're done experimenting, clean up the Docker container:

```bash
# Stop and remove the container
docker stop postgres-internals
```

## Next Steps

This exploration of PostgreSQL internals provides the foundation for understanding:
- Transaction management and MVCC
- Query optimization and execution plans  
- Advanced indexing strategies
- Time-series optimization with TimescaleDB

Understanding these storage fundamentals will help you make informed decisions about schema design, query optimization, and performance tuning in your PostgreSQL applications.

The complete code examples from this article are available in the [PostgreSQL Performance Workshops repository](https://github.com/jonatas/postgresql-performance-workshops).

## Feedback

If you find this workshop useful, feel free to drop me a line at [linkedin](https://www.linkedin.com/in/jonatasdp/).
