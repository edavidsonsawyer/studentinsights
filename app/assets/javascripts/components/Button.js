import React from 'react';
import PropTypes from 'prop-types';
import Hover from './Hover';


// A visual UI element for a button.  This is styled consistently with the `.btn` class
// defined in the server-side CSS.
export default function Button(props) {
  const {
    isDisabled,
    children,
    onClick,
    containerStyle = {},
    style = {},
    hoverStyle = {},
    disabledStyle = {}
  } = props;
  return (
    <Hover style={containerStyle}>
      {isHovering => {
        const mergedStyle = {
          ...styles.button,
          ...style,
          ...(isHovering && !isDisabled ? styles.hover : {}),
          ...(isHovering && !isDisabled ? hoverStyle : {}),
          ...(isDisabled ? styles.disabled : {}),
          ...(isDisabled ? disabledStyle : {})
        };
        return <button onClick={isDisabled ? undefined : onClick} style={mergedStyle}>{children}</button>;
      }}
    </Hover>
  );
}
const propTypes = Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
  isDisabled: PropTypes.bool,
  style: PropTypes.object,
  hoverStyle: PropTypes.object,
  disabledStyle: PropTypes.object,
  containerStyle: PropTypes.object
};

const styles = {
  button: {
    borderRadius: 28,
    color: 'white',
    fontSize: 14,
    background: '#4A90E2',
    padding: '8px 25px',
    textDecoration: 'none',
    border: 'none',
    cursor: 'pointer'
  },
  hover: {
    background: '#2275d7',
  },
  disabled: {
    background: '#aaa',
    color: '#eee',
    cursor: 'default'
  }
};


// Red for a serious kind of action (submit, delete).
export function SeriousButton(props) {
  const mergedProps = {
    ...props,
    style: {
      ...(props.style || {}),
      background: '#E5370E'
    },
    hoverStyle: {
      ...(props.hoverStyle || {}),
      background: '#b52b0b'
    }
  };

  return <Button {...mergedProps} />;
}
SeriousButton.propTypes = propTypes;


// Gray for a secondary kind of action.
export function PlainButton(props) {
  const mergedProps = {
    ...props,
    style: {
      ...(props.style || {}),
      background: '#eee',
      color: 'black'
    },
    hoverStyle: {
      ...(props.hoverStyle || {}),
      background: '#eee',
      color: 'black'
    },
    disabledStyle: {
      ...(props.disabledStyle || {}),
      background: '#eee',
      color: '#aaa'
    }
  };

  return <Button {...mergedProps} />;
}
PlainButton.propTypes = propTypes;