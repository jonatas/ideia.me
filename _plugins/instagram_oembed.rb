require 'oembed'
require 'uri'
require 'cgi'
module Jekyll
  class InstagramOEmbed < Liquid::Tag

    def initialize(tag_name, text, tokens)
      super
      @text = text.strip
    end

    def render(context)
      %{<iframe src="//instagram.com/p/#{CGI.escapeHTML(@text)}/embed/" width="445px" height="535px" frameborder="0" scrolling="no" allowtransparency="true"></iframe>}
    end
  end
end

Liquid::Template.register_tag('instagram', Jekyll::InstagramOEmbed)
