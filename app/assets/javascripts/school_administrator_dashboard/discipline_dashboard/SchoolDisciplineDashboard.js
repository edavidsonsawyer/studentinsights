import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import moment from 'moment';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import SelectTimeRange, {
  momentRange,
  TIME_RANGE_45_DAYS_AGO
} from '../../components/SelectTimeRange';
import {ALL} from '../../components/SimpleFilterSelect';
import {
  supportsHouse,
  shouldDisplayHouse,
  supportsCounselor,
  shouldDisplayCounselor
} from '../../helpers/PerDistrict';
import SelectDisciplineIncidentType from '../../components/SelectDisciplineIncidentType';
import SelectGrade from '../../components/SelectGrade';
import SelectHouse from '../../components/SelectHouse';
import SelectCounselor from '../../components/SelectCounselor';
import memoizer from '../../helpers/memoizer';
import FilterBar from '../../components/FilterBar';
import {sortByGrade} from '../../helpers/SortHelpers';
import SectionHeading from '../../components/SectionHeading';
import EscapeListener from '../../components/EscapeListener';
import StudentsTable from '../StudentsTable';
import DashboardBarChart from '../DashboardBarChart';
import DisciplineScatterPlot, {getincidentTimeAsMinutes} from '../../components/DisciplineScatterPlot';
import * as dashboardStyles from '../dashboardStyles';


export default class SchoolDisciplineDashboard extends React.Component {

  constructor(props) {
    super(props);
    this.state = initialState();
    this.onTimeRangeKeyChanged = this.onTimeRangeKeyChanged.bind(this);
    this.onIncidentTypeChange = this.onIncidentTypeChange.bind(this);
    this.onGradeChanged = this.onGradeChanged.bind(this);
    this.onHouseChanged = this.onHouseChanged.bind(this);
    this.onCounselorChanged = this.onCounselorChanged.bind(this);
    this.onResetFilters = this.onResetFilters.bind(this);
    this.onColumnClick = this.onColumnClick.bind(this);
    this.onResetStudentList = this.onResetStudentList.bind(this);
    this.onSelectChart = this.onSelectChart.bind(this);
    this.onZoom = this.onZoom.bind(this);
    this.memoize = memoizer();
  }

  //Remove scatter plot option when there are too many incidents to show patterns
  componentDidMount() {
    if (this.getIncidentsFromStudents(this.props.dashboardStudents).length > 500) {
      this.setState({selectedChart: 'incident_location', scatterPlotAvailable: false});
    }
  }

  filterIncidents(disciplineIncidents, options = {}) {
    return this.memoize(['filteredIncidents', this.state, arguments], () => {
      if (!disciplineIncidents) return [];
      const {nowFn} = this.context;
      const {shouldFilterSelectedCategory} = options;
      const {timeRangeKey, selectedIncidentCode, selectedChart, selectedCategory} = this.state;
      const range = momentRange(timeRangeKey, nowFn());
      return disciplineIncidents.filter(incident => {
        if (!moment.utc(incident.occurred_at).isBetween(range[0], range[1])) return false;
        if (incident.incident_code !== selectedIncidentCode && selectedIncidentCode !== ALL) return false;
        if (shouldFilterSelectedCategory) { //used by the student list when a user selects a category within a chart
          if (selectedChart === 'day' && this.timeStampToDay(incident) !== selectedCategory) return false;
          if (selectedChart === 'time' &&  this.timeStampToHour(incident) !== selectedCategory) return false;
          if (selectedChart === 'incident_location' && incident[selectedChart] !== selectedCategory) return false;
          if (selectedChart === 'incident_code' && incident[selectedChart] !== selectedCategory) return false;
        }
        return true;
      });
    });
  }

  filterStudents(students, options = {}) {
    const {selectedChart, selectedCategory, grade, house, counselor} = this.state;
    const {shouldFilterSelectedCategory} = options;
    return students.filter(student => {
      if (grade !== ALL && student.grade !== grade) return false;
      if (house !== ALL && student.house !== house) return false;
      if (counselor !== ALL && student.counselor !== counselor) return false;
      if (selectedCategory && shouldFilterSelectedCategory) { //used by the student list when a user selects a category within a chart
        if (selectedChart === 'grade' && student.grade !== selectedCategory) return false;
        if (selectedChart === 'homeroom_label' && student.homeroom_label !== selectedCategory) return false;
        if (!this.filterIncidents(student.discipline_incidents, {shouldFilterSelectedCategory: true}).length) return false;
      }
      if (!this.filterIncidents(student.discipline_incidents, {shouldFilterSelectedCategory: false}).length) return false;
      return true;
    });
  }

  filterToZoomedStudents(students) {
    const {visibleIds} = this.state;
    return students.filter(student => visibleIds.indexOf(student.id) >= 0);
  }

  timeStampToHour(incident) {
    const hour = moment.utc(incident.occurred_at).startOf('hour').format('h:mm a');
    const timeFormat = "HH:mm a";
    const schoolStart = moment.utc("7:00 am", timeFormat);
    const schoolEnd = moment.utc("3:00 pm", timeFormat);
    if (!incident.has_exact_time) return "Not Logged";
    if (!moment.utc(hour, timeFormat).isBetween(schoolStart, schoolEnd)) return "Other";
    return hour;
  }

  timeStampToDay(incident) {
    return moment.utc(incident.occurred_at).format("ddd");
  }

  getIncidentsFromStudents(students) {
    //for chart data, does not filter on selected categories
    return _.flatten(students.map(student => this.filterIncidents(student.discipline_incidents, {shouldFilterSelectedCategory: false})));
  }

  //Depending on the chart, incidents are grouped either by student attribute or incident attribute. Any future
  //charts may be handled here.
  getChartData(students, selectedChart) {
    switch(selectedChart) {
    case 'homeroom_label': {
      const groupedStudents = _.groupBy(students, selectedChart);
      const categories = this.sortedByIncidentsInStudentGroup(groupedStudents);
      const seriesData = categories.map(category => {
        const color = (category === this.state.selectedCategory)? 'orange' : null;
        const y = this.getIncidentsFromStudents(groupedStudents[category]).length;
        return {category, y, color};
      });
      return {categories, seriesData};
    }
    case 'grade': {
      const groupedStudents = _.groupBy(students, selectedChart);
      const categories = this.sortedGrades(Object.keys(groupedStudents));
      const seriesData = categories.map(category => {
        const color = (category === this.state.selectedCategory)? 'orange' : null;
        const y = this.getIncidentsFromStudents(groupedStudents[category]).length;
        return {category, y, color};
      });
      return {categories, seriesData};
    }
    case 'incident_location': case 'incident_code': {
      const incidents = this.getIncidentsFromStudents(students);
      const groupedIncidents = _.groupBy(incidents, selectedChart);
      const categories = this.sortedByIncidents(groupedIncidents);
      const seriesData = categories.map(category => {
        const color = (category === this.state.selectedCategory)? 'orange' : null;
        const y = groupedIncidents[category].length;
        return {category, y, color};
      });
      return {categories, seriesData};
    }
    case 'time': {
      const incidents = this.getIncidentsFromStudents(students);
      const groupedIncidents = _.groupBy(incidents, incident => {
        return this.timeStampToHour(incident);
      });
      const categories = this.sortedTimes(Object.keys(groupedIncidents));
      const seriesData = categories.map(category => {
        const color = (category === this.state.selectedCategory)? 'orange' : null;
        const y = groupedIncidents[category] ? groupedIncidents[category].length : 0;
        return {category, y, color};
      });
      return {categories, seriesData};
    }
    case 'day': {
      const incidents = this.getIncidentsFromStudents(students);
      const groupedIncidents = _.groupBy(incidents, incident => {
        return moment.utc(incident.occurred_at).format("ddd");
      });
      const categories = this.sortedDays();
      const seriesData = categories.map(category => {
        const color = (category === this.state.selectedCategory)? 'orange' : null;
        const y = groupedIncidents[category] ? groupedIncidents[category].length : 0;
        return {category, y, color};
      });
      return {categories, seriesData};
    }
    case 'scatter': {
      const incidents = this.getIncidentsFromStudents(students);
      const categories = this.sortedDays();
      const studentsById = _.groupBy(students, 'id'); // to look up student names for display
      const seriesData = incidents.map(incident => {
        const student_id = incident.student_id; //used to identify which points are in view when zoomed
        const x = categories.indexOf(moment.utc(incident.occurred_at).format("ddd"));
        const y = getincidentTimeAsMinutes(incident);
        const first_name = studentsById[student_id][0].first_name;
        const last_name = studentsById[student_id][0].last_name;
        return {x, y, first_name, last_name, incident};
      });
      return {categories, seriesData};
    }
    }
  }

  sortedDays() {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  }

  sortedTimes(chartKeys) {
    //chartKeys will either contain a time like "4:00 pm", "10:00 am", or "Not Logged"
    return [
      "Not Logged",
      "7:00 am",
      "8:00 am",
      "9:00 am",
      "10:00 am",
      "11:00 am",
      "12:00 pm",
      "1:00 pm",
      "2:00 pm",
      "3:00 pm",
      "Other"];
  }

  sortedGrades(chartKeys) {
    return chartKeys.sort((a,b) => sortByGrade(a,b));
  }

  sortedByIncidents(groupedIncidents) {
    const chartKeys = Object.keys(groupedIncidents);
    return chartKeys.sort((a,b) => {
      return groupedIncidents[b].length - groupedIncidents[a].length;
    });
  }

  sortedByIncidentsInStudentGroup(groupedStudents) {
    return Object.keys(groupedStudents).sort((a,b) => {
      return this.getIncidentsFromStudents(groupedStudents[b]).length - this.getIncidentsFromStudents(groupedStudents[a]).length;
    });
  }

  studentTableRows(students) {
    const {selectedCategory} = this.state;
    const filteredStudents = this.filterStudents(students, {shouldFilterSelectedCategory: true});
    return filteredStudents.map(student => {
      return {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        grade: student.grade,
        latest_note: student.latest_note,
        events: this.filterIncidents(student.discipline_incidents, {shouldFilterSelectedCategory: selectedCategory}).length
      };
    });
  }

  allIncidentTypes() {
    const {dashboardStudents} = this.props;
    const incidents = _.uniqBy(_.compact(_.flatten(dashboardStudents.map(student => student.discipline_incidents))), 'incident_code');
    return incidents.map(incident => incident.incident_code).sort();
  }

  allGrades() {
    const {dashboardStudents} = this.props;
    return _.uniq(dashboardStudents.map(student => student.grade)).sort();
  }

  allCounselors() {
    const {dashboardStudents} = this.props;
    return _.uniq(dashboardStudents.map(student => student.counselor)).sort();
  }

  toolTipFormatter() {
    return `<b>${this.point.last_name}, ${this.point.first_name}</b>`;
  }

  onIncidentTypeChange(incidentType) {
    this.setState({selectedIncidentCode: incidentType, selectedCategory: null});
  }

  onGradeChanged(grade) {
    this.setState({grade, selectedCategory: null});
  }

  onHouseChanged(house) {
    this.setState({house, selectedCategory: null});
  }

  onCounselorChanged(counselor) {
    this.setState({counselor, selectedCategory: null});
  }

  onTimeRangeKeyChanged(timeRangeKey) {
    this.setState({timeRangeKey});
  }

  onSelectChart(selection) {
    this.setState({selectedChart: selection.value, selectedCategory: null});
  }

  onResetFilters() {
    this.setState(initialState());
  }

  onZoom(highchartsEvent) {
    if (highchartsEvent.xAxis && highchartsEvent.yAxis) { //highcharts sends different events when user is making and resetting a selection
      const zoomed = true;
      const xMin = highchartsEvent.xAxis[0].min;
      const yMin = highchartsEvent.yAxis[0].min;
      const xMax = highchartsEvent.xAxis[0].max;
      const yMax = highchartsEvent.yAxis[0].max;
      const points = highchartsEvent.target.series[0].points;
      const displayedPoints = points.filter(point => {
        return (xMin < point.x && point.x < xMax && yMin < point.y && point.y < yMax);
      });
      const visibleIds = displayedPoints.map(point => point.incident.student_id);
      this.setState({zoomed, visibleIds});
    } else this.setState({zoomed: false});
  }

  onColumnClick(highchartsEvent) {
    this.setState({selectedCategory: highchartsEvent.point.category});
  }

  onResetStudentList() {
    this.setState({selectedCategory: null});
  }

  render() {
    const {districtKey} = this.context;
    const {scatterPlotAvailable, timeRangeKey, selectedChart, grade, house, counselor} = this.state;
    const {school, dashboardStudents} = this.props;
    const chartOptions = [
      ... scatterPlotAvailable ? [{value: 'scatter', label: 'Day & Time'}] : [],
      {value: 'incident_location', label: 'Location'},
      {value: 'time', label: 'Time'},
      {value: 'homeroom_label', label: 'Classroom'},
      {value: 'grade', label: 'Grade'},
      {value: 'day', label: 'Day'},
      {value: 'incident_code', label: 'Incident Code'}
    ];
    const incidentTypes = this.allIncidentTypes(dashboardStudents);

    return(
      <EscapeListener className="SchoolDisciplineDashboard" style={styles.flexVertical} onEscape={this.onResetFilters}>
        <div style={{...styles.flexVertical, paddingLeft: 10, paddingRight: 10}}>
          <SectionHeading>Recent Discipline incidents at {school.name}</SectionHeading>
          <div style={styles.filterBarContainer}>
            <FilterBar style={styles.timeRange} >
              <SelectDisciplineIncidentType
                type={this.state.selectedIncidentCode || 'All'}
                onChange={this.onIncidentTypeChange}
                types={incidentTypes} />
              <SelectGrade
                style={styles.narrowSelect}
                grade={grade}
                grades={this.allGrades()}
                onChange={this.onGradeChanged} />
              {supportsHouse(districtKey) && shouldDisplayHouse(school) && (
                <SelectHouse
                  style={styles.narrowSelect}
                  house={house}
                  onChange={this.onHouseChanged} />
              )}
              {supportsCounselor(districtKey) && shouldDisplayCounselor(school) && (
                <SelectCounselor
                  style={styles.narrowSelect}
                  counselor={counselor}
                  counselors={this.allCounselors()}
                  onChange={this.onCounselorChanged} />
              )}
            </FilterBar>
            <FilterBar style={styles.timeRange}>
              <SelectTimeRange
                timeRangeKey={timeRangeKey}
                onChange={this.onTimeRangeKeyChanged} />
            </FilterBar>
          </div>
          <div style={dashboardStyles.columns}>
            <div style={dashboardStyles.rosterColumn}>
              {this.renderStudentDisciplineTable(dashboardStudents)}
            </div>
            <div style={dashboardStyles.chartsColumn}>
              <div style={styles.graphTitle}>
                <div style={styles.titleText}>
                  Break down by:
                </div>
                <Select
                  value={this.state.selectedChart}
                  onChange={this.onSelectChart}
                  options={chartOptions}
                  style={styles.dropdown}
                  clearable={false}
                />
              </div>
              {this.renderDisciplineChart(dashboardStudents, selectedChart)}
            </div>
          </div>
        </div>
      </EscapeListener>
    );
  }

  renderDisciplineChart(students, selectedChart) {
    const selectedStudents = this.filterStudents(students, {shouldFilterSelectedCategory: false});
    const {categories, seriesData} = this.getChartData(selectedStudents, selectedChart);
    const commonProps = {
      id: "String",
      animation: false,
      categories: {categories: categories},
      seriesData: seriesData,
      titleText: null,
      toolTipFormatter: this.toolTipFormatter
    };
    const barChartProps = {
      ...commonProps,
      measureText: "Number of Incidents",
      tooltip: {pointFormat: 'Total incidents: <b>{point.y}</b>'},
      onColumnClick: this.onColumnClick,
      onBackgroundClick: this.onResetStudentList
    };
    const scatterPlotProps = {
      ...commonProps,
      measureText: "Time of Incident",
      onZoom: this.onZoom
    };
    return (
      (selectedChart === 'scatter') ? (
        <DisciplineScatterPlot {...scatterPlotProps}/>
      ) : (
        <DashboardBarChart {...barChartProps}/>
      )
    );
  }

  renderStudentDisciplineTable(students) {
    const filteredStudents = this.state.zoomed ? this.filterToZoomedStudents(students) : this.filterStudents(students, {shouldFilterSelectedCategory: true});
    const rows = this.studentTableRows(filteredStudents);
    return (
      <StudentsTable
        rows = {rows}
        incidentType={"Incidents"}/>
    );
  }
}
SchoolDisciplineDashboard.contextTypes = {
  nowFn: PropTypes.func.isRequired,
  districtKey: PropTypes.string.isRequired
};
SchoolDisciplineDashboard.propTypes = {
  dashboardStudents: PropTypes.array.isRequired,
  school: PropTypes.shape({
    name: PropTypes.string.isRequired
  }).isRequired
};

const styles = {
  flexVertical: {
    flex: 1,
    width: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  timeRange: {
    display: 'flex',
    justifyContent: 'center'
  },
  graphTitle: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '20px'
  },
  titleText: {
    fontSize: '18px',
    marginRight: '10px',
    alignSelf: 'center'
  },
  dropdown: {
    width: '200px'
  },
  filterBarContainer: {
    borderBottom: '1px solid #ccc',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    padding: 10
  },
  narrowSelect: {
    width: '8em'
  }
};

function initialState() {
  return {
    timeRangeKey: TIME_RANGE_45_DAYS_AGO,
    scatterPlotAvailable: true,
    selectedChart: 'scatter',
    selectedIncidentCode: ALL,
    selectedCategory: null,
    grade: ALL,
    house: ALL,
    counselor: ALL,
    visibleIds: [],
    zoomed: false
  };
}
