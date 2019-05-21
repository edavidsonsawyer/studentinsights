import _ from 'lodash';

/*
Functions for transforming the feed data structure that holds
all notes and services for a student.
*/

// Merges data from event_notes and deprecated tables (notes, interventions).
export function mergedNotes(feed) {
  // core, notes
  const eventNotes = feed.event_notes.map(eventNote => {
    return {
      ...eventNote,
      type: 'event_notes',
      sort_timestamp: eventNote.recorded_at
    };
  });

  // deprecated
  const deprecatedInterventions = feed.deprecated.interventions.map(intervention => {
    return {
      ...intervention,
      type: 'deprecated_interventions',
      sort_timestamp: intervention.start_date_timestamp
    };
  });

  // deprecated
  const transitionNotes = (feed.transition_notes || []).map(transitionNote => {
    return {
      ...transitionNote,
      type: 'transition_notes',
      sort_timestamp: transitionNote.created_at
    };
  });

  // somerville 8th > 9th transition notes 2019 
  const secondTransitionNotes = (feed.second_transition_notes || []).map(secondTransitionNote => {
    return {
      ...secondTransitionNote,
      type: 'second_transition_notes',
      sort_timestamp: secondTransitionNote.created_at
    };
  });

  // SHS only
  const homeworkHelpSessions = (feed.homework_help_sessions || []).map(homeworkHelpSession => {
    return {
      ...homeworkHelpSession,
      type: 'homework_help_sessions',
      sort_timestamp: homeworkHelpSession.form_timestamp
    };
  });

  // SHS only so far
  const fallStudentVoiceInsights = (feed.fall_student_voice_surveys || []).map(fallCompletedSurvey => {
    return {
      ...fallCompletedSurvey,
      type: 'fall_student_voice_surveys',
      sort_timestamp: fallCompletedSurvey.form_timestamp

    };
  });

  // flattened form (from ImportedForm)
  const flattenedForms = (feed.flattened_forms || []).map(flattenedForm => {
    return {
      ...flattenedForm,
      type: 'flattened_forms',
      sort_timestamp: flattenedForm.form_timestamp
    };
  });

  const mergedNotes = [
    ...eventNotes,
    ...deprecatedInterventions,
    ...transitionNotes,
    ...secondTransitionNotes,
    ...homeworkHelpSessions,
    ...fallStudentVoiceInsights,
    ...flattenedForms
  ];
  return _.sortBy(mergedNotes, 'sort_timestamp').reverse();
}
