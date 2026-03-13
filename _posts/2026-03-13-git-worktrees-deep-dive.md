---
layout: post
title: "Git Worktrees: What They Actually Are and Why They Beat Stashing"
categories: ['programming', 'tools', 'git']
tags: ['git', 'worktrees', 'workflow', 'productivity']
description: "A ground-up look at git worktrees — how they store state, what they cost, and why they replace the stash-switch-unstash loop you've been living with."
image: /images/git-worktrees.png
mermaid: true
---

This is a follow-up to my [post on Claude Code's worktree isolation](/claude-worktrees). That post
was about the *experience*. This one is about the *mechanics*. If you've ever wondered what a
worktree actually *is* — not the pitch, but the internals — read on.

I ran every command in this post for real. The output is actual output.

## The problem worktrees solve

You're deep in a feature. Files modified, half-committed, brain in the zone. Then someone drops
a message: "urgent bug in production, can you look?"

Here's what you do if you don't know about worktrees:

```bash
git stash
git checkout main
git checkout -b hotfix/urgent-bug
# fix the bug
git commit -m "fix: urgent bug"
git checkout main
git merge hotfix/urgent-bug
git stash pop
```

That last step is where it falls apart. The stash pop can conflict with the merge result.
I ran exactly this scenario to show you what happens:

```bash
$ git stash
Saved working directory and index state WIP on main: 9ad49c8 add lib.rb

$ git merge hotfix/urgent-bug
Fast-forward
 app.rb | 1 +
 1 file changed, 1 insertion(+)

$ git stash pop
Auto-merging app.rb
CONFLICT (content): Merge conflict in app.rb
```

Even on a trivial file with no real conflict, git can't reconcile the stash over the merge. Now
you're debugging a conflict that didn't exist before you tried to be careful. This is the stash
trap — it feels safe going in, and it bites you coming out.

## What a worktree actually is

A git repo has one `.git/` directory containing everything: object store, refs, HEAD, config.
Normally you get one working tree — the files on disk that correspond to your current branch.

A worktree gives you a second (or third, or fourth) working tree pointing at the same `.git`.
Each worktree has its own:

- `HEAD` — which branch it's on
- `index` — its own staging area
- working directory — its own files on disk

But they all share the same object store. No copying. No re-downloading. Just new pointers.

{% mermaid %}
graph TD
    subgraph shared[".git/"]
        OBJ["objects/\ncommits · blobs · trees"]
        META["worktrees/hotfix/\nHEAD · index · gitdir"]
    end

    MAIN["~/project/\nHEAD: main"]
    HOTFIX[".worktrees/hotfix/\nHEAD: hotfix/urgent-bug\n.git → pointer"]

    MAIN --> OBJ
    HOTFIX -->|".git file"| META
    META --> OBJ
{% endmermaid %}

### Creating one

The command takes a path and, optionally, `-b` to create a new branch at that worktree:

```bash
$ git worktree add .worktrees/hotfix -b hotfix/urgent-bug
Preparing worktree (new branch 'hotfix/urgent-bug')
HEAD is now at 9ad49c8 add lib.rb

$ git worktree list
/private/tmp/wt-demo                    9ad49c8 [main]
/private/tmp/wt-demo/.worktrees/hotfix  9ad49c8 [hotfix/urgent-bug]
```

Without `-b`, git checks out an existing branch into the new worktree. With `-b`, it creates a
fresh branch first — so the worktree starts clean from your current commit, on a branch that's
yours to mess with.

Think about it as a shortcut directory to another branch you need to work in parallel.

Two working directories. Two branches. One `.git`. And critically — my uncommitted changes in
`main` are completely untouched:

```bash
$ cat app.rb
app.rb content v1
uncommitted work in progress    ← still here

$ cat .worktrees/hotfix/app.rb
app.rb content v1               ← clean, from last commit
```

The worktree starts from the last commit, not from your dirty working directory. This is the key
insight: you never have to stash anything. Your work-in-progress just stays where it is.

### How git stores the worktree

When you add a worktree, git does two things:

**1. Creates a `.git` file (not directory) in the worktree:**

```bash
$ file .worktrees/hotfix/.git
.worktrees/hotfix/.git: ASCII text

$ cat .worktrees/hotfix/.git
gitdir: /private/tmp/wt-demo/.git/worktrees/hotfix
```

It's a pointer. Not a full git repo — just a path back to the main `.git`. This is why the
worktree directory is tiny:

```
212K    .git/               ← main repo
 16K    .worktrees/hotfix   ← worktree (just files + a pointer)
108K    ../wt-clone/.git    ← a full clone for comparison
```

A clone duplicates the entire object store. A worktree costs almost nothing.

**2. Creates metadata under `.git/worktrees/`:**

```bash
$ ls .git/worktrees/hotfix/
COMMIT_EDITMSG  HEAD  ORIG_HEAD  commondir  gitdir  index  logs/  refs/

$ cat .git/worktrees/hotfix/HEAD
ref: refs/heads/hotfix/urgent-bug
```

This is where git tracks the worktree-specific state: which branch it's on, its own index,
its own reflog. The worktree's `.git` file points here; this directory points back to the
worktree. A bidirectional link.

### The one-branch-per-worktree rule

Git enforces that no two active worktrees can be on the same branch simultaneously:

```bash
$ git worktree add .worktrees/hotfix2 hotfix/urgent-bug
fatal: 'hotfix/urgent-bug' is already used by worktree at
'/private/tmp/wt-demo/.worktrees/hotfix'
```

This isn't a limitation — it's a safety guarantee. Two worktrees on the same branch would have
independent indexes, so they could create divergent staging states that git can't reconcile.
The constraint is what makes worktrees safe.

### Working in the worktree

From the worktree directory, everything behaves like a normal git repo:

```bash
$ cd .worktrees/hotfix
$ echo "bug fix applied" >> app.rb
$ git add . && git commit -m "fix: urgent bug"
[hotfix/urgent-bug b19ba6f] fix: urgent bug

$ git log --oneline
b19ba6f fix: urgent bug
9ad49c8 add lib.rb
```

Back in the main directory — nothing changed:

```bash
$ cd /tmp/wt-demo
$ git log --oneline
9ad49c8 add lib.rb     ← hotfix commit is not here yet
2d045f8 add app.rb
```

The branches diverged the moment you committed in the worktree. Now you can merge when you're
ready — not when git forces you to.

### Cleanup

```bash
$ git worktree remove .worktrees/hotfix
$ git worktree list
/private/tmp/wt-demo  b19ba6f [main]
```

Git removes the worktree directory and cleans up `.git/worktrees/hotfix/` automatically. The
branch stays — it's yours to merge or delete when you're done reviewing.

You can also reattach a branch to a new worktree later:

```bash
$ git worktree add .worktrees/hotfix hotfix/urgent-bug
Preparing worktree (checking out 'hotfix/urgent-bug')
```

The worktree and the branch are independent objects. The worktree is just a checkout location.

## Worktrees vs everything else

Here's the honest comparison:

| Approach | Your WIP | Context switch | Risk |
|---|---|---|---|
| `git stash` | Hidden in reflog | Manual stash/pop | Conflicts on pop |
| New branch + `git switch` | Modified files stay | Must be clean first | Easy to forget |
| `git clone` | Untouched | Full repo copy | Wastes disk, no shared history |
| `git worktree` | Untouched | Instant, parallel | None |

`git stash` works for quick one-minute switches. It breaks down when the switch takes longer than
expected, when you stash multiple times, or when the thing you merged conflicts with what you
stashed. Everyone has lost work or time to the stash at some point.

`git switch` (or `checkout`) requires a clean working directory. If you have modified tracked
files, git refuses or warns. You end up stashing anyway — back to the same problem.

`git clone` gives you a fresh directory, but it's a full copy. Object store, history, remote
refs — all duplicated. Then you need to keep both in sync manually. It's workaround, not workflow.

Worktrees are the only approach where your main working directory is genuinely untouched and the
new context is immediately available at a fixed path, for almost no cost.

## What it actually costs

The object store — all the blobs, trees, and commits — is shared. What you pay for per worktree:

- A working copy of the files at the checked-out commit (~= size of your working tree)
- A small metadata directory under `.git/worktrees/` (a few KB)
- One `index` file per worktree

For a typical project, adding a worktree costs roughly the same as checking out a branch normally:
the working files plus a tiny bit of metadata. Not a clone. Not extra disk for history.

## Practical patterns

**Hotfix while keeping WIP:**

```bash
git worktree add .worktrees/hotfix -b hotfix/urgent-bug
cd .worktrees/hotfix
# fix, commit
cd ../..
git merge hotfix/urgent-bug
git worktree remove .worktrees/hotfix
```

**Review a colleague's branch without losing your place:**

```bash
git fetch origin
git worktree add .worktrees/review origin/their-branch
# open the app, run tests, look at the code
git worktree remove .worktrees/review
```

**Run two feature experiments in parallel:**

```bash
git worktree add .worktrees/approach-a -b experiment/approach-a
git worktree add .worktrees/approach-b -b experiment/approach-b
# work on both, compare diffs
git diff experiment/approach-a...experiment/approach-b
```

**For projects with `.env` or other gitignored config:**

```bash
cd .worktrees/hotfix
ln -s ../../.env .env
# everything runs as normal
```

The worktree shares git history but not gitignored files. Symlinking `.env` is a one-liner and
you're running the full app in isolation.

## The mental model shift

The stash-switch-unstash loop teaches you to think of your working state as fragile — something
to hide before doing anything risky. You become conservative about context switches. You defer
investigation because "switching now would be annoying."

Worktrees invert this. Your working state is stable. New contexts are cheap. You can work on
two things simultaneously without either affecting the other.

The filesystem becomes your interface. `.worktrees/hotfix/` is the hotfix. `.worktrees/review/`
is the review. You can have both open in different terminal tabs at the same time. Git handles
the isolation; you just navigate directories.

Once you have this model, you stop dreading interruptions.

Happy hacking!
