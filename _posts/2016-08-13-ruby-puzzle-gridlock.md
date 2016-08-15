---
  layout: post
  title: Gridlock game - solving with Ruby
  categories: ['ruby']
---

I really love game challenges and everytime I get a new game I think about how can I solve it via code or represent the game idea.

# The Gridlock Game

The game is from [Lorenzo](http://lorenzo.ideia.me), my 4 years old my son. I really love the simplicity of the game and I start thinking about represent the game in a algorithm.

<blockquote class="twitter-tweet" data-lang="en"><p lang="pt" dir="ltr">começando a implementar o joguinho da cilada em <a href="https://twitter.com/hashtag/ruby?src=hash">#ruby</a> <a href="https://t.co/liMPSIByam">pic.twitter.com/liMPSIByam</a></p>&mdash; Jônatas Paganini (@jonatasdp) <a href="https://twitter.com/jonatasdp/status/752996731797835776">July 12, 2016</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

## Current implementation

My idea was code the board, but after code it, I tried to start building a solver
for it. It was pretty hard for me. My current implementation was a "go horse"
with no sense and no concerns. Just a foo implementation that:

- pick a random piece from a valid set
- navigates on the board from top to down, from right to left with the piece
- rotating the piece and trying to fit in each position of the board
- when fit get another piece

<script type="text/javascript" src="https://asciinema.org/a/79433.js" id="asciicast-79433" async></script>

So, it was an old version and as you see it does not accomplish with the mission.

## The current solver problems

So, Ruby is one of my favorite language and I put it down in a little time but when I
start coding the solver, I really understand how much functional paradigms is
missing in my mind. And how my [horse approach](https://github.com/jonatas/gridlock/blob/master/solver.rb) is broken.

It really does not work yet. It never finishes a board with success. Some little
changes should be considered to start being more flexible:

- block to put pieces that enclosure a stone
- improve rotation and stone validation
- skip stones with pieces


## The challenge

The challenge is solve the board. Feel free to [fork it](https://github.com/jonatas/gridlock/) and implement your own strategy!

I extended the challenge to [Floripa On Rails](http://floripaonrails.com.br) meetup and we'll join [tomorrow](http://www.meetup.com/Floripa-on-Rails/events/233237002/) to implement it together \o/

Feel free to [join us](http://www.meetup.com/Floripa-on-Rails) and help us to implement a better solver ;)

-------

### First post in English

So, it was my first post in English \o/

I recently joined to the [Toptal LLC](https://toptal.com) core team.

Now I'm part of a global company! It's time to be global and start blogging in English too :)