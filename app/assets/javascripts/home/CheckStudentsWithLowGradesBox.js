import React from 'react';
import PropTypes from 'prop-types';
import Card from '../components/Card';
import Section from '../components/Section';
import HelpBubble from '../components/HelpBubble';


// Pure UI component, for showing a high school teacher
// which of their students have low grades but haven't been
// discussed in NGE or 10GE.  The intention is that this list of
// students to check in on is immediately actionable.
export default class CheckStudentsWithLowGradesBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      uiLimit: 4
    };
    this.onMoreStudents = this.onMoreStudents.bind(this);
  }

  onMoreStudents(e) {
    e.preventDefault();
    const {uiLimit} = this.state;
    this.setState({ uiLimit: uiLimit + 4 });
  }

  render() {
    const {studentsWithLowGrades, totalCount} = this.props;
    const {uiLimit} = this.state;
    const truncatedStudentsWithLowGrades = studentsWithLowGrades.slice(0, uiLimit);

    return (
      <div className="CheckStudentsWithLowGradesBox">
        <div style={styles.cardTitle}>
          Students to check in on
          <HelpBubble
            teaser={<span style={styles.helpTeaser}>what does this mean?</span>}
            title="Students to check in on"
            content={this.renderHelpContent()} />
        </div>
        <Card style={{border: 'none'}}>
          <div>There {this.renderAreHowManyStudents(totalCount)} in your classes who have a D or an F right now but no one has mentioned for the last 45 days.</div>
          {this.renderList(truncatedStudentsWithLowGrades)}
          {this.renderMore(truncatedStudentsWithLowGrades)}
        </Card>
      </div>
    );
  }

  renderHelpContent() {
    return (
      <div>
        <p style={styles.helpContent}>These are all the students in courses that you teach who have a D or F right now, but {"haven't"} been mentioned recently.</p>
        <p style={styles.helpContent}>This means there aren't any notes about them from support meetings, parent conversations, or anything else in Student Insights.  The threshold for being included in this list is to have one or more grade that is below a 69 right now.</p>
        <p style={styles.helpContent}>You could talk directly with the student or reach out to the family.  Or you could connect with a colleague who can provide support services (eg, academic support, tutoring, counselors).</p>
      </div>
    );
  }

  renderAreHowManyStudents(totalCount) {
    if (totalCount === 0) return <span>are <b>no students</b></span>;
    if (totalCount === 1) return <span>is <b>one student</b></span>;
    return <span>are <b>{totalCount} students</b></span>;
  }

  renderList(truncatedStudentsWithLowGrades) {
    if (truncatedStudentsWithLowGrades.length === 0) return null;
    return (
      <div style={{paddingTop: 10, paddingBottom: 10}}>
        {truncatedStudentsWithLowGrades.map(studentWithLowGrades => {
          const {student, assignments} = studentWithLowGrades;
          return (
            <div key={student.id} style={styles.line}>
              <span><a style={styles.person} href={`/students/${student.id}`}>{student.first_name} {student.last_name}</a></span>
              {this.renderCourseGrades(assignments)}
            </div>
          );
        })}
      </div>
    );
  }

  renderCourseGrades(assignments) {
    return (
      <span>{assignments.map(assignment => {
        const {section} = assignment;
        const hasAnText = (assignment.grade_letter === 'F')
          ? 'has an'
          : 'has a';
        return (
          <span key={assignment.id}>
            <span style={styles.middleText}>{hasAnText} {assignment.grade_letter} in</span>
            <Section
              id={section.id}
              courseDescription={section.course_description}
              sectionNumber={section.section_number} />
          </span>
        );
      })}</span>
    );
  }

  renderMore(truncatedStudentsWithLowGrades) {
    const {totalCount, limit, studentsWithLowGrades} = this.props;

    if (truncatedStudentsWithLowGrades.length !== studentsWithLowGrades.length) {
      return <div><a href="#" onClick={this.onMoreStudents}>See more</a></div>;
    }

    if (studentsWithLowGrades.length < totalCount) {
      return <div>There are {totalCount} students total.  Start with checking in on these first {limit} students.</div>;
    }

    return null;
  }
}

CheckStudentsWithLowGradesBox.propTypes = {
  limit: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  studentsWithLowGrades: PropTypes.arrayOf(PropTypes.shape({
    student: PropTypes.shape({
      id: PropTypes.number.isRequired,
      first_name: PropTypes.string.isRequired,
      last_name: PropTypes.string.isRequired,
      grade: PropTypes.string.isRequired,
      house: PropTypes.string
    }).isRequired,
    assignments: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired,
      grade_letter: PropTypes.string.isRequired,
      grade_numeric: PropTypes.string.isRequired,
      section: PropTypes.shape({
        id: PropTypes.number.isRequired,
        section_number: PropTypes.string.isRequired,
        educators: PropTypes.arrayOf(PropTypes.object).isRequired
      }).isRequired
    }))
  })).isRequired
};


const styles = {
  cardTitle: {
    backgroundColor: '#eee',
    padding: 10,
    color: 'black',
    borderBottom: '1px solid #ccc',
    display: 'flex',
    justifyContent: 'space-between'
  },
  person: {
    fontWeight: 'bold'
  },
  line: {
    paddingLeft: 10,
    paddingRight: 10,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  middleText: {
    display: 'inline-block',
    paddingLeft: 5,
    paddingRight: 5
  },
  helpContent: {
    margin: 10
  }
};
