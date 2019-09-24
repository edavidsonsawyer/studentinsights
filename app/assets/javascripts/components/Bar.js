import PropTypes from 'prop-types';
import React from 'react';

// Render a horizontal Bar that is filled with `color` and is a
// `percent` of the width of the container.
export default class Bar extends React.Component {

  render() {
    const {style, innerStyle, percent, threshold} = this.props;
    const title = this.props.title || percent + '%';

    return (
      <div title={title} style={{
        color: 'black',
        cursor: 'default',
        display: 'inline-block',
        width: percent + '%',
        height: '100%',
        ...style
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          ...innerStyle
        }}>
          {percent > threshold ? `${Math.round(percent)}%` : '\u00A0' }
        </div>
      </div>
    );
  }

}

Bar.propTypes = {
  percent: PropTypes.number.isRequired,
  threshold: PropTypes.number.isRequired,
  style: PropTypes.object,
  innerStyle: PropTypes.object,
  title: PropTypes.string
};
