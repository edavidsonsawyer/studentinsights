import React from 'react';
import PropTypes from 'prop-types';
import SimpleFilterSelect from './SimpleFilterSelect';
import {
  firstDayOfSchoolForMoment,
  toSchoolYear,
  firstDayOfSchool
} from '../helpers/schoolYear';


// A UI component for selecting a time range.  It limits date range choices
// to ones that are most relevant or useful for teachers (ie, it's opinionated about
// only looking at recent data rather than allowing arbitrary dates as endpoints).
export default function SelectTimeRange(props) {
  const {timeRangeKey, onChange, timeRangeKeys} = props;
  const options = (timeRangeKeys || [
    TIME_RANGE_45_DAYS_AGO,
    TIME_RANGE_90_DAYS_AGO,
    TIME_RANGE_SCHOOL_YEAR
  ]).map(timeRangeKey => {
    return { value: timeRangeKey, label: timeRangeText(timeRangeKey) };
  });
  return (
    <SimpleFilterSelect
      searchable={false}
      value={timeRangeKey}
      onChange={onChange}
      options={options} 
      {...props} />
  );
}
SelectTimeRange.propTypes = {
  timeRangeKey: PropTypes.string.isRequired,
  timeRangeKeys: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired
};


// Returns [startMoment, endMoment] range represented by `timeRangeKey`
// at the given `nowMoment`.
export function momentRange(timeRangeKey, nowMoment) {
  const startMoment = {
    [TIME_RANGE_45_DAYS_AGO]: nowMoment.clone().subtract(45, 'days'),
    [TIME_RANGE_90_DAYS_AGO]: nowMoment.clone().subtract(90, 'days'),
    [TIME_RANGE_SCHOOL_YEAR]: firstDayOfSchoolForMoment(nowMoment),
    [TIME_RANGE_FOUR_YEARS]: firstDayOfSchool(toSchoolYear(nowMoment) - 4)
  }[timeRangeKey];

  return [startMoment.startOf('day'), nowMoment.clone().startOf('day')];
}

// Translate to user-facing text
export function timeRangeText(timeRangeKey) {
  return {
    TIME_RANGE_7_DAYS_AGO: 'Last 7 days',
    TIME_RANGE_30_DAYS_AGO: 'Last 30 days',
    TIME_RANGE_45_DAYS_AGO: 'Last 45 days',
    TIME_RANGE_90_DAYS_AGO: 'Last 90 days',
    TIME_RANGE_SCHOOL_YEAR: 'This school year',
    TIME_RANGE_FOUR_YEARS: 'Last four years'
  }[timeRangeKey];
}

export const TIME_RANGE_7_DAYS_AGO = 'TIME_RANGE_7_DAYS_AGO';
export const TIME_RANGE_30_DAYS_AGO = 'TIME_RANGE_30_DAYS_AGO';
export const TIME_RANGE_45_DAYS_AGO = 'TIME_RANGE_45_DAYS_AGO';
export const TIME_RANGE_90_DAYS_AGO = 'TIME_RANGE_90_DAYS_AGO';
export const TIME_RANGE_SCHOOL_YEAR = 'TIME_RANGE_SCHOOL_YEAR';
export const TIME_RANGE_FOUR_YEARS = 'TIME_RANGE_FOUR_YEARS';