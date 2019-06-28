import PropTypes from 'prop-types';
import React from 'react';
import _ from 'lodash';
import moment from 'moment';
import GenericLoader from '../components/GenericLoader';
import School from '../components/School';
import Section from '../components/Section';
import SectionHeading from '../components/SectionHeading';
import ExperimentalBanner from '../components/ExperimentalBanner';
import tableStyles from '../components/tableStyles';
import {apiFetchJson} from '../helpers/apiFetchJson';
import {toMomentFromTimestamp} from '../helpers/toMoment';

/*
Showing info about courses offered at a school.
*/
class SchoolCoursesPage extends React.Component {
  constructor(props) {
    super(props);
    this.fetchCourses = this.fetchCourses.bind(this);
    this.renderCourses = this.renderCourses.bind(this);
  }

  fetchCourses() {
    const {schoolId} = this.props;
    const url = `/api/schools/${schoolId}/courses`;
    return apiFetchJson(url);
  }

  render() {
    return (
      <div className="SchoolCoursesPage">
        <ExperimentalBanner />
        <GenericLoader
          promiseFn={this.fetchCourses}
          render={this.renderCourses} />
      </div>
    );
  }

  renderCourses(json) {
    const {courses, school} = json;
    return <SchoolCoursesPagePure courses={courses} school={school} />;
  }
}
SchoolCoursesPage.propTypes = {
  schoolId: PropTypes.string.isRequired
};


export class SchoolCoursesPagePure extends React.Component {
  render() {
    const {courses, school} = this.props;
    const {nowFn} = this.context;
    const now = nowFn();

    const sortedCourses = _.sortBy(courses, course => course.course_number);
    return (
      <div style={styles.rendered}>
        <SectionHeading>
          Courses at <School id={school.id} name={school.name} style={{fontSize: 24, fontWeight: 300}}/>
        </SectionHeading>
        <table style={tableStyles.table}>
          <thead>
            <tr>
              <th style={tableStyles.headerCell}>Course</th>
              <th style={tableStyles.headerCell}>Sections</th>
              <th style={tableStyles.headerCell}>Total students</th>
              <th style={tableStyles.headerCell}>Grade levels</th>
              <th style={tableStyles.headerCell}>Ages</th>
              <th style={tableStyles.headerCell}>Schools</th>
            </tr>
          </thead>
          <tbody>{sortedCourses.map(course => {
            const rightAlignStyle = {...tableStyles.cell, textAlign: 'right'};
            const students = _.flatten(course.sections.map(s => s.students));
            const grades = _.sortBy(_.uniq(students.map(s => parseInt(s.grade, 10))));
            const ages =  _.sortBy(_.uniq(students.map(s => toMomentFromTimestamp(s.date_of_birth).unix())).map(unix => {
              const birthdate = moment.unix(unix).utc();
              return now.clone().diff(birthdate, 'year');
            }));
            const schools = _.sortBy(_.uniqBy(_.flatten(students.map(s => s.school)), 'id'), 'name');
            return (
              <tr key={course.id}>
                <td style={tableStyles.cell}>{course.course_number} {course.course_description}</td>
                <td style={tableStyles.cell}>{_.sortBy(course.sections, s => s.section_number).map(section =>
                  <Section
                    key={section.id}
                    id={section.id}
                    domain="https://somerville.studentinsights.org"
                    style={{display: 'block'}}
                    sectionNumber={section.section_number}
                    courseDescription={course.course_description} />
                )}</td>
                <td style={rightAlignStyle}>{students.length}</td>
                <td style={rightAlignStyle}>{grades.length > 1
                  ? <span>{_.head(grades)} - {_.last(grades)}</span>
                  : grades[0]}</td>
                <td style={rightAlignStyle}>{_.head(ages)} - {_.last(ages)}</td>
                <td style={tableStyles.cell}>{schools.map(school =>
                  <School
                    key={school.id}
                    id={school.id}
                    name={school.name}
                    style={{display: 'block'}} />
                )}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    );
  }
}
SchoolCoursesPagePure.contextTypes = {
  nowFn: PropTypes.func.isRequired
};
SchoolCoursesPagePure.propTypes = {
  courses: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    course_number: PropTypes.string.isRequired,
    course_description: PropTypes.string.isRequired,
    sections: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired,
      section_number: PropTypes.string.isRequired,
      students: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        grade: PropTypes.string.isRequired,
        date_of_birth: PropTypes.string.isRequired,
        school: PropTypes.shape({
          id: PropTypes.number.isRequired,
          name: PropTypes.string.isRequired
        }).isRequired
      })).isRequired
    })).isRequired
  })).isRequired,
  school: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired
  }).isRequired
};


const styles = {
  rendered: {
    padding: 10
  },
  raw: {
    fontFamily: 'monospace',
    fontSize: 10,
    padding: 10
  }
};


export default SchoolCoursesPage;