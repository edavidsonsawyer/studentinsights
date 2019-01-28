class ImportedForm < ApplicationRecord
  SHS_Q2_SELF_REFLECTION = 'shs_q2_self_reflection';
  SHS_WHAT_I_WANT_MY_TEACHER_TO_KNOW_MID_YEAR = 'shs_what_i_want_my_teacher_to_know_mid_year';

  belongs_to :student
  belongs_to :educator

  validates :student, presence: true
  validates :educator, presence: true
  validates :responses_json, presence: true
  validates :form_timestamp, presence: true
  validates :form_url, presence: true
  validates :form_key, inclusion: {
    in: [
      SHS_Q2_SELF_REFLECTION,
      SHS_WHAT_I_WANT_MY_TEACHER_TO_KNOW_MID_YEAR
    ]
  }

  # override
  def as_json(options = {})
    except = options.fetch(:except, [])
    super(options.merge({ except: except + [:form_url] }))
  end

  def self.form_title(form_key)
    if form_key == SHS_Q2_SELF_REFLECTION
      'Q2 Self-reflection'
    elsif form_key == SHS_WHAT_I_WANT_MY_TEACHER_TO_KNOW_MID_YEAR
      'What I want my teachers to know'
    else
      'Student voice survey'
    end
  end

  # Which keys within `responses_json` should we read, and in what order?
  def self.prompts(form_key)
    if form_key == SHS_Q2_SELF_REFLECTION
      [
        'What was the high point for you in school this year so far?',
        "What's something that most teachers don't know about me, but they should?",
        'I am proud that I...',
        'My best qualities are...',
        'My activities and interests outside of school are...',
        'I get nervous or stressed in school when...',
        'I learn best when my teachers...'
      ]
    elsif form_key == SHS_WHAT_I_WANT_MY_TEACHER_TO_KNOW_MID_YEAR
      [
        'What classes are you doing well in?',
        'Why are you doing well in those classes?',
        'What courses are you struggling in?',
        'Why are you struggling in those courses?',
        "In the classes that you are struggling in, how can your teachers support you so that your grades, experience, work load, etc, improve?",
        "When you are struggling, who do you go to for support, encouragement, advice, etc?",
        "At the end of the quarter 3, what would make you most proud of your accomplishments in your course?",
        "What other information is important for your teachers to know so that we can support you and your learning? (For example, tutor, mentor, before school HW help, study group, etc)"
      ]
    else
      responses_json.keys
    end
  end

  # Get the latest forms (of any type) for a student
  def self.latest_forms_for_student_id(student_id)
    [
      latest_for_student_id(student_id, SHS_Q2_SELF_REFLECTION),
      latest_for_student_id(student_id, SHS_WHAT_I_WANT_MY_TEACHER_TO_KNOW_MID_YEAR)
    ].compact
  end

  # Most recent import of most recent form_key for student
  def self.latest_for_student_id(student_id, form_key)
    ImportedForm
      .where(student_id: student_id)
      .where(form_key: form_key)
      .order('form_timestamp DESC, updated_at DESC')
      .limit(1)
      .first
  end
  
  # for rendering in UI
  def as_flat_survey_json
    { 
      id: id,
      form_timestamp: form_timestamp,
      form_title: ImportedForm.form_title(form_key),
      educator_id: educator_id,
      survey_text: survey_text
    }.as_json
  end

  # flat text rendering the whole survey
  def survey_text
    prompts = ImportedForm.prompts(form_key)
    sections = prompts.flat_map do |prompt|
      response_text = responses_json.fetch(prompt, nil)
      if response_text.nil?
        []
      else
        [prompt, response_text].join("\n")
      end
    end
    sections.join("\n\n")
  end
end
