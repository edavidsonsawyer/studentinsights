# Import transition notes, just notes and not services (even though
# they are in the same sheets).
class BedfordTeacherTransitionImporter
  def self.data_flow
    DataFlow.new({
      importer: self.name,
      source: DataFlow::SOURCE_GOOGLE_DRIVE_SHEET,
      frequency: DataFlow::FREQUENCY_ONE_TIME_BATCH,
      options: [],
      merge: DataFlow::MERGE_BLINDLY_CREATE,
      touches: [
        EventNote.name
      ],
      description: 'Transition notes from teachers at Lane in Bedford, imported from sheets into notes'
    })
  end

  def initialize(options:)
    @folder_id = options.fetch(:folder_id, read_folder_id_from_env())

    @log = options.fetch(:log, STDOUT)
    @fetcher = options.fetch(:fetcher, GoogleSheetsFetcher.new)
    @matcher = options.fetch(:matcher, ImportMatcher.new)
    @syncer = options.fetch(:syncer, SimpleSyncer.new(log: @log))
    @note_prefix = options.fetch(:note_prefix, note_prefix())
  end

  def import
    rows = dry_run()
    rows.each {|row| EventNote.create!(row) }
    nil
  end

  def dry_run
    rows = fetch_tabs().flat_map do |tab|
      process_tab(tab)
    end
    rows
  end

  def stats
    {
      matcher: @matcher.stats,
      syncer: @syncer.stats
    }
  end

  private
  def read_folder_id_from_env
    PerDistrict.new.imported_google_folder_ids('bedford_teacher_transition_notes_folder_id')
  end

  def fetch_tabs
    @fetcher.get_tabs_from_folder(@folder_id)
  end

  def process_tab(tab)
    # skip info tab
    return [] if tab.tab_name == 'ALL'

    # url to specific tab
    form_url = "#{tab.spreadsheet_url}#gid=#{tab.tab_id}"

    # find educator from tab
    educator = @matcher.find_educator_by_name_flexible(tab.tab_name)
    return [] if educator.nil?

    # process and create
    processor = BedfordTeacherTransitionProcessor.new(educator, form_url, log: @log)
    processor.dry_run(tab.tab_csv)
  end

  def log(msg)
    text = if msg.class == String then msg else JSON.pretty_generate(msg) end
    @log.puts "BedfordTeacherTransitionImporter: #{text}"
  end
end
