import PropTypes from 'prop-types';
import React from 'react';


// A visual UI element for a badge indicating a particular 
// high school house.
function HouseBadge({house, showNameOnly, style}) {
  const mergedStyle = {
    ...styles.houseBadge,
    backgroundColor: '#333',
    color: 'white',
    opacity: 0.5,
    ...style
  };
  const text = (showNameOnly) ? house : `${house} house`;
  return <span className="HouseBadge" style={mergedStyle}>{text}</span>;
}
HouseBadge.propTypes = {
  house: PropTypes.string.isRequired,
  showNameOnly: PropTypes.bool,
  style: PropTypes.object
};

const styles = {
  houseBadge: {
    padding: 5
  }
};

export default HouseBadge;