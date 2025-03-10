---
title: "The dynamic experiment initiative"
layout: post
tags: ['fast', 'dynamic-experiments', 'ruby', 'ast']
description: "I'm having a lot of fun with automated code rewrite."
---
I'm having a lot of fun with automated code rewrite.

I'd like to create something that I can implement an experiment,
change some code and run some test to check if it's working.

I worked on a simple script to speed up the test suite automatically
replaces `create` with `build_stubbed`, and it worked. You can check the first
part of my novel in my
[Adventures on automated code replacement](https://ideia.me/adventures-on-automated-code-replacement).

Now my idea is to expand it in a set of tools that we can use to check if we
forgot something or if we can improve something, or remove some code.

So, let me list a few ideas I already worked on.

## Replace `FactoryGirl.create` with `build_stubbed`

This is a small improvement that fabricates an object but does not make it
touches in the database and make specs run faster.

## Remove extra options described in RSpec blocks

Lets imagine you're using [timecop-rspec](https://github.com/avantoss/timecop-rspec#usage)
gem and you have a case like this:

```
it 'travels but check nothing', travel: Time.new(2014, 11, 15) do
  expect(something).to be :ok
end
```

But the `travel` was forgotten there and is not being used. Then we can remove
the `travel` block and run the spec and check if it works.

```
it 'travels but check nothing' do
  expect(something).to be :ok
end
```
## Testing

If the test passes, the script can make the change official.

## Problems

My actual script replaced it with all occurrences at one time. Then, it's a bit weird
and is not so powerful because sometimes we have a few cases that can work and
others not. Ideally, it should run one change each time and check if that change
works.

Then if it works, it can do another change and check if it works.

I also did another very similar script for
[factory_girl-seeds](https://github.com/evrone/factory_girl-seeds) and in at that time
the way I was trying to automate the replacement of `FactoryGirl.create` to use
`seed` instead. It was a bit bugged because `seed` method does not support traits and
recognize extra attributes as keys for each kind of record needed.

## The engine

A tool for run code patch experiments. It should make code changes,
create some temporary spec and check if it works. Also, apply to the official code
if the spec works.

### Criteria for keep the change

The criteria should be related to keep or not keep that change. If the test
passes but it's degrading the performance, or the improvement is insignificant.

### Run a command to test the change

Every change should have a way to check if the shift was conclusively positive.

It can be:

- Run a spec
- Execute a command

One thing I found very weak in my current implementations that I was always
running the entire file and I could try to run some specs in cascade. Then I
think it should follow some directives:

- It should fail fast as possible
- It should run test changes in cascade trying to check the nearest scope first
  and then run the entire spec in a second moment to avoid big
  queries and exhaustive machine consumption with noneffective changes.

### Divide and conquer

Each experiment can use an isolated environment and without the interference of
other checks. In that way, I think we can distribute the labor to multiple
workers that can be replacing and reporting the results and even build a third
meta-experiment to check if two examples are compatible.

Example:

```
describe User, travel: '2020-02-02' do
  let(:user) { create(user, twitter: 'jonatasdp')}
  it { expect(user).to be_valid }
end
```

Lets imagine the experiments in action:

**Remove `travel`**

```
describe User do
  let(:user) { create(user, twitter: 'jonatasdp') }
  it { expect(user).to be_valid }
end
```

**Replace `create` with `build_stubbed`**

```
describe User do
  let(:user) { build_stubbed(user, twitter: 'jonatasdp') }
  it { expect(user).to be_valid }
end
```

**Remove extra parameters from FactoryGirl `create` or `build_stubbed`**

```
describe User do
  let(:user) { build_stubbed(user) }
  it { expect(user).to be_valid }
end
```

### Learning from mistakes

It can start reporting the success and failures with the current
related AST / context to try to identify some patterns to empower intelligence and make it divide and conquer algorithm to avoiding insist in non-effective replacements for some specific cases.

## Putting all things together

I think I need a bit more time before start coding. My original idea is to build
the following components:

### Experiment

- Receives the file
- Defines the rules
- Manipulates the code
- Report the experiment created

### Executor

- Executes the experiment created
- Report lessons learned
- Make the change official or build 
  successive experiment to divide and conquer multiple rules.

### Runner

Glue all parts and set up the experiments and know what files it will run.

Navigate in all the files and prepare the work to the divide and conquer with 
the experiment with the files.

