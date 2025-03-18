---
title: "Programming is a Drug: How AI Amplified My 20-Year Coding Addiction"
layout: post
categories: ['personal', 'technical', 'ai', 'tools']
description: "After two decades as a programmer, I've watched my productivity skyrocket 5x with AI tools. The dopamine hits are stronger than ever, and I'm not sure that's entirely a good thing."
---

Yes, one of the most potent substances I've ever used.

I have to admit it: I'm addicted to programming.

Working with code is pleasant. Completing tasks brings an amazing feeling of accomplishment and relief.

For so long, I tried to pretend it was just a developer's passion, but no: **I'm completely hooked**.

And worse, when I'm spending hours with quality code, I can't let go. I stay up all night "on the trip."

Even worse is when things don't work as expected. That's when it becomes most addictive. It's all too easy to see the sunrise when I'm debugging :)

After the LLM era, my productivity has increased 5x, but my ability to disconnect has decreased proportionally.

## The Arrival of New Substances

In 2016, when I wrote the [original version](/programar-e-uma-droga) of this post, it was already difficult to stop coding. But now, in March 2025, with the arrival of AI tools, it's as if we've discovered coding's equivalent of methamphetamine.

**The Cursor editor and its AI assistants make me feel like I have superpowers.**

What used to take hours to implement, I can now do in minutes. It's like having a pair programming partner available 24 hours a day.

Just imagine the sensation:
- Write a thought in natural language
- Watch it transform into functional code right before your eyes
- Ask for explanations about complex parts and receive clear answers
- Refactor old code with just a few commands

This isn't just programming - it's programming augmented by artificial intelligence. A completely new and even more addictive experience.

## The "Just One More Feature" Syndrome

When I started, I thought it would be easy to quit and that it was just a phase.

Young guy, full of energy, but no: Years down the road, even with my wife and child waiting, I'm still the same:

Waiting for the family to go to sleep so I can get one more coding fix.

And now, with Cursor, I always have the feeling that I can do "just one more little thing" before bed. The speed at which I can solve problems has made the programming experience even more immersive.

## The Paradox of AI-Enhanced Productivity

Here's where it gets interesting: my output has increased dramatically, but my standards have too. What previously felt like a productive day now feels insufficient.

Last week, I built an entire authentication system with OAuth, JWT handling, and role-based permissions in under 3 hours - something that would have taken me days before. Yet somehow, I felt like I should have done more.

The dopamine release I get from completing a task has been normalized. I need bigger hits now.

## Refactoring with a Single Command

One of the things that makes modern tools most addictive is how easy refactoring has become. With Cursor and AI assistants like Claude, I can:

- Explain in plain English what I want to change
- See intelligent suggestions on how to improve my code
- Apply complex changes with just a few commands
- Find bugs before even running the code

It's like having a reviewer, a mentor, and a pair programmer, all at the same time.

Here's a real example from yesterday. I needed to refactor a React component that had grown unwieldy. I simply typed:

"Refactor this component to use React hooks and split it into smaller functional components"

The AI did in 2 minutes what would have taken me an hour manually. The result? Clean, modern code with proper separation of concerns.

## Exploring Code at High Speed

Code navigation has also gained superpowers. With semantic searches and context understanding, I can:

- Find relevant parts of the code just by explaining what I'm looking for
- Understand new codebases much faster
- Navigate between related files without losing context
- Discover patterns that would be difficult to notice manually

I recently had to understand a 50,000 LOC codebase I'd never seen before. With traditional tools, this would have been a week-long process. With AI-assisted exploration, I had a working mental model in 4 hours.

## The Dark Side of Augmented Coding

This increased productivity comes with costs:

1. **Skill atrophy**: I've noticed my ability to solve complex algorithmic problems without assistance has declined.

2. **Dependency**: When GitHub had an outage last month affecting my AI tools, my productivity dropped by ~70%.

3. **Attention fragmentation**: I context-switch more frequently now, which impacts deep work.

4. **Ethical blurring**: I sometimes find myself using AI to generate code I don't fully understand.

## The Dose is Getting Stronger

The improvements I've made to my website in recent months have also been powered by these new tools. From enhanced syntax highlighting to automatic post categorization systems - everything became easier with AI assistance.

Check out this code I implemented to suggest categories for posts based on content:

```javascript
// Before AI tools (2023):
function suggestCategories(post) {
  const keywords = {
    technical: ['code', 'programming', 'development', 'software'],
    personal: ['life', 'experience', 'journey', 'reflection'],
    // Basic keyword matching - required constant manual updates
  };
  
  // Simple string matching - prone to false positives
  return Object.entries(keywords).reduce((matches, [category, terms]) => {
    if (terms.some(term => post.content.includes(term))) {
      matches.push(category);
    }
    return matches;
  }, []);
}

// After AI tools (2025):
function suggestCategories(post) {
  // Use embedded vector similarity to match content to category clusters
  const contentEmbedding = generateEmbedding(post.content);
  
  return categoryVectors
    .map(category => ({
      name: category.name,
      score: cosineSimilarity(contentEmbedding, category.vector)
    }))
    .filter(match => match.score > 0.75)
    .sort((a, b) => b.score - a.score)
    .map(match => match.name);
}
```

The code above shows how my approach to even simple problems has fundamentally changed. I'm implementing solutions that would have seemed unreachable to me just a few years ago.

## The Industry-Wide Shift

I'm not alone in this transformation. Last week I just met a guy that built a full product without any programming knowledge. He was even talking engineering linguo and explaining all his stack like a developer. Junior and Low Code developers are shipping features that would have required seniors before.

The productivity gap between augmented developers and traditional ones is becoming unsustainable.

For a 10x developer, AI tools might create a 20-30x advantage. For average developers, we might see a 5-10x improvement. This shift is fundamentally altering the economics of software development.

## There's No Cure Anymore

If I was addicted to programming before, now with all these AI tools like GPT, Claude, and the Cursor editor, my condition has only worsened.

The sensation of solving complex problems, creating new features, and automating processes has been elevated to another level.

And you know what the best part is? Seeing all this code executing, solving real problems, making systems more efficient.

So there it is: I confess that I'm addicted to programming. And now, with AI as my copilot, I'm in the worst phase of this addiction - and I don't want treatment.

**Programming is a drug. And with AI, the dose is even more potent.**

But I wonder: as we optimize for these dopamine hits and superhuman productivity, what aspects of the craft are we losing? When the tools can think for us, what becomes of the thinking programmer?

I don't have the answers. All I know is that tomorrow, I'll wake up, open my editor, and chase that high once more.
