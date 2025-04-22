---
title: "Gem Permission Manifests: Enhancing Security in Ruby Ecosystem"
layout: post
categories: ['ruby', 'technical', 'security']
tags: ['ruby', 'gems', 'bundler', 'security', 'permissions']
description: "A proposal for tracking what permissions Ruby gems require, bringing more transparency and security to the ecosystem."
---

In today's increasingly security-conscious software environment, it's surprising that we still install libraries and gems without clear knowledge of what permissions they require. We wouldn't install a mobile app without reviewing its permission requests, yet we routinely give our code dependencies unchecked access to our systems.

This proposal draws inspiration from [Android's Manifest permission system](https://developer.android.com/guide/topics/manifest/manifest-intro#perms), which requires apps to explicitly declare what system resources they need access to. When installing an app from the Play Store, users can review these permission requests and make informed decisions. The Android manifest system has successfully balanced security with usability by making resource access transparent. By bringing a similar approach to the Ruby ecosystem, we can achieve the same benefits: explicit consent, better security awareness, and appropriate access controls without sacrificing developer experience.

My proposal here is: "why we don't declare manifest for all library creators and users. This idea could be useful for all programming languages.


## The Permission Problem

When we add a gem to our Ruby project, we implicitly grant it access to everything our application can access: file system, environment variables, network, shell commands, and more. This creates several issues:

1. **Security Vulnerabilities**: Malicious or compromised gems could exfiltrate data or execute harmful commands
2. **Unclear Dependencies**: We don't know what system resources a gem actually requires
3. **Over-privileged Execution**: Most gems run with far more permissions than they need
4. **Auditability Challenges**: It's difficult to audit what resources gems are accessing


## Introducing Gem Permission Manifests

What if we could explicitly define and limit what permissions each gem requires? I'm proposing a manifest system at the bundler level that would look something like this:

```ruby
# Gemfile
gem "rails", permissions: {
  rw: "/tmp", 
  env: ["DATABASE_URL", "HOST_URL"], 
  exposes_port: [4000, 4567], 
  shell: false 
}
```

Let's see some more detailed examples related to networking, where permissions can control allowed/blocked hosts, protocols, and ports (similar to Content-Security-Policy HTTP headers):

```ruby
gem "pg", permissions: {
  rw: false,
  env: ["DATABASE_URL"],
  network: :postgresql
}

gem "faraday", permissions: {
  network: {
    allow: [
      %r{https://api\.example\.com}, 
      %r{https://.*\.mycompany\.com},
      "https://trusted-partner.com"
    ],
    deny: [
      %r{.*\.suspicious\.com},
      "http://insecure-endpoint.com" 
    ],
    protocols: ["https", "wss"],
    require_ssl_verification: true
  }
}

gem "sidekiq", permissions: {
  rw: ["tmp/sidekiq"],
  env: ["REDIS_URL"],
  network: {
    allow: [
      "redis://localhost:6379",
      %r{redis://[\w\.-]+\.internal:6379}
    ]
  }
}
```

This manifest would:

1. Declare that Rails needs read/write access to the `/tmp` directory
2. Specify which environment variables it needs to access
3. Indicate which ports it might expose
4. Explicitly state that it doesn't need shell execution permissions

## Implementation Possibilities

The dream is that it can live in the runtime, even detect, purge or upgrade versions and report malicious actions automatically. I see that with the increase of AI agents we'll be dynamically building more and more code, and malicious libraries will be spread out.

This could be implemented at several levels:

1. **Bundler Integration**: The manifest information could be stored in the Gemfile and processed by Bundler
2. **Runtime Enforcement**: A security layer could enforce these permissions during execution
3. **Static Analysis**: Tools could analyze gems against their declared permissions
4. **Registry Integration**: The RubyGems registry could require permission manifests for new gems

## Benefits to the Ecosystem

Implementing permission manifests would provide numerous benefits:

- **Enhanced Security**: Reducing the attack surface of applications
- **Improved Transparency**: Making resource usage explicit for all dependencies
- **Better Auditing**: Simplifying security reviews of dependencies
- **Permission Minimization**: Encouraging gems to request only what they need

## Challenges and Considerations

This proposal isn't without challenges:

- **Backward Compatibility**: How do we handle existing gems?
- **Permission Granularity**: What's the right level of detail for permissions?
- **Enforcement Mechanisms**: How would permissions be enforced?
- **Developer Overhead**: Would this create too much friction for gem authors?

## Next Steps

To move this idea forward, I'm planning to:

1. Create a proof-of-concept implementation as a Bundler plugin
2. Start with a small set of permission types (filesystem, environment, network, shell)
3. Work with the Ruby community to refine the approach
4. Build tools to automatically detect required permissions

## Join the Discussion

I believe that adding permission manifests could significantly improve the security posture of Ruby applications while bringing more transparency to the ecosystem. I'd love to hear your thoughts on this proposal.

I'm particularly interested in your feedback on:
- Would you adopt this feature in your projects?
- Which permission types do you consider most critical?
- What implementation challenges do you anticipate?
- How should this be implemented - as an external service, language agent, linter, or something else?

Let's work together to make the Ruby ecosystem even more secure and transparent! 