import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import uuidv4 from 'uuid/v4';
import {toSchoolYear} from '../helpers/schoolYear';
import {apiFetchJson, apiPostJson} from '../helpers/apiFetchJson';
import Lifecycle from '../components/Lifecycle';
import Autosaver from './Autosaver';
import GroupingPhases from './GroupingPhases';
import ChooseTeam from './ChooseTeam';
import MakePlan from './MakePlan';
import CreateGroups, {createGroups} from './CreateGroups';
import {initialStudentIdsByRoom} from './studentIdsByRoomFunctions';


// For navigating the workflow and phases of the reading grouping process.
const Phases = {
  CHOOSE_TEAM: 'CHOOSE_TEAM',
  MAKE_PLAN: 'MAKE_PLAN',
  PRIMARY_GROUPS: 'PRIMARY_GROUPS',
  ADDITIONAL_GROUPS: 'ADDITIONAL_GROUPS'
};
export default class ReadingGroupingWorkflow extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      // navigation through workflow
      selectedPhaseKey: Phases.CHOOSE_TEAM,
      allowedPhaseKeys: [Phases.CHOOSE_TEAM],
      editablePhaseKeys: [Phases.CHOOSE_TEAM],

      // ChooseTeam
      team: defaultTeam(props, context),

      // MakePlan
      plan: {
        primaryEducatorIds: [],
        additionalEducatorIds: [],
        planText: ''
      },

      // CreateGroups
      primaryStudentIdsByRoom: null,
      additionalStudentIdsByRoom: null,

      // data on students, from the server
      json: null
    };

    this.isPhaseEditable = this.isPhaseEditable.bind(this);
    this.readSnapshotForSaving = this.readSnapshotForSaving.bind(this);
    this.doSave = this.doSave.bind(this);
    this.fetchReadingDataJson = this.fetchReadingDataJson.bind(this);
    this.onReadingDataLoaded = this.onReadingDataLoaded.bind(this);
  }

  isPhaseEditable(phaseKey) {
    const {editablePhaseKeys} = this.state;
    return editablePhaseKeys.indexOf(phaseKey) !== -1;
  }

  readSnapshotForSaving() {
    const {groupingWorkspaceId} = this.state;
    if (!groupingWorkspaceId) return null;

    return _.omit(this.state, ['selectedPhaseKey', 'json']);
  }

  // Make the save request without any guards
  doSave() {
    const {nowFn} = this.context;
    const now = nowFn();
    const snapshotForSaving = this.readSnapshotForSaving();
    const {groupingWorkspaceId} = snapshotForSaving;

    const payload = {
      school_id: snapshotForSaving.team.schoolId,
      grade: snapshotForSaving.team.grade,
      benchmark_school_year: snapshotForSaving.team.benchmarkSchoolYear,
      benchmark_period_key: snapshotForSaving.team.benchmarkPeriodKey,
      snapshot_json: {
        ...snapshotForSaving,
        clientNowMs: now.unix()
      }
    };
    const url = `/api/reading/grouping_snapshot_json/${groupingWorkspaceId}`;
    return apiPostJson(url, payload).then(() => {
      return Promise.resolve(snapshotForSaving);
    });
  }

  // Requires team to be picked (not enforced)
  // Guards to only fetch once.
  fetchReadingDataJson() {
    const {teams} = this.props;
    const {team, json} = this.state;
    if (json !== null) return;

    const {schoolId, grade} = team;
    const schoolSlug = _.find(teams.schools, {id: schoolId}).slug;
    const url = `/api/schools/${schoolSlug}/reading/${grade}/reading_json`;
    apiFetchJson(url).then(this.onReadingDataLoaded);
  }

  // At this point, we start saving.
  onReadingDataLoaded(json) {
    this.setState({
      groupingWorkspaceId: uuidv4(),
      json
    });
  }

  render() {
    const {allowedPhaseKeys, selectedPhaseKey} = this.state;
    return (
      <div style={styles.root}>
        <Autosaver
          readSnapshotFn={this.readSnapshotForSaving}
          doSaveFn={this.doSave}
          autoSaveIntervalMs={2000}
        >
          <GroupingPhases
            style={styles.flexVertical}
            contentStyle={styles.flexVertical}
            allowedPhaseKeys={allowedPhaseKeys}
            selectedPhaseKey={selectedPhaseKey}
            onPhaseChanged={selectedPhaseKey => this.setState({selectedPhaseKey})}
            phaseLabels={{
              [Phases.CHOOSE_TEAM]: 'Choose your grade',
              [Phases.MAKE_PLAN]: 'Make a plan',
              [Phases.PRIMARY_GROUPS]: 'Create primary groups',
              [Phases.ADDITIONAL_GROUPS]: 'Choose additional groups'
            }}
            renderFn={() => (
              <div style={{...styles.flexVertical, margin: 20}}>
                {selectedPhaseKey === Phases.CHOOSE_TEAM && this.renderChooseTeam()}
                {selectedPhaseKey === Phases.MAKE_PLAN && this.renderMakePlan()}
                {selectedPhaseKey === Phases.PRIMARY_GROUPS && this.renderPrimaryGroups()}
                {selectedPhaseKey === Phases.ADDITIONAL_GROUPS && this.renderAdditionalGroups()}
              </div>
            )}
          />
        </Autosaver>
      </div>
    );
  }

  renderChooseTeam() {
    const {teams} = this.props;
    const {team} = this.state;
    return (
      <ChooseTeam
        isEditable={this.isPhaseEditable(Phases.CHOOSE_TEAM)}
        team={team}
        onTeamChanged={team => this.setState({team})}
        teams={teams}
        onDone={() => {
          this.setState({
            selectedPhaseKey: Phases.MAKE_PLAN,
            editablePhaseKeys: [
              Phases.MAKE_PLAN
            ],
            allowedPhaseKeys: [
              Phases.CHOOSE_TEAM,
              Phases.MAKE_PLAN
            ]
          });
        }}
      />
    );
  }

  // At this phase, also prefetch student data
  renderMakePlan() {
    const {teams} = this.props;
    const {plan} = this.state;
    return (
      <Lifecycle componentWillMount={this.fetchReadingDataJson}>
        <MakePlan
          isEditable={this.isPhaseEditable(Phases.MAKE_PLAN)}
          plan={plan}
          onPlanChanged={plan => this.setState({plan})}
          educators={teams.educators}
          onDone={() => {
            this.setState({
              selectedPhaseKey: Phases.PRIMARY_GROUPS,
              editablePhaseKeys: [
                Phases.PRIMARY_GROUPS,
                Phases.ADDITIONAL_GROUPS
              ],
              allowedPhaseKeys: [
                Phases.CHOOSE_TEAM,
                Phases.MAKE_PLAN,
                Phases.PRIMARY_GROUPS,
                Phases.ADDITIONAL_GROUPS
              ]
            });
          }}
        />
      </Lifecycle>
    );
  }

  renderPrimaryGroups() {
    const {json} = this.state;
    if (!json) return null;

    const {plan, primaryStudentIdsByRoom} = this.state;
    return this.renderGroupsGeneric({
      phaseKey: Phases.PRIMARY_GROUPS,
      educatorIds: plan.primaryEducatorIds,
      studentIdsByRoom: primaryStudentIdsByRoom,
      onStudentIdsByRoomChanged: ({studentIdsByRoom}) => this.setState({primaryStudentIdsByRoom: studentIdsByRoom})
    });
  }

  renderAdditionalGroups() {
    const {json} = this.state;
    if (!json) return null;

    const {plan, additionalStudentIdsByRoom} = this.state;
    return this.renderGroupsGeneric({
      phaseKey: Phases.ADDITIONAL_GROUPS,
      educatorIds: plan.additionalEducatorIds,
      studentIdsByRoom: additionalStudentIdsByRoom,
      onStudentIdsByRoomChanged: ({studentIdsByRoom}) => this.setState({additionalStudentIdsByRoom: studentIdsByRoom})
    });
  }

  renderGroupsGeneric(params = {}) {
    const {
      phaseKey,
      educatorIds,
      studentIdsByRoom,
      onStudentIdsByRoomChanged
    } = params;
    const {teams} = this.props;
    const {team, json} = this.state;
    const classrooms = _.sortBy(educatorIds.map(id => {
      const educator = _.find(teams.educators, {id});
      return {educator, text: _.last(educator.full_name.split(' '))};
    }), 'text');
    return (
      <CreateGroups
        studentIdsByRoom={studentIdsByRoom || initialStudentIdsByRoom(createGroups(classrooms).length, json.reading_students)}
        onStudentIdsByRoomChanged={onStudentIdsByRoomChanged}
        isEditable={this.isPhaseEditable(phaseKey)}
        grade={team.grade}
        benchmarkPeriodKey={team.benchmarkPeriodKey}
        schoolName={json.school.name}
        doc={json.entry_doc}
        readingStudents={json.reading_students}
        mtssNotes={json.latest_mtss_notes}
        classrooms={classrooms}
      />
    );
  }
}
ReadingGroupingWorkflow.contextTypes = {
  nowFn: PropTypes.func.isRequired
};
ReadingGroupingWorkflow.propTypes = {
  defaultSchoolSlug: PropTypes.string,
  defaultGrade: PropTypes.string,
  teams: PropTypes.shape({
    schools: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired
    })).isRequired,
    grades: PropTypes.arrayOf(PropTypes.string).isRequired,
    educators: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired,
      full_name: PropTypes.string.isRequired
    })).isRequired,
    benchmarkWindows: PropTypes.arrayOf(PropTypes.shape({
      benchmark_school_year: PropTypes.number.isRequired,
      benchmark_period_key: PropTypes.string.isRequired
    })).isRequired
  }).isRequired,
  autoSaveIntervalMs: PropTypes.number
};
ReadingGroupingWorkflow.defaultProps = {
  autoSaveIntervalMs: 2000
};

const styles = {
  root: {
    fontSize: 14,
    width: '100%',
    display: 'flex',
    flex: 1,
    flexDirection: 'column'
  },
  flexVertical: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column'
  }
};

function defaultTeam(props, context) {
  const maybeSchool = _.find(props.teams.schools, {slug: props.defaultSchoolSlug});
  return {
    schoolId: maybeSchool ? maybeSchool.id : null,
    grade: props.defaultGrade || null,
    benchmarkSchoolYear: toSchoolYear(context.nowFn().toDate()),
    benchmarkPeriodKey: null
  };
}
