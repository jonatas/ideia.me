module Jekyll
  class ClaudeFilesGenerator < Generator
    safe true
    priority :normal

    def generate(site)
      files = collect_files(site)
      return if files.empty?

      # Generate index page
      index = PageWithoutAFile.new(site, site.source, "claude", "index.html")
      index.data.merge!(
        "layout"      => "claude_index",
        "title"       => "~/.claude",
        "description" => "AI instructions and agent definitions used on this site.",
        "claude_files" => files
      )
      index.content = ""
      site.pages << index

      # Generate individual file pages
      # Use "index.md" so Jekyll applies the Markdown converter (kramdown).
      # render_with_liquid: false prevents Liquid from executing tag examples
      # in the content (e.g. {% youtube %}) while still letting kramdown run.
      files.each do |file|
        page = PageWithoutAFile.new(site, site.source, file["dir"], "index.md")
        page.data.merge!(
          "layout"             => "claude_file",
          "title"              => file["source_path"],
          "description"        => file["description"],
          "source_path"        => file["source_path"],
          "front_matter"       => file["front_matter"],
          "render_with_liquid" => false
        )
        page.content = file["body"]
        site.pages << page
      end
    end

    private

    def collect_files(site)
      files = []

      # CLAUDE.md at repo root
      claude_md = File.join(site.source, "CLAUDE.md")
      if File.exist?(claude_md)
        raw = File.read(claude_md)
        files << {
          "source_path"  => "CLAUDE.md",
          "title"        => "CLAUDE.md",
          "description"  => "Project-level instructions for Claude.",
          "url"          => "/claude/CLAUDE.md/",
          "dir"          => "claude/CLAUDE.md",
          "front_matter" => nil,
          "body"         => raw
        }
      end

      # .claude/agents/*.md
      agents_dir = File.join(site.source, ".claude", "agents")
      if Dir.exist?(agents_dir)
        Dir.glob(File.join(agents_dir, "*.md")).sort.each do |f|
          raw = File.read(f)
          fm, body = split_front_matter(raw)
          slug = File.basename(f, ".md")
          description = fm ? (fm["description"] || "") : ""
          files << {
            "source_path"  => ".claude/agents/#{File.basename(f)}",
            "title"        => slug,
            "description"  => description,
            "url"          => "/claude/agents/#{slug}/",
            "dir"          => "claude/agents/#{slug}",
            "front_matter" => fm,
            "body"         => body
          }
        end
      end

      files
    end

    def split_front_matter(raw)
      return [nil, raw] unless raw.start_with?("---")
      parts = raw.split(/^---\s*$/, 3)
      return [nil, raw] unless parts.length == 3
      fm = begin
        require "yaml"
        YAML.safe_load(parts[1])
      rescue
        nil
      end
      [fm, parts[2].lstrip]
    end
  end
end
