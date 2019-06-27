import React from 'react';
import moment from 'moment';
import {mount} from 'enzyme';
import {createStudents} from './DashboardTestData';
import StudentsTable from './StudentsTable';


function testRender(options = {}) {
  const nowMoment = options.nowMoment || moment.utc();
  const context = { nowFn(){ return nowMoment; } };
  const table = mount(
    <StudentsTable
      rows={createStudents(nowMoment)}
      incidentType={"Test Incidents"}
      resetFn={(value) => null}
      forcedSizeForTesting={{width: 1000, height: 600}} />
    , {context});
  return table;
}


it('renders the students list', () => {
  const table = testRender();
  expect(table.find("div").first().hasClass("StudentsTable")).toEqual(true);
});

it('renders headers for name, incident count and latest note', () => {
  const table = testRender();
  const headerTexts = table.find('.ReactVirtualized__Table__headerColumn').map(node => node.text());
  expect(headerTexts).toEqual(['Name', 'Grade', 'Test Incidents', 'Last note']);
});

it('renders the first row', () => {
  const nowMoment = moment.utc();
  const table = testRender({nowMoment});
  const cellTexts = table.find('.ReactVirtualized__Table__row').first().find('.ReactVirtualized__Table__rowColumn').map(node => node.text());
  expect(cellTexts).toEqual([
    "Pierrot Zanni",
    "4",
    "3",
    'SST30 days',
  ]);
});

it('tallies the total events', () => {
  const table = testRender();
  expect(table.instance().renderTotalEvents()).toEqual(12);
});

it('orders the students by total events by default', () => {
  const table = testRender();
  expect(table.instance().orderedRows()[5].first_name).toEqual("Arlecchino");
});

it('orders students by name when Name is clicked', () => {
  const table = testRender();
  table.find('.ReactVirtualized__Table__headerColumn').first().simulate('click');
  expect(table.state().sortBy).toEqual("name");
  expect(table.find('.ReactVirtualized__Table__rowColumn').first().text()).toEqual('Scaramuccia Avecchi');
});

it('reorders in reverse alphabetical order', () => {
  const table = testRender();
  table.find('.ReactVirtualized__Table__headerColumn').first().simulate('click');
  table.find('.ReactVirtualized__Table__headerColumn').first().simulate('click');
  expect(table.state().sortBy).toEqual("name");
  expect(table.find('.ReactVirtualized__Table__rowColumn').first().text()).toEqual('Arlecchino ZZanni');
});

it('orders students by events when Grades is clicked', () => {
  const table = testRender();
  table.find('.ReactVirtualized__Table__headerColumn').at(1).simulate('click');
  expect(table.state().sortBy).toEqual("grade");
});

it('orders students by events when Incidents is clicked', () => {
  const table = testRender();
  table.find('.ReactVirtualized__Table__headerColumn').at(2).simulate('click');
  expect(table.state().sortBy).toEqual("events");
});

it('orders students by events when Last note is clicked', () => {
  const table = testRender();
  table.find('.ReactVirtualized__Table__headerColumn').at(3).simulate('click');
  expect(table.state().sortBy).toEqual("latest_note");
});
