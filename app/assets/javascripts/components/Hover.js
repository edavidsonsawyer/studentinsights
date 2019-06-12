import PropTypes from 'prop-types';
import React from 'react';
import _ from 'lodash';


// A component for tracking mouse hover state
export default class Hover extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isHovering: false
    };

    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
  }

  onMouseEnter(e) {
    this.setState({isHovering: true});
  }

  onMouseLeave(e) {
    this.setState({isHovering: false});
  }

  render() {
    const {children, className, style} = this.props;
    const {isHovering} = this.state;

    const classNameText = _.compact(['Hover', className]).join(' ');
    return (
      <div
        className={classNameText}
        style={style}
        onMouseLeave={this.onMouseLeave}
        onMouseEnter={this.onMouseEnter}>{children(isHovering)}</div>
    );
  }
}
Hover.propTypes = {
  children: PropTypes.func.isRequired,
  style: PropTypes.object,
  className: PropTypes.string
};