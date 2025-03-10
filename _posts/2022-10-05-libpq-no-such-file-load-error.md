---
title: "Load error - libpq no such file"
layout: post
description: "This week I was updating my [TimescaleDB extension][1] locally on my Macbook M1, and it seems I broke other stuff as I ended up in a recursive upgrade of ext..."
---
This week I was updating my [TimescaleDB extension][1] locally on my Macbook M1, and it seems I broke other stuff as I ended up in a recursive upgrade of extra tools.

I end up facing the following error:

    Library not loaded: '/usr/local/opt/postgresql/lib/libpq.5.dylib' (LoadError)

Basically, TimescaleDB 2.8 brew formula [needs the postgresql@14][2] version.
Postgres 14 version used the latest homebrew using the latest Apple Development Utilities, forcing me to restart my computer and wait for 20 minutes to finally release it.

After everything was fresh and new, my application stopped working.

As the code depends on ActiveRecord using Postgresql and a new version was built, the old version links were not available anymore.

Here is the entire error message:

```
/.../.rbenv/versions/.../lib/ruby/gems/.../gems/pg-1.4.3/lib/pg.rb:49:in `require': dlopen(/Users/jonatasdp/.rbenv/versions/.../lib/ruby/gems/.../gems/pg-1.4.3/lib/pg_ext.bundle, 0x0009): Library not loaded: '/usr/local/opt/postgresql/lib/libpq.5.dylib' (LoadError)
  Referenced from: '.../.rbenv/versions/.../lib/ruby/gems/.../gems/pg-1.4.3/lib/pg_ext.bundle'
  Reason: tried: '/usr/local/opt/postgresql/lib/libpq.5.dylib' (no such file), '/usr/local/lib/libpq.5.dylib' (no such file), '/usr/lib/libpq.5.dylib' (no such file), '/usr/local/Cellar/postgresql@14/14.5_5/lib/libpq.5.dylib' (no such file), '/usr/local/lib/libpq.5.dylib' (no such file), '/usr/lib/libpq.5.dylib' (no such file) - /.../.rbenv/versions/.../lib/ruby/gems/.../gems/pg-1.4.3/lib/pg_ext.bundle
```

## Solution to fix libpq no such file on Mac

To solve the issue, I just reinstalled the gem pg.

    gem install pg


Ready! It's back to work!

If the previous command still does not work for you, try to reinstall it:

    gem uninstall pg
    gem install pg

If it is still not working, try to reinstall libpq:

    brew install libpq
    gem install pg -- --with-pg-config=/usr/local/opt/libpq/bin/pg_config

If you're fighting with dependencies, you're not alone! Check [this StackOverflow issue][3] for more details.

Happy coding!

[1]: https://github.com/timescale/timescaledb
[2]: https://github.com/timescale/homebrew-tap/pull/24
[3]: https://stackoverflow.com/questions/3116015/how-to-install-postgresqls-pg-gem-on-ubuntu

