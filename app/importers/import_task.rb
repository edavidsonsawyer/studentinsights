class ImportTask
  def initialize(options:)
    @options = options

    # options["school"] is an optional filter; imports all schools if nil
    @school = @options.fetch("school", nil)

    # options["source"] describes which external data sources to import from
    @source = @options.fetch("source", ["x2", "star"])

    # These options control whether older data is ignored.  Different importers
    # respond differently to these options (some do not respect them).
    @only_recent_attendance = @options.fetch('only_recent_attendance', false)
    @skip_old_records = @options.fetch('skip_old_records', false)

    # to skip updating any indexes after (eg, when tuning a particular job)
    @skip_index_updates = @options.fetch('skip_index_updates', false)

    @log = Rails.env.test? ? LogHelper::Redirect.instance.file : STDOUT
  end

  def connect_transform_import
    begin
      @record = create_import_record
      @report = create_report
      log('Starting validation...')
      validate_district_option
      seed_schools_if_needed
      validate_school_options
      log('Done validation.')

      log('Starting importing work...')
      @report.print_initial_counts_report
      import_all_the_data
      log('Done importing work.')

      log('Starting update tasks and final report...')
      run_update_tasks
      @report.print_final_counts_report
      log('Done.')
    rescue SignalException => e
      log("Encountered a SignalException!: #{e}")

      if (@options.attempt == 0)
        log('Putting a new job into the queue...')
        Delayed::Job.enqueue ImportJob.new(
          options: @options.merge({ attempt: @options.attempt + 1 })
        )
      else
        log('Already re-tried this once, not going to retry again...')
      end

      log('Bye!')
    end
  end

  private

  ## VALIDATE DEVELOPER INPUT ##

  def validate_district_option
    # The LoadDistrictConfig class uses `fetch`, which will validate the
    # district option for us
    LoadDistrictConfig.new.load_yml
  end

  def seed_schools_if_needed
    School.seed_schools_for_district if School.count == 0
  end

  def validate_school_options
    # If the developer is passing in a list of school IDs to filter by,
    # we check that the IDs are valid and the schools exist in the database.

    # If there's no filtering by school, we take all the school IDs listed in
    # the district config file and make sure those schools are in the database.

    school_ids.each { |id| School.find_by!(local_id: id) }
  end

  def school_ids
    return @school if @school.present?

    LoadDistrictConfig.new.schools.map { |school| school["local_id"] }
  end

  ## SET UP COMMAND LINE REPORT AND DATABASE RECORD ##

  def create_import_record
    ImportRecord.create(
      task_options_json: @options.to_json,
      time_started: DateTime.current,
    )
  end

  def create_report
    models = [
      Student,
      StudentAssessment,
      DisciplineIncident,
      Absence,
      Tardy,
      Educator,
      School,
      Course,
      Section,
      StudentSectionAssignment,
      EducatorSectionAssignment
    ]
    ImportTaskReport.new(
      models_for_report: models,
      record: @record,
      log: @log,
    )
  end

  ## IMPORT ALL THE DATA ##

  def options_for_file_importers
    {
      school_scope: school_ids,
      log: @log,
      only_recent_attendance: @only_recent_attendance,
      skip_old_records: @skip_old_records
    }
  end

  # This is the main method doing all the work
  def import_all_the_data
    log('Starting #import_all_the_data...')
    file_import_classes = UnwrapFileImporterOptions.new(@source).sort_file_import_classes
    log("file_import_classes = [\n  #{file_import_classes.join("\n  ")}\n]")
    timing_log = []

    file_import_classes.each do |file_import_class|
      file_importer = file_import_class.new(options: options_for_file_importers)

      timing_data = { importer: file_importer.class.name, start_time: Time.current }

      begin
        log("Starting file_importer#import for #{file_importer.class}...")
        file_importer.import
        log("Done file_importer#import for #{file_importer.class}.")
      rescue => error
        log("🚨  🚨  🚨  🚨  🚨  Error! #{error}")
        log(error.backtrace)

        extra_info =  { "importer" => file_importer.class.name }
        ErrorMailer.error_report(error, extra_info).deliver_now if Rails.env.production?
      end

      timing_data[:end_time] = Time.current
      timing_log << timing_data

      @record.update(
        importer_timing_json: timing_log.to_json,
        time_ended: DateTime.current,
      )

      @record.save!
    end
    log('Done #import_all_the_data...')
  end

  ## RUN TASKS THAT CACHE DATA ##

  def run_update_tasks
    if @skip_index_updates
      log('Skipping index updates...')
      return
    end

    begin
      Student.update_risk_levels!
      Student.update_recent_student_assessments
      Homeroom.destroy_empty_homerooms
    rescue => error
      ErrorMailer.error_report(error).deliver_now if Rails.env.production?
      raise error
    end
  end

  ## LOGGING STUFF ##

  def log(msg)
    full_msg = "\n\n💾  ImportTask: #{msg}"
    @log.puts full_msg
    @log.flush # prevent buffering, this seems to be a problem in production jobs
    @record.log += full_msg
    @record.save
  end
end
