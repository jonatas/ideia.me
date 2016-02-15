
require 'oembed'
require 'uri'
module Jekyll
  class FacebookEmbed < Liquid::Tag

    def initialize(tag_name, text, tokens)
      super
      @text = text.strip
    end

    def render(context)
      %{<div class="fb-post" data-href="#{@text}" data-width="500"></div>}
    end
  end
end

Liquid::Template.register_tag('facebook', Jekyll::FacebookEmbed)
