import React from 'react';
import PropTypes from 'prop-types';
import 'highcharts';

// This component wraps Highcharts so that you can provide Highcharts
// options as props, and it bridges calling into the library.

export default class HighchartsWrapper extends React.Component {
  UNSAFE_componentDidMount() {
    $(this.chartEl).highcharts(this.props);
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    $(this.chartEl).highcharts(newProps);
  }

  componentWillUnmount() {
    delete this.chartEl;
  }

  render() {
    const {style} = this.props;
    return <div className="HighchartsWrapper" style={style} ref={el => this.chartEl = el} />;
  }
}
HighchartsWrapper.propTypes = {
  style: PropTypes.object
};