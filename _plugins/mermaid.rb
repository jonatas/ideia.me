module Jekyll
  module Tags
    class MermaidTag < Liquid::Block
      def initialize(tag_name, markup, liquid_options)
        super
        @config = markup.strip
      end

      def render(context)
        content = super.strip
        
        # Add configuration if provided
        if @config && !@config.empty?
          config_section = "---\nconfig:\n  #{@config}\n---\n"
          content = config_section + content
        end
        
        # Return the mermaid diagram wrapped in a div.
        # The div must start at column 0 — kramdown treats indented HTML as a
        # code block and will render it as escaped literal text instead of HTML.
        "<div class=\"mermaid\">\n#{content}\n</div>"
      end
    end
  end
end

Liquid::Template.register_tag('mermaid', Jekyll::Tags::MermaidTag) 