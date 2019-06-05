import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {DragDropContext, Droppable, Draggable} from 'react-beautiful-dnd';
import SectionHeading from '../components/SectionHeading';
import StudentPhoto from '../components/StudentPhoto';
import MockStudentPhoto from '../components/MockStudentPhoto';
import DibelsBreakdownBar from '../components/DibelsBreakdownBar';
import FountasAndPinnellLevelChart from './FountasAndPinnellLevelChart';
import SidebarDialog from './SidebarDialog';
import {readDoc} from './readingData';
import {
  DIBELS_DORF_WPM, 
  DIBELS_DORF_ACC,
  F_AND_P_ENGLISH,
  INSTRUCTIONAL_NEEDS,
  somervilleReadingThresholdsFor
} from './thresholds';
import {
  reordered,
  insertedInto,
  UNPLACED_ROOM_KEY
} from './studentIdsByRoomFunctions';


// For making and reviewing reading groups.
export default class CreateGroups extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dialogForStudentId: null
    };
    this.onDragEnd = this.onDragEnd.bind(this);
  }

  onStudentClicked(studentId) {
    const dialogForStudentId = (studentId === null || studentId === this.state.dialogForStudentId)
      ? null
      : studentId;
    this.setState({dialogForStudentId});
  }

  onDragEnd(dragEndResult) {
    const {studentIdsByRoom, onStudentIdsByRoomChanged} = this.props;
    const updatedStudentIdsByRoom = studentIdsByRoomAfterDrag(studentIdsByRoom, dragEndResult);
    onStudentIdsByRoomChanged({studentIdsByRoom: updatedStudentIdsByRoom});
  }

  render() {
    const {readingStudents, studentIdsByRoom, classrooms} = this.props;
    const {dialogForStudentId} = this.state;
    return (
      <div className="CreateGroups" style={styles.root}>
        <SectionHeading>Reading Groups: 3rd grade at Arthur D. Healey</SectionHeading>
        {dialogForStudentId && this.renderDialog(dialogForStudentId)}
        <DragDropContext onDragEnd={this.onDragEnd}>
          <div>
            {createGroups(classrooms).map((group, groupIndex) => {
              const {groupKey} = group;
              const studentsInRoom = studentIdsByRoom[groupKey].map(studentId => {
                return _.find(readingStudents, { id: studentId });
              });
              return this.renderRow(group, groupIndex, studentsInRoom);
            })}
          </div>
        </DragDropContext>
      </div>
    );
  }

  renderDialog(dialogForStudentId) {
    const {readingStudents, mtssNotes, doc, grade, benchmarkPeriodKey} = this.props;
    const student = _.find(readingStudents, {id: dialogForStudentId});
    return (
      <div style={styles.dialog}>
        <SidebarDialog
          style={{zIndex: 20}}
          student={student}
          mtssNotesForStudent={mtssNotes.filter(note => note.student_id === student.id)}
          doc={doc}
          grade={grade}
          benchmarkPeriodKey={benchmarkPeriodKey}
          onClose={this.onStudentClicked.bind(this, null)} />
      </div>
    );
  }

  renderRow(group, groupIndex, studentsInGroup) {
    const {text, groupKey} = group;
    return (
      <div key={groupKey} style={styles.rowContainer}>
        {this.renderGroupName(groupKey, groupIndex, text, studentsInGroup)}
        <Droppable
          droppableId={groupKey}
          direction="horizontal"
          type="GROUP">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              style={styles.droppable}
              {...provided.droppableProps}
            >
              {studentsInGroup.map(this.renderDraggable, this)}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    );
  }

  renderDraggable(student, index) {
    // disableDraggingForSnapshotTest is because of this error in the snapshot test,
    // after upgrading from  react-beautiful-dnd 6 > 11.0.02:
    // `Error: Uncaught [Error: Invariant failed: Drag handle could not obtain draggable ref]`
    //
    // This approach works around to disable the problem within `useFocusRetainer` and keep
    // the major value in the test, which isn't about testing the Draggable interaction anway.
    const {disableDraggingForSnapshotTest} = this.props;
    return (
      <Draggable
        key={student.id}
        draggableId={`StudentCard:${student.id}`}
        index={index}
        isDragDisabled={disableDraggingForSnapshotTest}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            {this.renderItem(student)}
          </div>
        )}
      </Draggable>
    );
  }

  renderGroupName(groupKey, groupIndex, classroomText, studentsInGroup) {
    const {doc, grade, benchmarkPeriodKey} = this.props;
    const width = 80;
    const height = 22;
    const fnpLevels = _.sortBy(_.uniq(_.compact(studentsInGroup.map(student => {
      return readDoc(doc, student.id, F_AND_P_ENGLISH);
    }))));
    const wpms = _.sortBy(_.uniq(_.compact(studentsInGroup.map(student => {
      return readDoc(doc, student.id, DIBELS_DORF_WPM);
    }))));
    const accs = _.sortBy(_.uniq(_.compact(studentsInGroup.map(student => {
      return readDoc(doc, student.id, DIBELS_DORF_ACC);
    }))));
    const instructionalNeeds = _.sortBy(_.uniq(_.compact(studentsInGroup.map(student => {
      return readDoc(doc, student.id, INSTRUCTIONAL_NEEDS);
    }))));
    return (
      <div style={styles.row}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '3em',
          background: pickGroupColor(groupIndex),
          color: 'white',
          overflow: 'hidden'
        }}>
          <div style={{transform: 'rotate(-90deg)', whiteSpace: 'nowrap'}}>{classroomText}</div>
        </div>
        <div style={{padding: 5, paddingLeft: 10, paddingRight: 10, marginRight: 5, borderRight: '1px solid #ddd'}}>
          <div style={{display: 'flex', flexDirection: 'row', height, alignItems: 'center'}}>
            <div style={{width}}>F&P: {fAndPRange(fnpLevels)}</div>
            <div style={{width, height}}>
              <FountasAndPinnellLevelChart
                height={height}
                markerWidth={2}
                levels={onlyValid(fnpLevels)}
                isForSingleFixedGradeLevel={true}
              />
            </div>
          </div>
          <div style={{paddingTop: 10, display: 'flex', flexDirection: 'row', height, alignItems: 'center'}}>
            <div style={{width}}>ORF accuracy</div>
            <div>{renderDibelsAccuracy(grade, benchmarkPeriodKey, accs)}</div>
          </div>
          <div style={{paddingTop: 20, display: 'flex', flexDirection: 'row', height, alignItems: 'center'}}>
            <div style={{width}}>ORF fluency</div>
            <div>{renderDibelsFluency(grade, benchmarkPeriodKey, wpms)}</div>
          </div>
        </div>
        <div style={{width: '12em', padding: 5, overflowY: 'scroll'}}>
          <div>{instructionalNeeds.map(need => (
            <div key={need} style={{paddingRight: 5}}>{`“${need.trim()}”`}</div>
          ))}</div>
        </div>
      </div>
    );
  }

  renderItem(student) {
    const useAltStyles = window.location.search.indexOf('original') === -1;
    const useMockPhoto = (this.props.useMockPhoto || window.location.search.indexOf('mock') !== -1);
    const photoProps = {
      key: student.id,
      style: (useAltStyles ? altStyles.photoImage : originalStyles.photoImage),
      student: student,
      fallbackEl: <span style={styles.fallbackSmiley}>😃</span>,
      alt: '😃'
    };

    return (
      <div
        style={useAltStyles ? altStyles.photoContainer : originalStyles.photoContainer}
        onClick={this.onStudentClicked.bind(this, student.id)}>
        {useMockPhoto
          ? <MockStudentPhoto {...photoProps} />
          : <StudentPhoto {...photoProps} />}
        <div style={styles.photoCaption}>{student.first_name}</div>
      </div>
    );
  }
}
CreateGroups.contextTypes = {
  districtKey: PropTypes.string.isRequired,
  nowFn: PropTypes.func.isRequired
};
CreateGroups.propTypes = {
  studentIdsByRoom: PropTypes.object.isRequired,
  onStudentIdsByRoomChanged: PropTypes.func.isRequired,
  schoolName: PropTypes.string.isRequired,
  grade: PropTypes.string.isRequired,
  benchmarkPeriodKey: PropTypes.string.isRequired,
  readingStudents: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired
  })).isRequired,
  classrooms: PropTypes.arrayOf(PropTypes.shape({
    text: PropTypes.string.isRequired
  })).isRequired,
  doc: PropTypes.object.isRequired,
  mtssNotes: PropTypes.arrayOf(PropTypes.shape({
    student_id: PropTypes.number.isRequired,
    id: PropTypes.number.isRequired,
    recorded_at: PropTypes.string.isRequired,
  })).isRequired,
  useMockPhoto: PropTypes.bool,
  disableDraggingForSnapshotTest: PropTypes.bool
};

const PHOTO_MAX_WIDTH = 60;
const ROW_HEIGHT = 100;
const styles = {
  root: {
    position: 'relative'
  },
  rowContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    margin: 5,
    marginBottom: 10
  },
  row: {
    display: 'flex',
    fontSize: 12,
    marginRight: 5,
    height: ROW_HEIGHT,
    background: '#f8f8f8',
    color: 'black',
    border: '1px solid #eee'
  },
  droppable: {
    display: 'flex',
    flex: 1,
    backgroundColor: '#f8f8f8',
    overflowX: 'scroll'
  },
  fallbackSmiley: {
    position: 'absolute',
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: '#333',
    width: '100%',
    height: '100%',
    paddingTop: 5,
    opacity: 0.9
  },
  dialog: {
    position: 'fixed',
    width: 250,
    right: 0,
    top: 120,
    bottom: 20,
    background: 'white',
    border: '1px solid #999',
    borderRadius: 3,
    boxShadow: '2px 2px 1px #ccc',
    padding: 15,
    paddingTop: 5,
    zIndex: 10
  },
  photoCaption: {
    position: 'absolute',
    left: 2,
    bottom: 0,
    fontSize: 10,
    color: '#f8f8f8',
    textShadow: '-1px 0 #333, 0 1px #333, 1px 0 #333, 0 -1px #333'
  }
};

const originalStyles = {
  photoContainer: {
    position: 'relative',
    width: 60,
    height: 100,
    marginRight: 5,
    fontSize: 32
  },
  photoImage: {
    position: 'absolute',
    maxWidth: PHOTO_MAX_WIDTH,
    maxHeight: ROW_HEIGHT,
    boxShadow: '2px 2px 1px #ccc'
  }
};
const altStyles = {
  photoContainer: {
    position: 'relative',
    overflow: 'hidden',
    width: 60,
    height: '100%',
    marginRight: 5,
    fontSize: 32
  },
  photoImage: {
    position: 'absolute',
    width: 90,
    left: -15,
    top: -5,
    boxShadow: '2px 2px 1px #ccc'
  }
};


// Update the `studentIdsByRoom` map after a drag ends.
export function studentIdsByRoomAfterDrag(studentIdsByRoom, dragEndResult) {
  const {draggableId, source, destination} = dragEndResult;

  // Not moved
  if (destination === null) return studentIdsByRoom;

  const sourceStudentIds = studentIdsByRoom[source.droppableId];
  const destinationStudentIds = studentIdsByRoom[destination.droppableId];
  const draggableStudentId = _.find(sourceStudentIds, studentId => `StudentCard:${studentId}` === draggableId);

  // Moving within the same list
  if (source.droppableId === destination.droppableId) {
    return {
      ...studentIdsByRoom,
      [source.droppableId]: reordered(sourceStudentIds, source.index, destination.index)
    };
  }

  // Moving to another list
  if (source.droppableId !== destination.droppableId) {
    return {
      ...studentIdsByRoom,
      [source.droppableId]: _.without(sourceStudentIds, draggableStudentId),
      [destination.droppableId]: insertedInto(destinationStudentIds, destination.index, draggableStudentId)
    };
  }
}

function onlyValid(fAndPs) {
  return fAndPs.filter(fAndP => {
    if (fAndP.length !== 1) return false;
    if (fAndP.toUpperCase().charCodeAt() < 'A'.charCodeAt()) return false;
    if (fAndP.toUpperCase().charCodeAt() > 'Z'.charCodeAt()) return false;
    return true;
  });
}

function fAndPRange(fAndPs) {
  const sortedValidValues = _.sortBy(onlyValid(fAndPs));
  if (sortedValidValues.length === 0) return null;
  if (sortedValidValues.length === 1) return sortedValidValues[0];

  return [_.first(sortedValidValues), _.last(sortedValidValues)].join(' to ');
}

export function createGroups(classrooms) {
  const unplacedGroup = {
    groupKey: UNPLACED_ROOM_KEY,
    text: 'Not placed'
  };
  return [unplacedGroup].concat(classrooms.map((classroom, index) => {
    return {
      ...classroom,
      groupKey: ['room', index].join(':')
    };
  }));
}

const colors = [
  '#31AB39',
  '#EB4B26',
  '#139DEA',
  '#333333',
  '#CDD71A',
  '#6A2987',
  '#fdbf6f',
  '#ff7f00',
  '#cab2d6',
  '#6a3d9a',
  '#ffff99',
  '#b15928',
];
function pickGroupColor(groupIndex) {
  // return colors[parseInt(hash(homeroomText), 16) % colors.length];
  return colors[groupIndex];
}

function renderDibelsFluency(grade, benchmarkPeriodKey, values) {
  const dibelsCounts = computeDibelsCounts(DIBELS_DORF_WPM, grade, benchmarkPeriodKey, values);
  return renderDibelsBar(dibelsCounts);
}

function renderDibelsAccuracy(grade, benchmarkPeriodKey, values) {
  const dibelsCounts = computeDibelsCounts(DIBELS_DORF_ACC, grade, benchmarkPeriodKey, values);
  return renderDibelsBar(dibelsCounts);
}

function renderDibelsBar(props = {}) {
  const {core, strategic, intensive} = props;
  const height = 5;
  return (
    <DibelsBreakdownBar
      style={{height, width: 80}}
      height={height}
      labelTop={6}
      isFlipped={true}
      coreCount={core}
      strategicCount={strategic}
      intensiveCount={intensive}
    />
  );
}
renderDibelsBar.propTypes = {
  core: PropTypes.number.isRequired,
  strategic: PropTypes.number.isRequired,
  intensive: PropTypes.number.isRequired
};


// Returns {coreCount, straetgi}
function computeDibelsCounts(benchmarkAssessmentKey, grade, benchmarkPeriodKey, values) {
  const thresholds = somervilleReadingThresholdsFor(benchmarkAssessmentKey, grade, benchmarkPeriodKey);
  const initialCounts = {
    core: 0,
    strategic: 0,
    intensive: 0
  };
  return values.reduce((counts, value) => {
    if (value >= thresholds.benchmark) return {...counts, core: counts.core + 1};
    if (value <= thresholds.risk) return {...counts, intensive: counts.intensive + 1};
    return {...counts, strategic: counts.strategic + 1};
  }, initialCounts);
}
