---
layout: post
description: "I started supporting tsbs project, and
this weekend I decided to try to run it on my Raspberry Pi version 3."
date: 2021-05-24
---
I started supporting [tsbs](https://github.com/timescale/tsbs) project, and
this weekend I decided to try to run it on my Raspberry Pi version 3.

Here I'll share a bit of my saga to make it work and all the steps I followed to
benchmark Postgresql with [TimescaleDB](https://docs.timescale.com/).

## Setup environment

If you want to try this, the first thing you need to do is download an Ubuntu image to load in your Pi.
I have an old one here, so, I updated it recently with the following command:

```
sudo apt dist-upgrade
```

It will take a while and maybe go into some crazy errors. To me, I have to
force it to go.

### Disable GUI interface

We're just going to access the machine via ssh, so it would be better to have
less process running as possible. As ubuntu mate brings interface enabled by
default, let's disable it:

```
systemctl set-default multi-user.target --force
systemctl disable lightdm.service --force
systemctl disable graphical.target --force
systemctl disable plymouth.service --force
```

### Installing latest go version

[tsbs](https://github.com/timescale/tsbs) is written in go, and we're going to
build it inside the Raspberry Pi. You can download it with the following command:

```
cd /tmp
wget https://dl.google.com/go/go1.14.4.linux-armv6l.tar.gz
```

Now, the next step is to extract it into `/usr/local`:

```
sudo tar -C /usr/local -xzf go1.14.4.linux-armv6l.tar.gz
```

Edit your `~/.profile`  to configure `PATH` and `GOPATH`:

```
PATH=$PATH:/usr/local/go/bin
GOPATH=$HOME/go
```

Now, we still need to create the `GOPATH` folder:

```
mkdir $HOME/go
```

and then we can source the `.profile` to reload the configuration:

```
source ~/.profile
```

Now, double-checking the version:

```
jonatas@rpi-3:~$ go version
go version go1.14.4 Linux/arm
```

### Running timescaledb via docker

Just make sure you don't have Postgres running:

```
sudo service PostgreSQL stop
```

#### Pulling timescaledb official image

Now, let's run the image. It will automatically pull if you don't have it
locally:

```
sudo docker run --name timescaledb -p 5432:5433 -e POSTGRES_PASSWORD=password timescale/timescaledb:latest-pg12
```

The first time you run it, the [timescaledb-tune](https://docs.timescale.com/timescaledb/latest/how-to-guides/configuration/timescaledb-tune/)
will break it, and you'll need to join the image via ssh and edit the configuration.

The tool outputs the following configuration:

```
docker start timescaledb
docker exec -i -t timescaledb /bin/bash
```

You can learn more about how to edit the `postgresql.conf` inside a
timescale container [here](https://docs.timescale.com/timescaledb/latest/how-to-guides/configuration/docker-config/).

Here are the suggestions from the tool:

```
shared_buffers = 223094kB
effective_cache_size = 669282kB
maintenance_work_mem = 111547kB
work_mem = 2788kB
timescaledb.max_background_workers = 8
max_worker_processes = 15
max_parallel_workers_per_gather = 2
max_parallel_workers = 4
wal_buffers = 6692kB
min_wal_size = 512MB
default_statistics_target = 500
random_page_cost = 1.1
checkpoint_completion_target = 0.9
max_connections = 20
max_locks_per_transaction = 64
autovacuum_max_workers = 10
autovacuum_naptime = 10
effective_io_concurrency = 200
timescaledb.last_tuned = '2021-05-22T23:23:57Z'
timescaledb.last_tuned_version = '0.11.0'
```

While testing, maybe you'll end up running it multiple times, but you want to reuse the same name, you can remove the previous image. Here is a snippet for it:

```
sudo docker rm $(sudo docker ps -aq --filter name=timescaledb)
```

While it pulls the image, we can get more time to install tsbs and take the
time to compile it.

## Installing tsbs

Let's get the tsbs project:

```
go get github.com/timescale/tsbs
```

Let's join the folder:

```
cd $GOPATH/src/github.com/timescale/tsbs
```

Now we can run `make all` to compile all the tool we need to benchmark
time-series databases.

```
make all
```

It will take a while: 10 to 15 minutes in this small hardware, enjoy your favorite drink ☕️

## Configuring environment variables

Next step is get familiar with the tools and their purpose:

* `tsbs_load` will let you benchmark the data load into a database (several in the [list](https://github.com/timescale/tsbs#current-use-cases)).
* `tsbs_run_queries_timescaledb` allows you to execute several types of queries widespread in IoT and DevOps ecosystems. [more here](https://github.com/timescale/tsbs#benchmarking-query-execution-performance).

## Running tsbs

First, let's generate some config to run, so it's easy to change the variables
instead of keeping a long command line.

```
tsbs_load config
```

It will generate some config, let me share the one I used here:

```
data-source:
  # data source type [SIMULATOR|FILE]
  type: SIMULATOR
  # generate data on the fly
  simulator:
    # each time the simulator advances in time it skips this amount of time
    log-interval: 10s
    # maximum number of points to simulate (limit)
    max-data-points: 1000000
    # number of hosts to simulate (each host has a different tag-set/label-set
    scale: 40
    # set seed to some number to have reproducible data be generated
    seed: 135
    # start time of simulation
    timestamp-start: "2021-01-01T10:00:00Z"
    # end time of simulation
    timestamp-end: "2021-01-04T08:00:00Z"
    # use case to simulate
    use-case: cpu-only
loader:
  db-specific:
    admin-db-name: postgres
    # set chunk time depending on server size
    chunk-time: 4h0m0s
    create-metrics-table: true
    field-index: VALUE-TIME
    field-index-count: 0
    force-text-format: false
    host: 0.0.0.0
    user: postgres
    pass: password
    port: 5432
    in-table-partition-tag: false
    log-batches:false
    partition-index: true
    partitions: 1
    postgres: sslmode=prefer
    time-index: true
    time-partition-index: false
    use-hypertable: true
    use-distributed-hypertable: false
    use-jsonb-tags: false
  runner:
    # the simulated data will be sent in batches of 'batch-size' points
    # to each worker
    batch-size: 10000
    # don't worry about this until you need to simulate data with scale > 1000
    channel-capacity: "0"
    db-name: benchmark
    do-abort-on-exist: false
    do-create-db: true
    # set this to false if you want to see the speed of data generation
    do-load: true
    # don't worry about this until you need to simulate data with scale > 1000
    flow-control: false
    hash-workers: true
    limit: 1000000
    reporting-period: 10s
    seed: 135
    workers: 2 
```

Running:

```
jonatas@rpi-3:~/go/src/github.com/timescale/tsbs$tsbs_load load timescaledb --config config.yaml Using config file: config.yaml
time,per. metric/s,metric total,overall metric/s,per. row/s,row total,overall row/s
%!(EXTRA uint64=10000)panic: runtime error: invalid memory address or nil pointer dereference
[signal SIGSEGV: segmentation violation code=0x1 addr=0x0 pc=0x125b4]

goroutine 56 [running]:
runtime/internal/atomic.goXadd64(0x2908824, 0x186a0, 0x0, 0x2, 0x2)
	/usr/local/go/src/runtime/internal/atomic/atomic_arm.go:103 +0x1c
github.com/timescale/tsbs/load.(*CommonBenchmarkRunner).work(0x29087e0, 0xc555a0, 0x29ac7c0, 0x2f1a640, 0x29b2928, 0x1)
	/home/jonatas/go/src/github.com/timescale/tsbs/load/loader.go:248 +0x1ec
created by github.com/timescale/tsbs/load.(*CommonBenchmarkRunner).RunBenchmark
	/home/jonatas/go/src/github.com/timescale/tsbs/load/loader.go:160 +0xd8
```

Oh, we got an error :sad panda:

Looks like the error is around [here](https://github.com/timescale/tsbs/blob/master/load/loader.go#L247).

Let's check if it makes something in the database:

```
psql benchmark -h 0.0.0.0 -U postgres
Password for user Postgres:
psql (10.16 (Ubuntu 10.16-0ubuntu0.18.04.1), server 12.6)
WARNING: psql major version 10, server major version 12.
         Some psql features might not work.
Type "help" for help.
```

Checking the tables with `\dt`:

```
benchmark=# \dt
        List of relations
 Schema | Name | Type  |  Owner
--------+------+-------+----------
 public | CPU  | table | Postgres
 public | tags | table | Postgres
(2 rows)
```

Great! it created the tables  :)

Now, let's see if it was able to insert something:

```
benchmark=# select count(1) from cpu;
 count
-------
 20000
(1 row)

benchmark=# select count(1)  from tags ;
 count
-------
    40
(1 row)
```

`40` tags as set in the configuration.

Exactly the numbers we have as limits in our system!

Let's try to understand the error putting one infamous printing line to get what we have in the context:

```diff
--- a/load/loader.go
+++ b/load/loader.go
@@ -245,6 +245,7 @@ func (l *CommonBenchmarkRunner) work(b targets.Benchmark, wg *sync.WaitGroup, c
        for batch := range c.toWorker {
                startedWorkAt := time.Now()
                metricCnt, rowCnt := proc.ProcessBatch(batch, l.DoLoad)
+               printFn("loaded metricCnt %d with rowCnt %d\n",metricCnt, rowCnt)
```

Now, let's compile tsbs loaders and rerun it. To compile only the loaders
you can use a make task:

```
make loaders
```

But this task will compile all loaders and on a Raspberry, all resources are
limited. Let's cherry-pick only the builds we're using:

```
make tsbs_load tsbs_load_timescaledb
```

You should see several lines in the output like these:

```
GO111MODULE=on go get ./cmd/tsbs_load
GO111MODULE=ontsbs_load ./cmd/tsbs_load
GO111MODULE=on go install ./cmd/tsbs_load
GO111MODULE=on go get ./cmd/tsbs_load_timescaledb
GO111MODULE=ontsbs_load_timescaledb ./cmd/tsbs_load_timescaledb
GO111MODULE=on go install ./cmd/tsbs_load_timescaledb
```

Running again:

```
bin/tsbs_load load timescaledb --config config.yaml Using config file: config.yaml
time,per. metric/s,metric total,overall metric/s,per. row/s,row total,overall row/s
loaded metricCnt 100000 with rowCnt 10000
panic: runtime error: invalid memory address or nil pointer dereference
[signal SIGSEGV: segmentation violation code=0x1 addr=0x0 pc=0x125b4]
```

Well, looks like the rows are being inserted, but some other pointer reference is
nil.

Wow! Inspecting the `atomic.AddUInt64` is responsible for such [bug only on
arm](https://github.com/golang/go/issues/23345). Funny, no? Let's go deep and
see how it works, because today I can learn about go deeper.

Here [is the gift](https://golang.org/src/sync/atomic/doc.go?s=1206:1659#L36).

```
    46  // BUG(RSC): On 386, the 64-bit functions use instructions unavailable before the Pentium MMX.
    47  //
    48  // On non-Linux ARM, the 64-bit functions use instructions unavailable before the ARMv6k core.
    49  //
    50  // On ARM, 386, and 32-bit MIPS, it is the caller's responsibility
    51  // to arrange for 64-bit alignment of 64-bit words accessed atomically.
    52  // The first word in a variable or in an allocated struct, array, or slice can
    53  // be relied upon to be 64-bit aligned.
```

Now, I see that I need to find another way to implement this small counter.
Funny that I just want to sum two integers 🙀

Then, navigating in the issue details, I discovered this article about
[Type Alignment Guarantees](https://go101.org/article/memory-layout.html), the memory layout, which makes me learn many low-level things.

Wow! I'm not going that far if I cannot change this counter to make it run.

Let's go! If you checked the previous post, you'll see this `Counter` with a bit sized alignment that makes it possible to use `AddUInt64` without failures:

Here are the most important changes to make tsbs run with ARM 32bits environment:

```go
// Some hacks to run on ARM 32 bits platforms
// see: https://go101.org/article/memory-layout.html
type Counter struct {
       x [15]byte // instead of "x uint64"
}

func (c *Counter) xAddr() *uint64 {
       // The return must be 8-byte aligned.
       return (*uint64)(unsafe.Pointer(
               (uintptr(unsafe.Pointer(&c.x)) + 7) / 8 * 8))
}

func (c *Counter) Add(delta uint64) {
       p := c.xAddr()
       atomic.AddUint64(p, delta)
}

func (c *Counter) Value() uint64 {
       return atomic.LoadUint64(c.xAddr())
}
```
Now we need to change CommonBenchmarkRunner to use our Counter instead of
`uint64` for the `metricCnt` and `rowCnt`.

```diff
 // CommonBenchmarkRunner is responsible for initializing and storing common
 // flags across all database systems and ultimately running a supplied Benchmark
 type CommonBenchmarkRunner struct {
        BenchmarkRunnerConfig
-       metricCnt      uint64
-       rowCnt         uint64
+       metricCnt      Counter
+       rowCnt         Counter
        initialRand    *rand.Rand
        sleepRegulator insertstrategy.SleepRegulator
 }
 ```

Later, in the call, we use the `.Add` method that do the bit alignment between
the 32 and 64 bits parity:

 ```diff
 @@ -245,8 +267,8 @@ func (l *CommonBenchmarkRunner) work(b targets.Benchmark, wg *sync.WaitGroup, c
        for batch := range c.toWorker {
                startedWorkAt := time.Now()
                metricCnt, rowCnt := proc.ProcessBatch(batch, l.DoLoad)
-               atomic.AddUint64(&l.metricCnt, metricCnt)
-               atomic.AddUint64(&l.rowCnt, rowCnt)
+               l.metricCnt.Add(metricCnt)
+               l.rowCnt.Add(rowCnt)
                c.sendToScanner()
                l.timeToSleep(workerNum, startedWorkAt)
```

And, then we just need to use `.Value()` to rescue the uint64 value again.

```diff
@@ -268,12 +290,12 @@ func (l *CommonBenchmarkRunner) timeToSleep(workerNum uint, startedWorkAt time.T

 // summary prints the summary of statistics from loading
 func (l *CommonBenchmarkRunner) summary(took time.Duration) {
-       metricRate := float64(l.metricCnt) / took.Seconds()
+       metricRate := float64(l.metricCnt.Value()) / took.Seconds()
        printFn("\nSummary:\n")
-       printFn("loaded %d metrics in %0.3fsec with %d workers (mean rate %0.2f metrics/sec)\n", l.metricCnt, took.Seconds(), l.Workers, metricRate)
-       if l.rowCnt > 0 {
-               rowRate := float64(l.rowCnt) / float64(took.Seconds())
-               printFn("loaded %d rows in %0.3fsec with %d workers (mean rate %0.2f rows/sec)\n", l.rowCnt, took.Seconds(), l.Workers, rowRate)
+       printFn("loaded %d metrics in %0.3fsec with %d workers (mean rate %0.2f metrics/sec)\n", l.metricCnt.Value(), took.Seconds(), l.Workers, metricRate)
+       if l.rowCnt.Value() > 0 {
+               rowRate := float64(l.rowCnt.Value()) / float64(took.Seconds())
+               printFn("loaded %d rows in %0.3fsec with %d workers (mean rate %0.2f rows/sec)\n", l.rowCnt.Value(), took.Seconds(), l.Workers, rowRate)
        }
 }
```

Now, after compiling it again, it's time to see it in action.

## tsbs_load results

First thing to remind here is that I'm going to do a few tests scenarios here:

1. Run tsbs and PostgreSQL inside the same Raspberry PI
2. Run tsbs from my Macbook and PostgreSQL on Raspberry PI using my local
   network

### Running TSBS directly inside the Raspberry PI

In the Raspberry PI console, go to `tsbs` folder and run:

```
./bin/tsbs_load load timescaledb --config config.yaml

Using config file: config.yaml
time,per. metric/s,metric total,overall metric/s,per. row/s,row total,overall row/s
1621732292,119996.91,1.200000E+06,119996.91,11999.69,1.200000E+05,11999.69
1621732302,120001.86,2.400000E+06,119999.39,12000.19,2.400000E+05,11999.94
1621732312,139997.19,3.800000E+06,126665.39,13999.72,3.800000E+05,12666.54
1621732322,139998.06,5.200000E+06,129998.57,13999.81,5.200000E+05,12999.86
1621732332,129821.72,6.500000E+06,129963.16,12982.17,6.500000E+05,12996.32
1621732342,120168.22,7.700000E+06,128332.96,12016.82,7.700000E+05,12833.30
1621732352,119854.13,8.900000E+06,127120.44,11985.41,8.900000E+05,12712.04

Summary:
loaded 9999990 metrics in 79.997sec with 2 workers (mean rate 125004.61 metrics/sec)
loaded 999999 rows in 79.997sec with 2 workers (mean rate 12500.46 rows/sec)
```

Not bad! 1M rows in 80 seconds!

### Running tsbs from an external machine

Let's try to move to outside of the Raspberry PI just to not have
the overload of `tsbs_load` and configure it to insert in my Raspberry PI
from my local network.

Sharing a bit of my setup, I'm running it from my Macbook that is connected via
wi-fi to a modem and the Raspberry PI is connected via cable in the modem.

```
scp -r jonatas@rpi-cable:~/go/src/github.com/timescale/tsbs/config.yaml ./
```

Now I'll change the `host` from `0.0.0.0` to `rpi-cable` that is mapping the
actual IP via `/etc/hosts`.

Also change the `config.yaml` file host to the `rpi-cable` name.

```yaml
  host: rpi-cable
```

Running:

```
./bin/tsbs_load load timescaledb --config /tmp/config.yaml
Using config file: /tmp/config.yaml
time,per. metric/s,metric total,overall metric/s,per. row/s,row total,overall row/s
1621733399,129933.24,1.300000E+06,129933.24,12993.32,1.300000E+05,12993.32
1621733409,230105.42,3.600000E+06,179994.99,23010.54,3.600000E+05,17999.50
1621733419,210010.39,5.700000E+06,189999.61,21001.04,5.700000E+05,18999.96
1621733429,209999.13,7.800000E+06,194999.50,20999.91,7.800000E+05,19499.95

Summary:
loaded 9999990 metrics in 48.649sec with 4 workers (mean rate 205553.49 metrics/sec)
loaded 999999 rows in 48.649sec with 4 workers (mean rate 20555.35 rows/sec)
```

Much better! 1M rows in 48 seconds!

When we do benchmarks at Timescale, we generally setup two machines in the cloud
to guarantee we'll not have interference of any process and have only the main
Postgres process running. As I'm just having fun in the weekend, I was curious
about understanding the load of `tsbs` and the interference in a small hardware.

In this case the interference is pretty clear, getting 60% more performance
after removing the competition between tsbs and the PostgreSQL working on
loading the data.

## tsbs_queries results

Trying to run tsbs queries from the Raspberry will force me to change all the
code to work with the new counter and I see it will not be a good idea, so
let's run only from the outside, which seems closer to a real server scenario.

I love to use the [full_minicycle_timescaledb](https://github.com/timescale/tsbs/blob/master/scripts/full_cycle_minitest/full_cycle_minitest_timescaledb.sh)
script that is the shortest path to have a full scenario of loading + using several queries over the DB.

Here is the command to run:

```
env HOST=rpi-cable PASSWORD=password ./full_cycle_minitest_timescaledb.sh
```
I hacked the first line of the bash script to be `bash -x` to expose all commands used in the script. So, first, it generates a lot of data:

```
+ mkdir -p /tmp/bulk_data
+ tsbs_generate_data --format timescaledb --use-case cpu-only --scale 4 --seed 123 --file /tmp/bulk_data/timescaledb_data
+ tsbs_generate_queries --queries=1000 --format timescaledb --use-case cpu-only --scale 4 --seed 123 --query-type lastpoint --file /tmp/bulk_data/timescaledb_query_lastpoint
TimescaleDB last row per host: 1000 points
+ tsbs_generate_queries --queries=1000 --format timescaledb --use-case cpu-only --scale 4 --seed 123 --query-type cpu-max-all-1 --file /tmp/bulk_data/timescaledb_query_cpu-max-all-1
TimescaleDB max of all CPU metrics, random    1 hosts, random 8h0m0s by 1h: 1000 points
+ tsbs_generate_queries --queries=1000 --format timescaledb --use-case cpu-only --scale 4 --seed 123 --query-type high-cpu-1 --file /tmp/bulk_data/timescaledb_query_high-cpu-1
TimescaleDB CPU over threshold, 1 host(s): 1000 points
```

The next step loads a short amount of metrics to test the inserts as we did before with the `tsbs_load` command, but using the YAML config. It also accepts command line parameters:

```
+ tsbs_load_timescaledb --pass=password '--postgres=sslmode=disable port=5432' --db-name=benchmark --host=rpi-cable --user=postgres --workers=1 --file=/tmp/bulk_data/timescaledb_data
time,per. metric/s,metric total,overall metric/s,per. row/s,row total,overall row/s

Summary:
loaded 345600 metrics in 5.844sec with 1 workers (mean rate 59134.26 metrics/sec)
loaded 34560 rows in 5.844sec with 1 workers (mean rate 5913.43 rows/sec)
```

And then it starts loading the queries part with previously generated queries:

```
+ tsbs_run_queries_timescaledb --max-rps=0 --hdr-latencies=0rps_timescaledb_query_lastpoint.hdr --pass=password '--postgres=sslmode=disable port=5432' --db-name=benchmark --hosts=rpi-cable --user=postgres --workers=1 --max-queries=1000 --file=/tmp/bulk_data/timescaledb_query_lastpoint
After 100 queries with 1 workers:
Interval query rate: 62.68 queries/sec	Overall query rate: 62.68 queries/sec
TimescaleDB last row per host:
min:     5.10ms, med:     6.51ms, mean:    15.93ms, max:  209.67ms, stddev:    24.06ms, sum:   1.6sec, count: 100
all queries                  :
min:     5.10ms, med:     6.51ms, mean:    15.93ms, max:  209.67ms, stddev:    24.06ms, sum:   1.6sec, count: 100
...
Run complete after 1000 queries with 1 workers (Overall query rate 61.99 queries/sec):
TimescaleDB last row per host:
min:     4.42ms, med:     6.75ms, mean:    16.05ms, max:  209.67ms, stddev:    17.46ms, sum:  16.1sec, count: 1000
all queries                  :
min:     4.42ms, med:     6.75ms, mean:    16.05ms, max:  209.67ms, stddev:    17.46ms, sum:  16.1sec, count: 1000
Saving High Dynamic Range (HDR) Histogram of Response Latencies to 0rps_timescaledb_query_lastpoint.hdr
wall clock time: 16.185718sec
+tsbs_run_queries_timescaledb --max-rps=0 --hdr-latencies=0rps_timescaledb_query_cpu-max-all-1.hdr --pass=password '--postgres=sslmode=disable port=5432' --db-name=benchmark --hosts=rpi-cable --user=postgres --workers=1 --max-queries=1000 --file=/tmp/bulk_data/timescaledb_query_cpu-max-all-1
After 100 queries with 1 workers:
```

Note the second line in this previous output:

**TimescaleDB last row per host:**

So, the [query](https://github.com/timescale/tsbs/blob/1ac5e93c6758979e5a25de92eaafddc0c4612e5b/cmd/tsbs_generate_queries/databases/timescaledb/devops.go#L218-L231
) is checking something like:

```
SELECT DISTINCT ON (hostname) * FROM CPU ORDER BY hostname, time DESC
```

Continuing to the following query:

**TimescaleDB max of all CPU metrics, random    1 hosts, random 8h0m0s by 1h:**

```
Interval query rate: 12.76 queries/sec	Overall query rate: 12.76 queries/sec
TimescaleDB max of all CPU metrics, random    1 hosts, random 8h0m0s by 1h:
min:    47.42ms, med:    71.53ms, mean:    78.32ms, max:  186.71ms, stddev:    27.65ms, sum:   7.8sec, count: 100
...
Run complete after 1000 queries with 1 workers (Overall query rate 12.09 queries/sec):
TimescaleDB max of all CPU metrics, random    1 hosts, random 8h0m0s by 1h:
min:    44.31ms, med:    78.26ms, mean:    82.71ms, max:  836.25ms, stddev:    38.17ms, sum:  82.7sec, count: 1000
wall clock time: 82.804588sec
```


**TimescaleDB CPU over threshold, 1 host(s):**

```
+ tsbs_run_queries_timescaledb --max-rps=0 --hdr-latencies=0rps_timescaledb_query_high-cpu-1.hdr --pass=password '--postgres=sslmode=disable port=5432' --db-name=benchmark --hosts=rpi-cable --user=postgres --workers=1 --max-queries=1000 --file=/tmp/bulk_data/timescaledb_query_high-cpu-1
After 100 queries with 1 workers:
Interval query rate: 11.28 queries/sec	Overall query rate: 11.28 queries/sec
TimescaleDB CPU over threshold, 1 host(s):
min:    23.80ms, med:    84.60ms, mean:    88.61ms, max:  235.81ms, stddev:    41.83ms, sum:   8.9sec, count: 100
...
After 400 queries with 1 workers:
Run complete after 1000 queries with 1 workers (Overall query rate 15.51 queries/sec):
TimescaleDB CPU over threshold, 1 host(s):
min:    21.90ms, med:    57.68ms, mean:    64.47ms, max:  942.30ms, stddev:    40.32ms, sum:  64.5sec, count: 1000
Saving High Dynamic Range (HDR) Histogram of Response Latencies to 0rps_timescaledb_query_high-cpu-1.hdr
wall clock time: 64.562662sec
```

As we can see, a simple Raspberry Pi can give us some good insights into how powerful is TimescaleDB even running on small hardware.

Just kidding, this is just my initial attempts with low a small set to see how
small and accessible hardware can be working with all these great technologies.

The speed seems to be reasonably good to 4 cores of 1.2Ghz and 1GB of RAM.

That's all for Saturday night hacking! Thanks for reading 🤗


