---
layout: post
title: "My First Time with Claude Worktrees"
categories: ['programming', 'ai', 'tools', 'claude']
tags: ['claude', 'claude-code', 'git', 'worktrees', 'productivity']
description: "First impressions of using Claude Code's worktree isolation feature — running AI agents in isolated git branches without touching your working directory."
image: /images/claude-worktrees-containment-dome.png
---

I just used Claude worktrees for the first time and I'm still buzzing from it.

I ran `claude --worktree my-feature` on a project, and something clicked. A
temporary branch, an isolated copy of my repo, the agent working freely without
touching anything in my main working directory.

That hit different.

## What's a git worktree?

A git worktree lets you check out multiple branches simultaneously in separate
directories — without cloning the repo again. Each worktree shares the same
`.git` history but has its own working tree. So you can have:

```
~/code/myproject/                        ← main working directory (master)
~/code/myproject/.claude/worktrees/my-feature/  ← isolated branch
```

Both pointing to the same git history. Both independent of each other.

### How git stores this

Your main repo has a `.git/` directory that contains everything — objects,
refs, config, HEAD. When you add a worktree, git does something elegant:

```bash
git worktree add .claude/worktrees/my-feature -b my-feature
```

This creates a new directory with a `.git` **file** (not a directory) that
just points back to the main `.git`:

```
.claude/worktrees/my-feature/.git  →  ../../.git/worktrees/my-feature
```

Inside `.git/worktrees/my-feature/` git stores the worktree-specific state:

```
.git/worktrees/my-feature/
  HEAD          ← which branch this worktree is on
  index         ← the staging area for this worktree
  gitdir        ← pointer back to the worktree directory
```

The key insight: **all worktrees share the same object store**. Commits,
blobs, trees — all deduped in `.git/objects/`. You never copy files. You
just get a new working tree and a new HEAD pointer. It's cheap.

You can inspect all your active worktrees at any time:

```bash
git worktree list
# /Users/jonatas/code/myproject              abc1234 [master]
# /Users/jonatas/code/myproject/.claude/worktrees/my-feature  def5678 [my-feature]
```

### The constraint that makes it safe

Git enforces that **no two worktrees can check out the same branch simultaneously**.
If you try, you get an error:

```
fatal: 'master' is already checked out at '/Users/jonatas/code/myproject'
```

This is intentional. It prevents two working trees from modifying the same
branch's index independently and stepping on each other. Each branch belongs
to exactly one working tree at a time.

This is also what makes worktrees safe for AI agents — Claude gets its own
branch, its own index, its own HEAD. It cannot accidentally commit to yours.

### Cleanup

When done, removing a worktree is clean:

```bash
git worktree remove .claude/worktrees/my-feature
# or to force-remove with uncommitted changes:
git worktree remove --force .claude/worktrees/my-feature
```

Git prunes the `.git/worktrees/my-feature/` metadata automatically. The branch
itself stays around until you delete it — which is the right default, since you
probably want to review or merge it first.

I've known about `git worktree` for years but rarely used it manually. It always
felt like extra ceremony. "I'll just stash and switch." Then forget to unstash.
Then wonder why things are broken. You know how it goes.

## Claude + worktrees = genuinely useful isolation

Claude Code's Agent tool has an `isolation: "worktree"` mode. When you launch
an agent with that flag, it:

1. Creates a fresh git worktree in a temp directory
2. Runs the agent entirely inside that isolated copy
3. If the agent makes no changes → worktree is automatically cleaned up
4. If the agent makes changes → you get the worktree path and branch back to review

The practical upshot: you can let an AI agent explore, edit, and experiment in
your codebase without any risk to your current work. Your uncommitted changes
stay untouched. Your stash stays empty. Nothing weird bleeds through.

This is exactly the kind of isolation I always wanted but never had the discipline
to set up manually.

## The experience

What surprised me most was how natural it felt. I didn't have to configure
anything. I just used `claude --worktree my-feature` and it worked.

If you use `claude --worktree` it will create the git worktree for you on
`.claude/worktrees`. Then, inside the folder will be the `my-feature` folder.

Which is a great convenience. So if you go to `.claude/worktrees/my-feature`,
you just need to symlink your `.env` and you're good to go:

```bash
cd .claude/worktrees/my-feature
ln -s ../../.env .env
```

From there, everything runs as normal — same codebase, same history, isolated
branch. You can start the app, run tests, let Claude do its thing, all without
touching your main working directory.

There's something psychologically freeing about this. When I know an agent is
working in isolation, I'm more willing to let it go further, explore more,
try things. The blast radius is contained. I trust the experiment more.

## Why this matters for AI-assisted development

We're in a moment where AI agents are getting capable enough to do real work on
real codebases. But that capability comes with real risk — an agent that can
edit files can also mess things up.

Worktree isolation threads that needle. You get the capability without giving up
control. The agent works freely; you review the diff before anything lands on
your branch.

It's the same principle as code review, really. You wouldn't push directly to
production without review. Why let an AI agent write directly to your working
directory without one?

```
git worktree add .worktrees/experiment -b ai/experiment-xyz
# agent works here
git diff master...ai/experiment-xyz
# merge or discard
git worktree remove .worktrees/experiment
```

Claude just automates that whole flow transparently.

## What I'd love to see next

I'm already imagining workflows where I keep a persistent worktree for long-running
agent tasks — like "refactor this module" — while I keep working on other things
in the main branch. Two parallel tracks. Agent and human, each with their own
checkout, merging when ready.

Or running multiple isolated agents in parallel on different hypotheses and
comparing the diffs. "Try three approaches to this performance problem, show me
the results."

That's not science fiction. That's basically what the worktree primitive enables
right now, manually. Claude just needs to get a bit more autonomous about managing
them.

## First impressions

Honestly? I resisted learning and understanding the way it works. The isolation makes the collaboration
feel less risky and more like a real workflow — not a YOLO experiment.

It also lets your mind keep working on these parallel ideas. As a master of
useless approaches, I loved this!

Happy hacking!
