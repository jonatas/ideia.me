class YouTube < Liquid::Tag

  def initialize(tagName, markup, tokens)
    super
    @url = "https://www.youtube.com/embed/#{markup.strip.chomp}"
    @url << (@url.include?("?") ? "&" : "?")
    @url << "color=white&theme=light"
  end

  def render(context)
    %|<div class="video-container">
       <iframe width="560" height="420"
          frameborder="0"
          allowfullscreen
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          src="#{@url}">
       </iframe>
    </div>|
  end
  Liquid::Template.register_tag "youtube", self
end
