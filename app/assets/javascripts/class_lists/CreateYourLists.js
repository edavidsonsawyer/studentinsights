import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {AutoSizer} from 'react-virtualized';
import StudentCard from './StudentCard';
import ClassroomStats from './ClassroomStats';
import {studentsInRoom} from './studentIdsByRoomFunctions';
import {DragDropContext, Droppable} from 'react-beautiful-dnd';
import {
  reordered,
  insertedInto,
  UNPLACED_ROOM_KEY,
  createRooms
} from './studentIdsByRoomFunctions';


// This is the main UI for creating classroom lists.  It shows cards for each student,
// lets the user drag them around to different classroom lists, shows summary statistics
// comparing each room, and lets users click on students to see more.
export default class CreateYourListsView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      highlightKey: null
    };
    this.onDragEnd = this.onDragEnd.bind(this);
    this.onCategorySelected = this.onCategorySelected.bind(this);
  }

  onDragEnd(dragEndResult) {
    const {onClassListsChanged, studentIdsByRoom} = this.props;
    const updatedStudentIdsByRoom = studentIdsByRoomAfterDrag(studentIdsByRoom, dragEndResult);
    onClassListsChanged(updatedStudentIdsByRoom);
  }

  onCategorySelected(highlightKey) {
    this.setState({highlightKey});
  }

  onSort(roomKey) {
    const {students, studentIdsByRoom, onClassListsChanged} = this.props;
    const roomStudentIdsSortedByName = _.sortBy(studentIdsByRoom[roomKey], studentId => {
      const student = _.find(students, {id: studentId});
      return (student) ? `${student.last_name}, ${student.first_name}` : null;
    });

    // alow clicking twice to reverse
    const roomStudentIdsSortedByNameConsideringReverse = (_.isEqual(roomStudentIdsSortedByName, studentIdsByRoom[roomKey]))
      ? roomStudentIdsSortedByName.slice().reverse()
      : roomStudentIdsSortedByName;
    onClassListsChanged({
      ...studentIdsByRoom,
      [roomKey]: roomStudentIdsSortedByNameConsideringReverse
    });
  }

  render() {
    const {
      students,
      classroomsCount,
      studentIdsByRoom,
      gradeLevelNextYear,
      isExpandedVertically,
      onExpandVerticallyToggled
    } = this.props;
    const {highlightKey} = this.state;
    const rooms = createRooms(classroomsCount);

    return (
      <div className="CreateYourListsView" style={styles.root}>
        <div style={styles.expandLink} onClick={onExpandVerticallyToggled}>
          {isExpandedVertically ? '▴ Collapse ▴' : '▾ Expand ▾'}
        </div>
        <ClassroomStats
          students={students}
          gradeLevelNextYear={gradeLevelNextYear}
          rooms={rooms.filter(room => room.roomKey !== UNPLACED_ROOM_KEY)}
          studentIdsByRoom={studentIdsByRoom}
          highlightKey={highlightKey}
          onCategorySelected={this.onCategorySelected}/>
        {this.renderLists(rooms)}
      </div>
    );
  }

  renderLists(rooms) {
    const {isEditable, students, studentIdsByRoom, isExpandedVertically} = this.props;
    const expandedStyles = isExpandedVertically ? { height: '90em' } : { flex: 1 }; // estimating 30 students with 3em per card
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <div style={{...styles.listsContainer, ...expandedStyles}}>
          {rooms.map(room => {
            const {roomKey, roomName} = room;
            const classroomStudents = studentsInRoom(students, studentIdsByRoom, roomKey);
            return (
              <div key={roomKey} style={styles.classroomListColumn}>
                <div>
                  <div style={styles.roomTitle}>
                    <span style={{fontWeight: 'bold'}}>{roomName}</span>
                    <span style={styles.roomSortLink} onClick={this.onSort.bind(this, roomKey)}>sort</span>
                    <span style={styles.roomStudentCount}>({classroomStudents.length})</span>
                  </div>
                </div>
                <div style={{flex: 1}}>
                  <AutoSizer disableWidth>{({height}) => (
                    <Droppable
                      droppableId={roomKey}
                      type="CLASSROOM_LIST"
                      isDropDisabled={!isEditable}>
                      {(provided, snapshot) => (
                        <div ref={provided.innerRef} style={{...styles.droppable, height}}>
                          <div>{classroomStudents.map(this.renderStudentCard, this)}</div>
                          <div>{provided.placeholder}</div>
                        </div>
                      )}
                    </Droppable>
                  )}</AutoSizer>
                </div>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    );
  }

  renderStudentCard(student, index) {
    const {fetchProfile, isEditable, styleStudentFn} = this.props;
    const {highlightKey} = this.state;
    return <StudentCard
      key={student.id}
      highlightKey={highlightKey}
      style={styleStudentFn && styleStudentFn(student)}
      student={student}
      index={index}
      fetchProfile={fetchProfile}
      isEditable={isEditable} />;
  }
}
CreateYourListsView.propTypes = {
  isEditable: PropTypes.bool.isRequired,
  isExpandedVertically: PropTypes.bool.isRequired,
  classroomsCount: PropTypes.number.isRequired,
  gradeLevelNextYear: PropTypes.string.isRequired,
  students: PropTypes.array.isRequired,
  studentIdsByRoom: PropTypes.object.isRequired,
  fetchProfile: PropTypes.func.isRequired,
  styleStudentFn: PropTypes.func,
  onClassListsChanged: PropTypes.func.isRequired,
  onExpandVerticallyToggled: PropTypes.func.isRequired,
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


const styles = {
  root: {
    userSelect: 'none',
    msUserSelect: 'none',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    position: 'relative' // for expandLink
  },
  listsContainer: {
    display: 'flex'
  },
  classroomListColumn: {
    padding: 20,
    paddingLeft: 10,
    paddingRight: 10,
    display: 'flex',
    flex: 1,
    flexDirection: 'column'
  },
  droppable: {
    border: '1px solid #ccc',
    background: '#eee',
    padding: 3,
    borderRadius: 3,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 150,
    overflowY: 'scroll'
  },
  roomTitle: {
    border: '1px solid #aaa',
    borderBottom: 0,
    background: '#aaa',
    borderRadius: 3,
    fontSize: 14,
    padding: 10,
    // to place this over the rounded border right below
    position: 'relative',
    top: 3
  },
  roomSortLink: {
    cursor: 'pointer',
    paddingLeft: 10,
    color: '#666',
    fontSize: 12
  },
  roomStudentCount: {
    float: 'right',
    color: '#666',
    fontSize: 12
  },
  expandLink: {
    position: 'absolute',
    padding: 10,
    left: 0,
    right: 0,
    textAlign: 'center',
    bottom: -20,
    cursor: 'pointer'
  }
};

// Style changes based on whether the student has been moved from teacher to principal lists.
export function styleStudentFn(movedStudentIds, student) {
  return (movedStudentIds.indexOf(student.id) !== -1)
    ? { fontWeight: 'bold', color: '#e5370e' }
    : {};
}