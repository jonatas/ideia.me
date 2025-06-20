module Jekyll
  module Tags
    class CalloutTag < Liquid::Block
      def initialize(tag_name, block_options, liquid_options)
        super
        @options = block_options.strip
        @collapsible = false
        @open = false
        
        # Parse options: type [collapsible] [open] "title"
        # Examples:
        #   note "My Title"
        #   tip collapsible "Collapsible Tip"  
        #   warning collapsible open "Open Warning"
        parts = @options.split(/\s+/)
        @type = parts[0]
        
        # Check for collapsible and open flags
        if parts.include?('collapsible')
          @collapsible = true
          @open = parts.include?('open')
        end
        
        # Extract title from quotes
        title_match = @options.match(/"([^"]*)"/)
        @title = title_match ? title_match[1] : @type.capitalize
      end

      def render(context)
        site = context.registers[:site]
        converter = site.find_converter_instance(::Jekyll::Converters::Markdown)
        content = converter.convert(super)
        
        # Get icon and color for the admonition type
        icon, color = get_admonition_style(@type)
        
        if @collapsible
          render_collapsible(content, icon, color)
        else
          render_static(content, icon, color)
        end
      end

      private

      def get_admonition_style(type)
        styles = {
          'note' => ['📝', '#448aff'],
          'abstract' => ['📄', '#00b0ff'],
          'summary' => ['📄', '#00b0ff'], 
          'tldr' => ['📄', '#00b0ff'],
          'info' => ['ℹ️', '#00b8d4'],
          'todo' => ['✔️', '#00c853'],
          'tip' => ['💡', '#00c853'],
          'hint' => ['💡', '#00c853'],
          'important' => ['❗', '#ff9100'],
          'success' => ['✅', '#00c853'],
          'check' => ['✅', '#00c853'],
          'done' => ['✅', '#00c853'],
          'question' => ['❓', '#64dd17'],
          'help' => ['❓', '#64dd17'],
          'faq' => ['❓', '#64dd17'],
          'warning' => ['⚠️', '#ff9100'],
          'caution' => ['⚠️', '#ff9100'],
          'attention' => ['⚠️', '#ff9100'],
          'failure' => ['❌', '#ff5252'],
          'fail' => ['❌', '#ff5252'],
          'missing' => ['❌', '#ff5252'],
          'danger' => ['🚨', '#ff1744'],
          'error' => ['🚨', '#ff1744'],
          'bug' => ['🐛', '#f50057'],
          'example' => ['🔬', '#651fff'],
          'snippet' => ['🔬', '#651fff'],
          'quote' => ['💬', '#9e9e9e'],
          'cite' => ['💬', '#9e9e9e']
        }
        
        styles[type.downcase] || ['📌', '#2196f3']
      end

      def render_static(content, icon, color)
        <<~HTML
          <div class="admonition admonition-#{@type}" style="--admonition-color: #{color};">
            <div class="admonition-title">
              <span class="admonition-icon">#{icon}</span>
              #{@title}
            </div>
            <div class="admonition-content">
              #{content}
            </div>
          </div>
        HTML
      end

      def render_collapsible(content, icon, color)
        <<~HTML
          <details class="admonition admonition-#{@type} admonition-collapsible"#{@open ? ' open' : ''} style="--admonition-color: #{color};">
            <summary class="admonition-title">
              <span class="admonition-icon">#{icon}</span>
              #{@title}
            </summary>
            <div class="admonition-content">
              #{content}
            </div>
          </details>
        HTML
      end
    end
  end
end

# Register the callout tag
Liquid::Template.register_tag('callout', Jekyll::Tags::CalloutTag) 