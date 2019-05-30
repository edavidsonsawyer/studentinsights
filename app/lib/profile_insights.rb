class ProfileInsights
  def initialize(student, options = {})
    @student = student
    @time_now = options.fetch(:time_now, Time.now)
  end

  def as_json(options = {})
    all_insights = (
      student_voice_survey_insights +
      transition_note_profile_insights +
      team_membership_insights +
      bedford_end_of_year_transition_insights
    )
    all_insights.as_json(options)
  end

  # From Q2 self-reflection, for showing with grades
  def grades_reflection_insights
    self_reflection_form = ImportedForm.latest_for_student_id(@student.id, ImportedForm::SHS_Q2_SELF_REFLECTION)
    return [] if self_reflection_form.nil?
    imported_form_insights(self_reflection_form)
  end

  private
  def transition_note_profile_insights
    transition_note = @student.transition_notes.find_by(is_restricted: false)
    return [] if transition_note.nil?

    note_parts = TransitionNoteParser.new.parse_text(transition_note.text)
    strengths_quote_text = note_parts[:strengths]
    return [] if strengths_quote_text.nil? || strengths_quote_text.empty?

    transition_note_json = transition_note.as_json({
      only: [:id, :text, :recorded_at],
      include: {
        educator: {
          only: [:id, :full_name, :email]
        }
      }
    })
    profile_insight = ProfileInsight.new('transition_note_strength', {
      strengths_quote_text: strengths_quote_text,
      transition_note: transition_note_json
    })
    [profile_insight]
  end

  # Include:
  # 1. Q2 self-reflection and
  # 2. the more recent of (What I want my teachers to know, fall student voice survey)
  def student_voice_survey_insights
    insights = []

    # always add any q2 self reflection, if enabled
    if PerDistrict.new.include_q2_self_reflection_insights?
      insights += grades_reflection_insights()
    end

    # check for mid-year and take if it it's there
    mid_year_form = ImportedForm.latest_for_student_id(@student.id, ImportedForm::SHS_WHAT_I_WANT_MY_TEACHER_TO_KNOW_MID_YEAR)
    return insights + imported_form_insights(mid_year_form) if mid_year_form.present?

    # if not, include fall survey insights if there are any
    most_recent_fall_survey = StudentVoiceCompletedSurvey.most_recent_fall_student_voice_survey(@student.id)
    if most_recent_fall_survey.present?
      insights += profile_insights_from_survey(most_recent_fall_survey)
    end

    insights
  end

  def imported_form_insights(imported_form)
    ImportedForm.prompts(imported_form.form_key).map do |prompt_key|
      if imported_form.form_json[prompt_key].nil?
        nil
      else
        ProfileInsight.new('imported_form_insight', {
          form_key: imported_form.form_key,
          prompt_text: prompt_key,
          response_text: imported_form.form_json[prompt_key],
          flattened_form_json: imported_form.as_flattened_form
        })
      end
    end.compact
  end

  # Unroll each question from the survey into a separate insight
  def profile_insights_from_survey(most_recent_survey)
    survey_insights = []

    prompt_keys_to_include = [
      :proud,
      :best_qualities,
      :activities_and_interests,
      :nervous_or_stressed,
      :learn_best
    ]
    prompt_keys_to_include.each do |prompt_key|
      survey_response_text = most_recent_survey[prompt_key].strip
      next if survey_response_text.nil? || survey_response_text == ''

      survey_text = most_recent_survey.flat_text(prompt_keys_to_include: prompt_keys_to_include)
      student_voice_completed_survey_json = most_recent_survey.as_json({
        only: [:id, :form_timestamp, :created_at]
      }).merge(survey_text: survey_text)
      survey_insights << ProfileInsight.new('student_voice_survey_response', {
        prompt_key: prompt_key,
        prompt_text: StudentVoiceCompletedSurvey.columns_for_form_v2[prompt_key],
        survey_response_text: survey_response_text,
        student_voice_completed_survey: student_voice_completed_survey_json
      })
    end
    survey_insights
  end

  def team_membership_insights
    @student.teams(time_now: @time_now).map do |team|
      ProfileInsight.new('team_membership', team.as_json({
        only: [:activity_text, :coach_text, :season_key, :school_year_text],
        methods: [:active]
      }))
    end
  end

  # For showing the "connecting" as an educator insight
  def bedford_end_of_year_transition_insights
    return [] unless PerDistrict.new.include_bedford_end_of_year_transition?

    prompt = 'Please share anything that helped you connect with this student that might be helpful to the next teacher.'
    form_key = ImportedForm::BEDFORD_END_OF_YEAR_TRANSITION_FORM
    imported_form = ImportedForm.latest_for_student_id(@student.id, form_key)
    return [] if imported_form.nil?
    insight_text = imported_form.form_json.fetch(prompt, nil)
    return [] unless insight_text.present?

    insight = ProfileInsight.new('bedford_end_of_year_transition_connecting', {
      insight_text: insight_text,
      form_url: imported_form.form_url,
      educator: imported_form.educator.as_json
    })
    [insight]
  end
end
