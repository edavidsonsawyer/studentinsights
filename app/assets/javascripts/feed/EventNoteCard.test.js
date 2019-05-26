import React from 'react';
import ReactDOM from 'react-dom';
import renderer from 'react-test-renderer';
import EventNoteCard from './EventNoteCard';
import {withDefaultNowContext} from '../testing/NowContainer';
import PerDistrictContainer from '../components/PerDistrictContainer';

function testProps(props = {}) {
  return {
    eventNoteCardJson: {
      id: 321,
      recorded_at: '2004-03-05T00:00:00.000Z',
      event_note_type_id: 305,
      text: 'hello!',
      educator: {
        id: 4,
        email: 'kt@demo.studentinsights.org',
        full_name: 'Teacher, Kevin',
      },
      student: {
        id: 55,
        first_name: 'Mari',
        last_name: 'Skywalker',
        grade: '9',
        house: 'Beacon',
        has_photo: true,
        school: {
          local_id: 'SHS',
          school_type: 'HS'
        },
        homeroom: {
          id: 13,
          name: 'SHS-052',
          educator: {
            id: 5,
            email: 'lt@demo.studentinsights.org',
            full_name: 'Teacher, Lois',
          }
        }
      }
    },
    ...props
  };
}

function testEl(props = {}, context = {}) {
  const districtKey = context.districtKey || 'somerville';
  return withDefaultNowContext(
    <PerDistrictContainer districtKey={districtKey}>
      <EventNoteCard {...props} />
    </PerDistrictContainer>
  );
}

it('renders without crashing', () => {
  const props = testProps();
  const el = document.createElement('div');
  ReactDOM.render(testEl(props), el);
});

it('matches snapshot', () => {
  const props = testProps();
  const tree = renderer
    .create(testEl(props))
    .toJSON();
  expect(tree).toMatchSnapshot();
});

it('snaphots when passing alternate children', () => {
  const props = testProps({children: <b>hello!</b>});
  const tree = renderer
    .create(testEl(props))
    .toJSON();
  expect(tree).toMatchSnapshot();
});

it('renders when student has no homeroom', () => {
  const props = testProps();
  delete props.eventNoteCardJson.student.homeroom;
  const el = document.createElement('div');
  ReactDOM.render(testEl(props), el);
});
