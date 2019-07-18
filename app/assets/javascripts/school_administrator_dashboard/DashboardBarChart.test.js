import React from 'react';
import { shallow } from 'enzyme';
import DashboardBarChart from './DashboardBarChart';
import HighchartsWrapper from '../components/HighchartsWrapper';

describe('DashboardBarChart', () => {
  const chart = shallow(<DashboardBarChart
    id="1" categories={{}} seriesData={[]} titleText="Title" measureText="Measure" tooltip={{}}
  />);

  it('should render a highcharts wrapper', () => {
    expect(chart.find(HighchartsWrapper).length).toEqual(1);
  });
});
