import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import chroma from 'chroma-js';
import {steelBlue} from '../helpers/colors';
import School from '../components/School';
import GenericLoader from '../components/GenericLoader';
import SectionHeading from '../components/SectionHeading';
import ExperimentalBanner from '../components/ExperimentalBanner';
import tableStyles from '../components/tableStyles';
import {gradeText} from '../helpers/gradeText';
import {rankedByGradeLevel} from '../helpers/SortHelpers';
import {apiFetchJson} from '../helpers/apiFetchJson';


// Experimental view for looking at equity in class lists
export default class ClassListsEquityIndexPage extends React.Component {
  render() {
    return (
      <div className="ClassListsEquityIndexPage">
        <ExperimentalBanner />
        <SectionHeading>Class List: Experimental Equity View</SectionHeading>
        <GenericLoader
          style={styles.root}
          promiseFn={() => apiFetchJson('/api/equity/classlists_equity_index_json')}
          render={json => (
            <ClassListsEquityIndexView
              dimensionKeys={json.dimension_keys}
              classListsWithDimensions={json.class_lists_with_dimensions} />
          )} />
      </div>
    );
  }
}
ClassListsEquityIndexPage.propTypes = {};

// View component
export class ClassListsEquityIndexView extends React.Component {
  render() {
    return this.renderTable();
  }

  renderTable() {
    const {dimensionKeys, classListsWithDimensions} = this.props;

    if (classListsWithDimensions.length === 0) return <div>No class lists</div>;

    const sortedClassLists = _.orderBy(classListsWithDimensions, classList => {
      return [
        classList.school.name,
        rankedByGradeLevel(classList.grade_level_next_year),
        classList.submitted
      ];
    });

    const headerCell = {...tableStyles.headerCell, fontSize: 10};
    const cell = {...tableStyles.cell, textAlign: 'center'};
    return (
      <div>
        <table style={tableStyles.table}>
          <thead>
            <tr>
              <th style={headerCell}>School</th>
              <th style={headerCell}>Grade next year</th>
              {dimensionKeys.map(dimensionKey => (
                <th key={dimensionKey} style={headerCell}>{dimensionKey}</th>
              ))}
              <th style={headerCell} />
            </tr>
          </thead>
          <tbody>{sortedClassLists.map(classList => {
            return (
              <tr key={classList.workspace_id}>
                <td style={cell}><School {...classList.school} /></td>
                <td style={cell}>
                  {gradeText(classList.grade_level_next_year)}
                </td>
                {dimensionKeys.map(dimensionKey => {
                  const dimension = _.find(classList.dimensions, { dimension_key: dimensionKey });
                  const value = dimension.index.herfindahl;
                  return <td key={dimensionKey} style={cell}>{this.renderValue(value)}</td>;
                })}
                <td style={cell}>
                  <a style={{padding: 10}} href={`/classlists/${classList.workspace_id}`}>open</a>
                </td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    );
  }

  renderValue(value) {
    const rounded = Math.round((1 - value) * 100);
    const scale = chroma.scale([steelBlue, 'white', 'orange']).classes([0, .3, .7, 1]);
    return <span style={{
      backgroundColor: scale(value),
      title: ((value > 70 || value < 30) ? 'Above 0.7 or below 0.3' : null),
      display: 'inline-block',
      width: '3em',
      padding: 5,
      color: 'black'
    }}>{rounded}</span>;
  }
}
ClassListsEquityIndexView.propTypes = {
  dimensionKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
  classListsWithDimensions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    workspace_id: PropTypes.string.isRequired,
    grade_level_next_year: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired,
    updated_at: PropTypes.string.isRequired,
    submitted: PropTypes.bool.isRequired,
    created_by_teacher_educator: PropTypes.object.isRequired,
    school: PropTypes.object.isRequired,
    dimensions: PropTypes.arrayOf(PropTypes.shape({
      dimension_key: PropTypes.string.isRequired,
      index: PropTypes.object.isRequired
    })).isRequired
  })).isRequired
};


const styles = {
  root: {
    padding: 10
  },
  newButton: {
    display: 'block',
    marginTop: 10
  },
  overview: {
    margin: 10
  },
  p: {
    marginBottom: 10
  }
};
