import PropTypes from 'prop-types';
import React from 'react';
import {storiesOf} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import storybookFrame from './storybookFrame';
import {withDefaultNowContext} from '../testing/NowContainer';
import CreateYourLists from './CreateYourLists';
import {
  consistentlyPlacedInitialStudentIdsByRoom,
  initialStudentIdsByRoom
} from './studentIdsByRoomFunctions';
import {testProps} from './CreateYourLists.test';


function storyProps(props = {}) {
  return {
    ...testProps(),
    onClassListsChanged: action('onClassListsChanged'),
    onExpandVerticallyToggled: action('onExpandVerticallyToggled'),
    ...props
  };
}

function storyRender(props = {}) {
  return storybookFrame(withDefaultNowContext(<Container {...props} />));
}

storiesOf('classlists/CreateYourLists', module) // eslint-disable-line no-undef
  .add("empty", () => storyRender(storyProps({ forceUnplaced: true })))
  .add("2rd grade, 3 classes", () => storyRender(storyProps()))
  .add("2nd grade, 5 classes", () => {
    return storyRender(storyProps({
      classroomsCount: 4,
      gradeLevelNextYear: '2'
    }));
  })
  .add("5th grade, 5 classes", () => {
    return storyRender(storyProps({
      classroomsCount: 4,
      gradeLevelNextYear: '5'
    }));
  })
  
  .add("readonly", () => storyRender(storyProps({ isEditable: false })));


// Container for tracking state changes
class Container extends React.Component {
  constructor(props) {
    super(props);
    const {classroomsCount, students, forceUnplaced} = props;
    const studentIdsByRoom = (forceUnplaced)
      ? initialStudentIdsByRoom(classroomsCount, students)
      : consistentlyPlacedInitialStudentIdsByRoom(classroomsCount, students);

    this.state = {
      studentIdsByRoom
    };
  }

  onClassListsChanged(studentIdsByRoom) {
    this.setState({studentIdsByRoom});
  }

  render() {
    const {studentIdsByRoom} = this.state;
    return <CreateYourLists
      {...this.props}
      studentIdsByRoom={studentIdsByRoom}
      onClassListsChanged={this.onClassListsChanged.bind(this)} />;
  }
}
Container.propTypes = {
  classroomsCount: PropTypes.number.isRequired,
  students: PropTypes.array.isRequired,
  forceUnplaced: PropTypes.bool
};