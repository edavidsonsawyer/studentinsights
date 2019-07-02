import React from 'react';
import ReactDOM from 'react-dom';
import renderer from 'react-test-renderer';
import fetchMock from 'fetch-mock/es5/client';
import DistrictEnrollmentPage, {DistrictEnrollmentPageView} from './DistrictEnrollmentPage';
import districtEnrollmentJson from './districtEnrollmentJson';

function testProps(props = {}) {
  return {
    ...props
  };
}

beforeEach(() => {
  fetchMock.restore();
  fetchMock.get('/api/district/enrollment_json', districtEnrollmentJson);
});

it('renders without crashing', () => {
  const props = testProps();
  const el = document.createElement('div');
  ReactDOM.render(<DistrictEnrollmentPage {...props} />, el);
});

it('renders everything after fetch', done => {
  const props = testProps();
  const el = document.createElement('div');
  ReactDOM.render(<DistrictEnrollmentPage {...props} />, el);

  setTimeout(() => {
    expect($(el).find('table tbody tr').length).toEqual(6);
    done();
  }, 0);
});

describe('DistrictEnrollmentPageView', () => {
  it('pure component matches snapshot', () => {
    const tree = renderer
      .create(<DistrictEnrollmentPageView
        enrollments={districtEnrollmentJson.enrollments}
        districtKey={districtEnrollmentJson.district_key}
        districtName={districtEnrollmentJson.district_name} />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});


