# frozen_string_literal: true

# Jekyll Math Support Plugin
# 1. Auto-enables `page.math = true` whenever a post/page contains LaTeX math delimiters.
# 2. Protects inline single-dollar `$ ... $` math expressions containing multiple underscores
#    from being corrupted into `<em>...</em>` tags by Kramdown before MathJax runs.

Jekyll::Hooks.register [:posts, :pages, :documents], :pre_render do |doc|
  next unless doc.content && (doc.extname == '.md' || doc.extname == '.markdown' || doc.extname == '.html')

  if doc.content.match?(/(\$\$|\$[^\$\n]+\$|\\\(|\\\[|\\text\{)/)
    doc.data['math'] = true
  end

  if doc.extname == '.md' || doc.extname == '.markdown'
    # Split by fenced code blocks so we never touch code snippets
    segments = doc.content.split(/(```[\s\S]*?```|`[^`\n]+`)/)
    segments.each_with_index do |seg, idx|
      next if idx.odd? # skip code blocks and inline code

      # Replace `\text{ \AA}` with `\text{ Å}` so MathJax text-mode renders Angstroms cleanly
      seg.gsub!('\\text{ \\AA}', '\\text{ Å}')

      # For lines outside raw HTML tags, convert inline `$...$` containing >=2 underscores to `$$...$$`
      # so Kramdown natively emits `\(...\)` instead of parsing `_..._` as `<em>...</em>`
      seg.gsub!(/(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/) do |match|
        inner = Regexp.last_match(1)
        if inner.count('_') >= 2 && !inner.include?('<') && !inner.include?('>')
          "$$#{inner}$$"
        else
          match
        end
      end
    end
    doc.content = segments.join
  end
end
