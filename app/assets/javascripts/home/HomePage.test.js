import React from 'react';
import ReactDOM from 'react-dom';
import fetchMock from 'fetch-mock/es5/client';
import HomePage from './HomePage';
import SpecSugar from '../../../../spec/javascripts/support/spec_sugar.jsx';
import homeFeedJson from '../../../../spec/javascripts/fixtures/home_feed_json';
import unsupportedLowGradesJson from '../../../../spec/javascripts/fixtures/home_unsupported_low_grades_json';

beforeEach(() => {
  fetchMock.restore();
  fetchMock.get('/home/feed_json?limit=20', homeFeedJson);
  fetchMock.get('/home/unsupported_low_grades_json', unsupportedLowGradesJson);
});

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<HomePage />, div);
});

SpecSugar.withTestEl('integration tests', container => {
  it('renders everything after fetch', done => {
    const el = container.testEl;
    ReactDOM.render(<HomePage />, el);
    expect(el.innerHTML).toContain("What's happening?");
    expect(el.innerHTML).toContain("How can we adapt?");

    setTimeout(() => {
      expect(el.innerHTML).toContain("Unsupported students");
      expect($(el).find('.EventNoteCard').length).toEqual(19);
      expect($(el).find('.BirthdayCard').length).toEqual(1);
      done();
    }, 0);
  });
});