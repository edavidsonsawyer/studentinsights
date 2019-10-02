class PerfTest
  # querying and serializing data for absence dashboard at a particular school
  def self.absences_dashboard(percentage, options = ())
    school_id = options[:school_id] || School.all.first.id
    school = School.find(school_id)
    time_now = Time.at(1536589824)
    PerfTest.new.simple(percentage, options) do |educator|
      queries = DashboardQueries.new(educator, time_now: time_now)
      queries.absence_dashboard_data(school)
    end
  end

  def self.levels_shs(percentage, options = {})
    time_now = options.fetch(:time_now, Time.at(1529067553))
    school_id = 9
    PerfTest.new.simple(percentage, options) do |educator|
      levels = SomervilleHighLevels.new
      levels.students_with_levels_json(educator, [school_id], time_now)
    end
  end

  # May be used in critical path authorization code (see #authorized).
  def self.labels(percentage, options = {})
    PerfTest.new.simple(percentage, options) do |educator|
      educator.labels
    end
  end

  # Critical path authorization code (may call #labels).
  def self.authorized(percentage, options = {})
    PerfTest.new.simple(percentage, options) do |educator|
      Authorizer.new(educator).authorized { Student.active }
    end
  end

  def self.navbar_links(percentage, options = {})
    PerfTest.new.simple(percentage, options) do |educator|
      PathsForEducator.new(educator).navbar_links
    end
  end

  def self.authorized_homerooms(percentage, options = {})
    PerfTest.new.simple(percentage, options) do |educator|
      Authorizer.new(educator).homerooms
    end
  end

  def self.authorized_homerooms_DEPRECATED(percentage, options = {})
    PerfTest.new.simple(percentage, options) do |educator|
      Authorizer.new(educator).allowed_homerooms_DEPRECATED(acknowledge_deprecation: true)
    end
  end

  # See educators_controller#my_students_json
  def self.my_students(percentage, options = {})
    PerfTest.new.simple(percentage, options) do |educator|
      students = Authorizer.new(educator).authorized { Student.active.includes(:school).to_a }
      students.as_json({
        only: [:id, :first_name, :last_name, :house, :counselor, :grade],
        include: {
          school: {
            only: [:id, :name]
          }
        }
      })
    end
  end

  # See ClassListQueries.  This was driven by the view in admin/authorization, running this
  # across all educators.
  def self.is_relevant_for_educator?(percentage, options = {})
    PerfTest.new.simple(percentage, options) do |educator|
      ClassListQueries.new(educator).is_relevant_for_educator?
    end
  end

  # For testing the high absences insight
  def self.high_absences(percentage, options = {})
    PerfTest.new.simple(percentage, options) do |educator|
      time_now = options[:time_now] || Time.at(1522779136)
      time_threshold = time_now - 45.days
      absences_threshold = 4
      insight = InsightStudentsWithHighAbsences.new(educator)
      insight.students_with_high_absences_json(time_now, time_threshold, absences_threshold)
    end
  end

  def self.low_grades(percentage, options = {})
    PerfTest.new.simple(percentage, options) do |educator|
      time_now = options[:time_now] || Time.at(1522779136)
      time_threshold = time_now - 45.days
      grade_threshold = 69
      insight = InsightStudentsWithLowGrades.new(educator)
      insight.students_with_low_grades_json(time_now, time_threshold, grade_threshold)
    end
  end

  # Part of Section controller, influenced heavily by Authorizer.
  def self.section_authorization_pattern(percentage, options = {})
    PerfTest.new.simple(percentage, options) do |educator|
      authorizer = Authorizer.new(educator)
      section = educator.sections.sample
      if section.nil?
        [[], []]
      else
        section_students = authorizer.authorized { section.students.active }
        authorized_sections = authorizer.authorized { Section.includes(:course).all }
        [section_students, authorized_sections]
      end
    end
  end


  # Usage for testing the feed (may call #authorized)
  def self.feed(percentage, options = {})
    timer = PerfTest.new.run_with_tags(percentage, options) do |t, educator|
      time_now = options[:time_now] || Time.at(1521552855)
      limit = options[:limit] || 10
      students = t.measure('students') do
        Feed.students_for_feed(educator)
      end
      feed = Feed.new(students)
      event_note_cards = t.measure('event_note_cards') do
        feed.event_note_cards(time_now, limit)
      end
      incident_cards = t.measure('incident_cards') do
        feed.incident_cards(time_now, limit)
      end
      birthday_cards = t.measure('birthday_cards') do
        feed.birthday_cards(time_now, limit, {
          limit: 3,
          days_back: 3,
          days_ahead: 0
        })
      end
      student_voice_cards = t.measure('student_voice_cards') do
        feed.student_voice_cards(time_now)
      end
      t.measure('feed_cards') do
        feed.merge_sort_and_limit_cards([
          event_note_cards,
          birthday_cards,
          incident_cards,
          student_voice_cards
        ], limit)
      end
    end
    pp timer.report
    timer
  end

  # Simplest usage.  Block yields an educator.
  def simple(percentage, options = {}, &block)
    timer = PerfTest.new.run_with_tags(percentage, options) do |t, educator|
      block.yield(educator)
    end
    pp timer.report
    pp PerfTest::Reporter.new.report(timer.report.group_by {|tuple| tuple[0] })
    timer
  end

  # Generic perftest usage:
  # timer = perf_test.run_with_tags(0.10) do |t, educator|
  #   t.measure('whatever') { do_something_for(educator) }
  #   t.measure('foo') { do_something_else_for(educator) }
  # end;nil
  # pp timer.report
  def run_with_tags(percentage, options = {}, &block)
    timer = Timer.new

    puts
    puts
    puts 'Getting test set...'
    educator_ids = test_educator_ids(percentage, options)
    puts "Test set includes #{educator_ids.size} educators: [#{educator_ids.sort.join(',')}]"
    puts 'Done.'
    puts
    puts
    puts 'Starting test run...'
    run_for_all_educators(timer, educator_ids, &block)
    puts 'Done.'
    puts
    puts
    timer
  end

  def test_educator_ids(percent, options = {})
    seed = options[:seed] || 42
    fixed_educator_ids = options[:fixed_educator_ids] || []
    all_educator_ids = Educator.active.select(:id).map(&:id)
    sample_size = percent * all_educator_ids.size
    sample_educator_ids = all_educator_ids.sample(sample_size, random: Random.new(seed))
    (sample_educator_ids + fixed_educator_ids).uniq
  end

  # Helper class to print summary stats like p50, p95
  #
  # Usage:
  #
  #   Reporter.new.report({
  #     unoptimized: unoptimized_timer.report,
  #     optimized: optimized_timer.report
  #   })
  #
  # or json = JSON.parse(IO.read('runs.json'));nil
  # Reporter.new.report(json)
  class Reporter
    def report(timer_reports_map)
      timer_reports_map.each do |report_key, tuples|
        puts
        puts "#{report_key.upcase}, sample size: #{tuples.size}"
        tuples.group_by {|t| t[0]}.each do |key, ts|
          values = ts.map {|t| t[1] }
          p50 = percentile(values, 0.50).round
          p95 = percentile(values, 0.95).round
          puts "  #{key.ljust(25)}\tmedian: #{p50}ms\t\tp95: #{p95}ms"
        end
      end
      nil
    end

    private
    # copied from https://stackoverflow.com/questions/11784843/calculate-95th-percentile-in-ruby
    def percentile(values, percentile)
      values_sorted = values.sort
      k = (percentile*(values_sorted.length-1)+1).floor - 1
      f = (percentile*(values_sorted.length-1)+1).modulo(1)
      return values_sorted[k] + (f * (values_sorted[k+1] - values_sorted[k]))
    end
  end

  # Helper class to hold timing data
  class Timer
    def initialize()
      @measurements = []
    end

    # not attr_reader so it doesn't puts by default (values are large!)
    def measurements
      @measurements
    end

    def measure(tag)
      value = nil
      timing = Benchmark.measure { value = yield }
      puts tag + timing.to_s
      @measurements << {tag: tag, timing: timing, value: value}
      value
    end

    def report
      tuples = @measurements.map do |measurement|
        ms = (measurement[:timing].real * 1000).round
        [measurement[:tag], ms]
      end
      tuples.sort_by {|t| [t[0], t[1]] }
    end
  end

  private
  def debug!
    # This is dangerous, as it can result in logging sensitive information.
    # Use with caution, and verify the impact locally first.
    #
    # Rails.configuration.log_level = :debug
    # ActiveRecord::Base.logger = Logger.new(STDOUT)
  end

  def reset!
    ActiveRecord::Base.connection.query_cache.clear
  end

  def run_for_all_educators(t, educator_ids, &block)
    educator_ids.each do |educator_id|
      reset!
      puts
      puts "Starting for educator: #{educator_id}..."
      educator = Educator.find(educator_id)
      t.measure('all_for_educator') do
        block.yield(t, educator)
      end
    end
  end
end
