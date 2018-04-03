import React from 'react';
import {mount} from 'enzyme';
import App from './App';
import HomePage from '../app/assets/javascripts/home/HomePage';
import EducatorPage from '../app/assets/javascripts/educator/EducatorPage';
import SchoolCoursesPage from '../app/assets/javascripts/school_courses/SchoolCoursesPage';

import {MemoryRouter} from 'react-router-dom';


function renderPath(path, options = {}) {
  const educator = options.educator || createSerializedDataEducator();
  return (
    <MemoryRouter initialEntries={[path]}>
      <App currentEducator={educator} />
    </MemoryRouter>
  );
}

// For testing, which mirrors the output of ui_controller#ui on the
// server.
function createSerializedDataEducator(props = {}) {
  return {
    id: 9999,
    admin: false,
    school_id: 99,
    labels: [],
    ...props
  };
}


it('renders HomePage without crashing', () => {
  const wrapper = mount(renderPath('/home'));
  expect(wrapper.contains(
    <HomePage educatorId={9999} educatorLabels={[]} />
  )).toEqual(true);
});

it('renders EducatorPage without crashing', () => {
  const wrapper = mount(renderPath('/educators/view/12'));
  expect(wrapper.contains(
    <EducatorPage educatorId={12} />
  )).toEqual(true);
});

it('render SchoolCoursesPage without crashing', () => {
  const wrapper = mount(renderPath('/schools/hea/courses'));
  expect(wrapper.contains(
    <SchoolCoursesPage schoolId="hea" />
  )).toEqual(true);
});

describe('unknown route', () => {
  // This has to temporarily remove the Jest setup code 
  // that fails the test when console.warn is triggered.
  var consoleWarn = null; // eslint-disable-line no-var
  beforeEach(() => {
    consoleWarn = console.warn; // eslint-disable-line no-console
    console.warn = jest.fn(); // eslint-disable-line no-console
  });

  afterEach(() => {
    console.warn = consoleWarn; // eslint-disable-line no-console
  });
  
  it('calls console.warn', () => {
    mount(renderPath('/fdsjfkdsjkflsdjfs'));
    expect(console.warn).toHaveBeenCalled(); // eslint-disable-line no-console
  });
});