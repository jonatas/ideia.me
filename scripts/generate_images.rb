#!/usr/bin/env ruby
# Generate blog post image options via OpenAI DALL-E 3.
#
# Usage:
#   ruby scripts/generate_images.rb "prompt one" "prompt two" "prompt three"
#
# Requires OPENAI_API_KEY environment variable.
# Saves images to /images/ and prints their paths, one per line.

require "net/http"
require "json"
require "uri"
require "base64"
require "time"

IMAGES_DIR = File.expand_path("../images", __dir__)

def generate(prompt)
  key = ENV["OPENAI_API_KEY"] or raise "OPENAI_API_KEY not set"

  uri = URI("https://api.openai.com/v1/images/generations")
  req = Net::HTTP::Post.new(uri)
  req["Authorization"] = "Bearer #{key}"
  req["Content-Type"] = "application/json"
  req.body = JSON.generate({
    model: "dall-e-3",
    prompt: prompt,
    size: "1792x1024",
    quality: "standard",
    response_format: "b64_json",
    n: 1
  })

  res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |h| h.request(req) }
  data = JSON.parse(res.body)
  raise "OpenAI error: #{data.dig("error", "message")}" if data["error"]

  data.dig("data", 0, "b64_json")
end

def save_image(b64, index)
  slug = Time.now.strftime("%Y%m%d-%H%M%S")
  filename = "post-image-option-#{index}-#{slug}.png"
  path = File.join(IMAGES_DIR, filename)
  File.binwrite(path, Base64.decode64(b64))
  "/images/#{filename}"
end

prompts = ARGV
if prompts.empty?
  warn "Usage: ruby scripts/generate_images.rb \"prompt 1\" \"prompt 2\" ..."
  exit 1
end

warn "Generating #{prompts.size} image(s) via OpenAI DALL-E 3..."

prompts.each_with_index do |prompt, i|
  warn "\n[#{i + 1}/#{prompts.size}] #{prompt[0, 80]}..."
  begin
    b64  = generate(prompt)
    path = save_image(b64, i + 1)
    puts path
    warn "    saved → #{path}"
  rescue => e
    warn "    ERROR: #{e.message}"
  end
end
