require 'bundler/inline'
gemfile do
  gem 'tty-markdown'
  gem 'tty-table'
  gem 'redcarpet'
  gem 'timescaledb', path: '../timescale/timescale-gem'
  gem 'pry'
end

ActiveRecord::Base.establish_connection(adapter: 'postgresql', database: "playground")

# Run code in a sandbox
# Outputs the code and the result
class RunAndRender < Redcarpet::Render::Base
  attr_reader :results

  def initialize
    super
    @results = []
    @current_language = nil
    @ruby_binding = binding
  end

  def paragraph(text)
    text + "\n"
  end

  def block_code(code, language)
    result, output = execute_code(code.chomp, language || @current_language)
    @results << [language, code, result]
    output
  end

  def execute_code(code, language)
    result = nil
    output = case language
    when 'sql'
      result = execute_sql(code)
      <<~OUTPUT
      ```#{language}
      #{code}
      ```

      Results:

      #{result}
      OUTPUT
    when 'ruby'
      <<~OUTPUT
      ```#{language}
      #{code} # => #{(result = execute_ruby(code)).inspect}
      ```
      OUTPUT
    when 'bash'
      result = `#{code}`
      <<~OUTPUT
      ```
      $ #{code}
      ```
      #{ "Outputs: \n\n```\n#{result}\n```" if result != true }
      OUTPUT
    else
      <<~OUTPUT

      ```#{language}
      #{code}
      ```

      OUTPUT
    end
    [result, output]
  end


  def execute_sql(code)
    results = nil
    ActiveRecord::Base.connection_pool.with_connection do |con|
      results = con.execute(code)
    end
    format_sql_results(results)
  end

  def format_sql_results(results)
    size = results.ntuples
    values = results.to_a.map(&:values)
    return "" if size == 0
    table =
      if size > 5
        rows = values[0...5] + [["... #{size - 5 + 2}"]] + values[-2..-1]
        TTY::Table.new(header: results.fields, rows: rows)
      else
        if size == 1
          if results.nfields > 1
            # Single row, multiple columns, rotate the table
            rows = results.first.map{|k,v| [k,v]}
            return tbl_output TTY::Table.new(rows: rows).render(:ascii)
          else
            # Single row, single column, no need to rotate
            return tbl_output results.first.values.first
          end
        end
        TTY::Table.new(header: results.fields, rows: results.values)
      end

    align =
      results.values.first.map do |sample|
        case sample
        when NilClass
          :center
        when Numeric, Time
          :right
        else
          :left
        end
      end
    tbl_output table.render(:ascii, alignments: align).encode('UTF-8')
  end

  def tbl_output(rendered)
    "\n```\n#{rendered}\n```\n"
  end

  def execute_ruby(code)
    eval_ruby(code)
  end

  def header(text, header_level)
    "\n#{'#' * header_level} #{text}\n\n"
  end

  def hrule()
    "\n---\n"
  end

  def list(contents, list_type)
    case list_type
    when :ordered
      contents.map.with_index { |c, i| "#{i + 1}. #{c}" }
    when :unordered
      contents.lines.map { |c| "* #{c}" }
    end.join("\n")
  end

  def list_item(text, list_type)
    text
  end

  def table(header, body)
    table = TTY::Table.new(header: header, rows: body)
    table.render(:basic)
  end

  # Method to evaluate Ruby code with persistent context
  def eval_ruby(code)
    @ruby_binding.eval(code)
  end

  def execute_bash(code)
    system code
  end
end


# Interactive command line walkthrough
Fast.shortcut :learn do
  file = ARGV.last
  walk = ->(line) { line.each_char { |c| sleep(0.001) and print(c) } }
  # Parsing and Rendering
  markdown  = Redcarpet::Markdown.new(RunAndRender, fenced_code_blocks: true)
  content = File.read(file)
  output = markdown.render(content)
  #puts output
  walk[TTY::Markdown.parse(output)] unless ARGV.include?('--no-walk')

  generated = file.gsub('.md', '-with-results.md')
  File.open(generated, 'w') { |f| f.write(output) }
  puts "\n\nGenerated #{generated}"
  #Pry.start(binding)
end
