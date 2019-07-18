import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {prettyEnglishProficiencyText, roundedWidaLevel} from '../helpers/language';


// Renders latest ACCESS score with subtests
export default class AccessPanel extends React.Component {
  render() {
    const {districtKey} = this.context;
    const {
      showTitle,
      studentFirstName,
      limitedEnglishProficiency,
      ellTransitionDate,
      access,
      style
    } = this.props;

    const proficiencyText = prettyEnglishProficiencyText(districtKey, limitedEnglishProficiency, {access, ellTransitionDate});
    return (
      <div style={{...styles.root, ...style}}>
        {showTitle && <h4 style={styles.title}>ACCESS</h4>}
        <div style={styles.explanation}>
          <div><b>Overall status: {proficiencyText}</b></div>
          <div style={{paddingTop: 20}}>
            This reflects {studentFirstName}’s latest scores in each category across ACCESS, WIDA Model Test and WIDA Screener tests.
          </div>
          <div>See the <a style={{fontSize: 14}} href="https://wida.wisc.edu/sites/default/files/resource/Speaking-Writing-Interpretive-Rubrics.pdf" target="_blank" rel="noopener noreferrer">WIDA Speaking and Writing Interpretive Rubrics</a> to learn more.</div>
        </div>
        <table style={{borderCollapse: 'collapse'}}>
          <tbody>
            {this.renderCompositeRow({
              label: 'Overall Score',
              dataPoint: access['composite']
            })}
            {this.renderCompositeRow({
              label: 'Oral Language',
              dataPoint: access['oral']
            })}
            {this.renderSubtestRow({
              label: 'Listening',
              dataPoint: access['listening']
            })}
            {this.renderSubtestRow({
              label: 'Speaking',
              dataPoint: access['speaking']
            })}
            {this.renderCompositeRow({
              label: 'Literacy',
              dataPoint: access['literacy']
            })}
            {this.renderSubtestRow({
              label: 'Reading',
              dataPoint: access['reading']
            })}
            {this.renderSubtestRow({
              label: 'Comprehension',
              dataPoint: access['comprehension']
            })}
            {this.renderSubtestRow({
              label: 'Writing',
              dataPoint: access['writing']
            })}
          </tbody>
        </table>
      </div>
    );
  }

  renderCompositeRow(options = {}) {
    return this.renderRow({
      ...options,
      label: <div>{options.label}</div>,
      shouldRenderFractions: true
    });
  }

  renderSubtestRow(options = {}) {
    return this.renderRow({
      ...options,
      label: <div style={{paddingLeft: 10}}>{options.label}</div>,
      shouldRenderFractions: false
    });
  }

  // Sized for ~700px wide
  renderRow(options = {}) {
    const label = options.label;
    const dataPoint = options.dataPoint;
    const shouldRenderFractions = options.shouldRenderFractions || false;
    
    const {nowFn} = this.context;    
    const nDaysText = (dataPoint)
      ? moment.utc(dataPoint.date_taken).from(nowFn())
      : '-';
    const performanceLevel = dataPoint && dataPoint.performance_level;

    // Rounding is meaningful educationally; see `roundedWidaLevel` for more
    const roundedScore = roundedWidaLevel(performanceLevel, {shouldRenderFractions});
    const scores = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6];
    const cellWidth = 35;
    const cellHeight = 30;
    return (
      <tr>
        <td style={{width: 100, paddingRight: 20}}>{label}</td>
        {scores.map((score, index) => (
          <td
            key={score}
            style={{
              border: '1px solid #666',
              width: cellWidth,
              backgroundColor: (score === roundedScore)
                ? '#4A90E2'
                : shouldRenderFractions || score === Math.round(score) ? 'white' : '#eee'
            }}
          >
            <div
              title={(score === roundedScore) ? performanceLevel : null}
              style={{
                ...styles.cell,
                height: cellHeight,
                color: (score === roundedScore) ? 'white' : '#ccc',
                fontWeight: (score === roundedScore) ? true : false
              }}>
              {shouldRenderFractions || score === Math.round(score) ? score : null}
            </div>
          </td>
        ))}
        <td style={{paddingLeft: 20}}>{nDaysText}</td>
      </tr>
    );
  }
}
AccessPanel.contextTypes = {
  nowFn: PropTypes.func.isRequired,
  districtKey: PropTypes.string.isRequired
};
const accessDataPointPropType = PropTypes.shape({
  date_taken: PropTypes.string.isRequired,
  performance_level: PropTypes.string.isRequired
});
AccessPanel.propTypes = {
  studentFirstName: PropTypes.string.isRequired,
  limitedEnglishProficiency: PropTypes.string,
  ellTransitionDate: PropTypes.string,
  access: PropTypes.shape({
    composite: accessDataPointPropType,
    comprehension: accessDataPointPropType,
    listening: accessDataPointPropType,
    oral: accessDataPointPropType,
    literacy: accessDataPointPropType,
    reading: accessDataPointPropType,
    speaking: accessDataPointPropType,
    writing: accessDataPointPropType
  }).isRequired,
  showTitle: PropTypes.bool,
  style: PropTypes.object
};

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    fontSize: 14
  },
  title: {
    borderBottom: '1px solid #333',
    color: 'black',
    padding: 10,
    paddingLeft: 0,
    marginBottom: 10
  },
  explanation: {
    marginBottom: 20,
    fontSize: 14
  },
  cell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'default'
  }
};
