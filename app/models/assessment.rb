class Assessment < ActiveRecord::Base
  VALID_FAMILY_VALUES = [
    'MCAS',
    'Next Gen MCAS',
    'STAR',
    'DIBELS',
    'ACCESS'
  ]
  VALID_MCAS_SUBJECTS = [ 'ELA', 'Mathematics' ].freeze
  VALID_STAR_SUBJECTS = [ 'Mathematics', 'Reading' ].freeze
  VALID_ACCESS_SUBJECTS = [
    "Composite", "Comprehension", "Literacy", "Oral",
    "Listening", "Reading", "Speaking", "Writing"
  ].freeze

  MCAS_PERFORMANCE_LEVEL_TO_RISK = {"W"=>3, "F"=>3, "NI"=>2, "P"=>1, "A"=>0}
  NEXTGEN_MCAS_PERFORMANCE_LEVEL_TO_RISK = {"NME"=>3, "PE"=>2, "ME"=>1, "EE"=>0}

  has_many :student_assessments, dependent: :destroy
  has_many :students, through: :student_assessments
  validate :has_valid_subject
  validates :family, inclusion: { in: VALID_FAMILY_VALUES }

  def has_valid_subject
    case family
    when 'MCAS'
      errors.add(:subject, "invalid MCAS subject") unless subject.in?(VALID_MCAS_SUBJECTS)
    when 'STAR'
      errors.add(:subject, "invalid STAR subject") unless subject.in?(VALID_STAR_SUBJECTS)
    when 'DIBELS'
      errors.add(:subject, "DIBELS has no subject") unless subject.nil?
    when 'ACCESS'
      errors.add(:subject, "invalid ACCESS subject") unless subject.in?(VALID_ACCESS_SUBJECTS)
    end
  end

  # Centralize logic for converting an assessment into a
  # component of a risk level
  def to_risk_level(student_assessment)
    case family
    when "MCAS"
      MCAS_PERFORMANCE_LEVEL_TO_RISK[student_assessment.performance_level] || nil
    when "Next Gen MCAS"
      NEXTGEN_MCAS_PERFORMANCE_LEVEL_TO_RISK[student_assessment.performance_level] || nil
    when "STAR"
      case student_assessment.percentile_rank
      when 0..9
        3
      when 10..29
        2
      when 29..85
        1
      else
        0
      end
    else
      nil
    end
  end

  def self.seed_somerville_assessments
    Assessment.destroy_all
    Assessment.create!([
      { family: "MCAS", subject: "Mathematics" },
      { family: "MCAS", subject: "ELA" },
      { family: "Next Gen MCAS", subject: "Mathematics" },
      { family: "Next Gen MCAS", subject: "ELA" },
      { family: "STAR", subject: "Mathematics" },
      { family: "STAR", subject: "Reading" },
      { family: "ACCESS", subject: "Composite" },
      { family: "ACCESS", subject: "Comprehension" },
      { family: "ACCESS", subject: "Literacy" },
      { family: "ACCESS", subject: "Oral" },
      { family: "ACCESS", subject: "Listening" },
      { family: "ACCESS", subject: "Reading" },
      { family: "ACCESS", subject: "Speaking" },
      { family: "ACCESS", subject: "Writing" },
      { family: "DIBELS" }
    ])
  end

end
