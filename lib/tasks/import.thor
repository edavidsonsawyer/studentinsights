require 'thor'
require File.expand_path("../../../config/environment.rb", __FILE__)

class Import
  class Start < Thor::Group
    desc "Import data into your Student Insights instance"

    class_option :school,
      type: :array,
      desc: "Scope by school"
    class_option :source,
      type: :array,
      default: FileImporterOptions.new.all_importer_keys,
      desc: "Import data from one of the keys in 'FileImporterOptions'"
    class_option :only_recent_attendance,
      type: :boolean,
      default: false,
      desc: "Only import attendance rows from the past 90 days for faster attendance import"
    class_option :skip_old_records,
      type: :boolean,
      default: false,
      desc: "Skip old data (eg, more than a calendar year old)"
    class_option :skip_index_updates,
      type: :boolean,
      default: false,
      desc: "Skip updating indexes after the import task is completed (not recommended except for when profiling)"

    def import
      ImportTask.new(options: options).connect_transform_import
    end
  end
end
