---
layout: post
title: "Tropical on Rails 2025: A Celebration of Ruby and PostgreSQL"
categories: ruby rails conference postgresql
image: /images/banners/tropicalonrails-2025-banner.png
---

The [Tropical on Rails 2025](https://www.tropicalonrails.com/en/) conference has wrapped up, and I'm still buzzing with excitement from this incredible gathering of the Ruby community in São Paulo! Held on April 3-4 at the Pullman Vila Olímpia hotel, this event brought together passionate Ruby and Rails developers from across Brazil and beyond.

![Audience at Tropical On Rails conference 2025](/images/tropicalonrails-2025-audience.jpg)

The energy and enthusiasm from attendees were absolutely infectious, making this one of the most memorable conference experiences I've had recently. I'd like to share some highlights from this fantastic event and the connections made during these few days of Ruby celebration.


## My PostgreSQL Performance Workshop

As a speaker who conducted a workshop the day before the conference officially began, I had the unique privilege to enjoy the conference without worrying about my talk. I was fortunate to spend quality time with fellow speakers while sharing my knowledge about PostgreSQL performance optimization for Ruby developers. In an interesting twist, despite being in my home country of Brazil, this was actually my first time presenting this workshop in English here! The room was packed with most senior developers eager to dive deep into PostgreSQL internals and optimization.

My 4-hour workshop was named "PostgreSQL Performance Workshop for Ruby Developers." This hands-on session focused on helping Ruby developers understand how Postgresql works to then easily avoid under optimized choices. Learning to benchmark and queeze maximum performance from PostgreSQL when working with Ruby applications.

We explored various topics including:

- Getting deep into Storage Layout and WAL
- Understanding and using PostgreSQL explain plans
- How TimescaleDB architectures leverage Postgresql performance.
- Comparing ORM performance (ActiveRecord vs Sequel vs OccamsRecord)

![Workshop audience at Tropical on Rails 2025](/images/tropicalonrails-2025-workshop-audience.jpg)

It was particularly special to have Cirdes Henrique, the main organizer of Tropical on Rails, drop by the workshop. His enthusiasm for building up the Ruby community in Brazil is truly inspiring. Cirdes has been a driving force behind this event, and his dedication shows in every aspect of the conference 🫶. 

![With Cirdes at Tropical on Rails 2025](/images/tropicalonrails-2025-jonatas-e-cirdes.jpeg)

## Meeting the Ruby on Rails Core Team

One of the highlights of the conference was meeting Rafael França, a key member of the Rails core team. He is an incredible humble person that is so amazing to talk with.

![With Rafael França at Tropical on Rails 2025](/images/tropicalonrails-2025-jonatas-e-rafael-franca.jpg)

Our conversation centered around validating a security improvement I'd like to bring to bundler around validating permissions on different levels of usage of libraries. Imagine that you have a library and you want to explicitly allow it to grant access to disk or network. I'd like to bring this improvement to bundler and may go deeper and start tracking what permissions each library requires for the scope of your usage.

He already opened my mind sharing about the [Linux Kernel Runtime Guard](https://lkrg.org/) which is in my list to explore 🤓

## Community Discussions

During the event, I had the opportunity to chat a few times with Rosa, main developer of the [SolidQueue](https://github.com/rails/solid_queue) gem and also a big start of the event. She went very deep into the Rails code encapsulation and how it organizes initializers and other internals that was awesome.

![With Rosa and Tim at Tropical on Rails 2025](/images/tropicalonrails-2025-jonatas-e-rosa-e-tim.jpg)

This real-life conversation felt like a podcast recording as we dove deep into Rails internals, exploring the architecture and design decisions behind SolidQueue and how it integrates with the Rails ecosystem.

Funny fact: I love the Ruby community and especially making Ruby friends. I met Rosa in Poland and mentioned I was going to visit Spain, and it matched exactly with the [Madrid.rb](https://madridrb.com/events/march-2025-intro-to-the-timescaledb-gem-1376) meetup.

## Brainstorming and Idea Validation

The conference also provided valuable opportunities for brainstorming and validating my ideas. My conversation with Vinicius Stock was particularly productive, as we talked about AST and cool stuff behind the hype of LLM + MCP and how we'll use all the power of the actual LSP to empower the MCP coverage for the Ruby community.

![With Vinicius Stock at Tropical on Rails 2025](/images/tropicalonrails-2025-jonatas-e-vinicius-stock.jpg)

One of the things I love most about conferences like Tropical on Rails is the chance to test ideas with smart, experienced developers. Vinicius provided valuable feedback on some concepts I've been considering around security in the Ruby ecosystem.

## Ruby and PostgreSQL: A Perfect Match

A particularly had a great connection with Rodrigo Serradura, where we explored the synergies between Ruby and PostgreSQL. 

![With Rodrigo Serradura at Tropical on Rails 2025](/images/tropicalonrails-2025-jonatasdp-e-rodrigo-serradura.jpeg)

I'm a big fan of Rodrigo because he leads the [ADA.rb](https://www.meetup.com/pt-BR/arquitetura-e-design-de-aplicacoes-ruby/) meetup. I've already spoken at and participated in the meetup several times.

Rodrigo and I spent a good time going deep into community engagement and how to not be the "support" of your community but encourage and build autonomy. We discussed strategies for empowering community members to take ownership and contribute their own ideas and solutions.

## Conference Highlights

The conference featured an impressive lineup of speakers covering a wide range of topics:

1. Modern front-end development with Rails using Hotwire, RubyUI, and Phlex
2. Performance optimization techniques for Ruby applications
3. Real-world case studies of Rails at scale
4. The future of Ruby and Rails in the AI era
5. Community-building and open source contribution

The mix of technical deep dives and community-focused talks created a well-rounded program that catered to both technical growth and community connection. The venue's tropical-themed decorations and the warm Brazilian hospitality created an atmosphere that perfectly balanced professionalism with the relaxed, friendly nature of the Ruby community.

## Looking Forward

As Tropical on Rails 2025 comes to a close, I'm left with a renewed appreciation for the Ruby community and excitement about the future of Rails development. The blend of technical excellence and community warmth that defines the Ruby ecosystem was on full display throughout the event.

I'll be taking the connections made and lessons learned from this conference forward into my work with PostgreSQL and TimescaleDB, and I'm already looking forward to next year's event!

If you attended Tropical on Rails 2025, I'd love to hear about your experience and the key takeaways you're implementing in your own work. Drop me a comment below or reach out on social media to continue the conversation.

And if you missed my workshop but are interested in PostgreSQL performance optimization for Ruby applications, check out the [GitHub repository](https://github.com/timescale/postgresql-performance-for-rubyists/) with all the workshop materials. 