import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import HighchartsWrapper from '../components/HighchartsWrapper';
import hash from 'object-hash';

// Component for all charts in the dashboard page. Displays incidents by Day of Week and Time
export default class DisciplineScatterPlot extends React.Component{

  //highcharts has trouble combining zoom with a render, so rendering is prevented unless the displayed data changes
  shouldComponentUpdate(nextProps) {
    return hash.MD5(nextProps.seriesData)!==hash.MD5(this.props.seriesData);
  }

  hourFormatter() { //time is sent as minutes from midnight on each day
    const minutes = this.value;
    const hour = Math.floor(minutes/60);
    const minute = minutes % 60 || "00";
    const a = hour < 12 ? 'AM' : 'PM';
    return `${hour % 12 || 12}:${minute} ${a}`;
  }

  gutterFormatter() {
    return "After Hours";
  }

  render() {
    return (
      <div id={this.props.id} className="DisciplineScatterPlot" style={styles.root}>
        <HighchartsWrapper
          style={{flex: 1}}
          chart={{
            type: 'scatter',
            events: {selection:this.props.onZoom},
            zoomType: 'xy',
            alignTicks: false
          }}
          credits={false}
          xAxis={{
            ...this.props.categories,
            gridLineWidth: 1,
            opposite:true,
            min: 0,
            max: 5 // Saturday/Sunday are optionally displayed only if they have data
          }}
          plotOptions={{
            series: {
              animation: this.props.animation,
              marker: {
                radius: 12,
                fillColor: 'rgba(124, 181, 236, 0.5)'
              }
            }
          }}
          title={{text: this.props.titleText}}
          yAxis={[{
            min: 420, //7 AM
            max: 960, //3 PM plus a gutter category
            reversed: true,
            showLastLabel: false,
            tickInterval: 60,
            title: {text: this.props.measureText},
            labels: {formatter: this.hourFormatter},
            plotBands: [{
              color: 'rgba(241, 254, 198, 0.5)',
              from: 900,
              to: 960,
            }]
          },
          {
            min: 420, //7 AM
            max: 960, //3 PM plus a gutter category
            gridLineWidth: 0,
            linkedTo: 0,
            opposite: true,
            reversed: true,
            tickPositions: [930],
            labels: {formatter: this.gutterFormatter},
            title: {text: undefined}
          }]}
          tooltip={{formatter: this.props.toolTipFormatter}}
          series={[
            {
              showInLegend: false,
              data: this.props.seriesData,
              ...(this.props.series || {})
            }
          ]} />
      </div>
    );
  }
}

//Converts a time to minutes from midnight to order the Highcharts series
export function  getincidentTimeAsMinutes(incident) {
  const time = moment.utc(incident.occurred_at).format("HH.mm").split(".");
  const minutes = time[0] * 60 + time[1] * 1;
  const areMinutesWithinSchoolHours = 420 < minutes && minutes < 900;
  //Group all times outside of school hours or not recorded into one spot for a "gutter" category in highcharts
  return areMinutesWithinSchoolHours ? minutes : 930; // 4:30 - for gutter category
}

DisciplineScatterPlot.propTypes = {
  id: PropTypes.string.isRequired, // short string identifier for links to jump to
  categories: PropTypes.object.isRequired,  //Buckets used for X Axis
  seriesData: PropTypes.array.isRequired, // array of JSON event objects.
  titleText: PropTypes.string, //discipline dashboard makes its own title
  measureText: PropTypes.string.isRequired,
  onZoom: PropTypes.func, //callback ro change parent component when zoomed
  animation: PropTypes.bool,
  toolTipFormatter: PropTypes.func.isRequired, //custom function for tooltip
  series: PropTypes.object,
};
DisciplineScatterPlot.defaultProps = {
  animation: true
};

const styles = {
  root: {
    flex: 1,
    width: '100%',
    padding: 10,
    display: 'flex'
  }
};