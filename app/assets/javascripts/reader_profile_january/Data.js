import React from 'react';
import PropTypes from 'prop-types';
import {gradeText} from '../helpers/gradeText';
import BoxChart from './BoxChart';
import Expandable from './Expandable';
import CohortChart from './CohortChart';


export default class Data extends React.Component {
  render() {
    return (
      <div className="Data">
        <div style={styles.mainBox}>
          {this.renderBoxChart()}
        </div>
        <div style={styles.expansions}>
          {this.renderCohort()}
          {this.renderExpandableRawScores()}
        </div>
      </div>
    );
  }

  renderBoxChart() {
    const {gradeNow, readerJson, benchmarkAssessmentKey} = this.props;
    return (
      <BoxChart
        gradeNow={gradeNow}
        readerJson={readerJson}
        benchmarkAssessmentKey={benchmarkAssessmentKey}
        renderCellFn={({benchmarkPeriodKey}) => benchmarkPeriodKey}
      />
    );
  }

  renderCohort() {
    const {studentId, gradeNow, readerJson, benchmarkAssessmentKey} = this.props;
    return (
      <Expandable text={`Percentile in ${gradeText(gradeNow)} school cohort`}>
        <CohortChart
          studentId={studentId}
          gradeNow={gradeNow}
          readerJson={readerJson}
          benchmarkAssessmentKey={benchmarkAssessmentKey}
        />
      </Expandable>
    );
  }

  renderExpandableRawScores() {
    const {gradeNow, readerJson, benchmarkAssessmentKey} = this.props;
    return (
      <Expandable text="Raw scores">
        <BoxChart
          gradeNow={gradeNow}
          readerJson={readerJson}
          benchmarkAssessmentKey={benchmarkAssessmentKey}
          renderCellFn={({value}) => value}
        />
      </Expandable>
    );
  }
}
Data.propTypes = {
  studentId: PropTypes.number.isRequired,
  gradeNow: PropTypes.string.isRequired,
  benchmarkAssessmentKey: PropTypes.string.isRequired,
  readerJson: PropTypes.object.isRequired
};
Data.contextTypes = {
  nowFn: PropTypes.func.isRequired
};


const styles = {
  mainBox: {
    marginBottom: 40
  },
  expansions: {}
};
