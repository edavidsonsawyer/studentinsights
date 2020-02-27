import React from 'react';
import PropTypes from 'prop-types';


export default class MaterialsCarousel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      index: 0
    };

    this.onNext = this.onNext.bind(this);
    this.onPrevious = this.onPrevious.bind(this);
  }

  onNext(e) {
    e.preventDefault();
    const {index} = this.state;
    const {fileKeys} = this.props;
    const nextIndex = (index + 1 >= fileKeys.length)
      ? 0
      : index + 1;
    this.setState({ index: nextIndex });
  }

  onPrevious(e) {
    e.preventDefault();
    const {index} = this.state;
    const {fileKeys} = this.props;
    const nextIndex = (index - 1 < 0)
      ? fileKeys.length - 1
      : index - 1;
    this.setState({ index: nextIndex });
  }

  render() {
    const {fileKeys} = this.props;
    const {index} = this.state;
    
    if (fileKeys.length === 0) {
      return <div>Images not added yet</div>;
    }

    return (
      <div className="MaterialsCarousel" style={styles.root}>
        <MaterialImage fileKey={fileKeys[index]} />
        {fileKeys.length > 1 && (
          <div style={styles.nav}>
            <div style={{...styles.arrow, left: 0}} onClick={this.onPrevious}>◄</div>
            <div style={{...styles.arrow, right: 0}} onClick={this.onNext}>►</div>
          </div>
        )}
      </div>
    );
  }
}
MaterialsCarousel.propTypes = {
  fileKeys: PropTypes.arrayOf(PropTypes.string).isRequired
};

function MaterialImage({fileKey}) {
  // fileKey values are checked into source, but be defensive anyway
  const safeFileKey = fileKey.replace(/[^a-zA-Z0-9-]/g,'');
  const domain = (isStorybookDev()) ? 'http://localhost:3000' : '';
  const path = `${domain}/img/reading/${safeFileKey}.jpg`;
  return (
    <img
      className="MaterialImage"
      title={fileKey}
      width="100%"
      style={styles.image}
      src={path}
    />
  );
}
MaterialImage.propTypes = {
  fileKey: PropTypes.string.isRequired
};


const styles = {
  root: {
    position: 'relative'
  },
  nav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  arrow: {
    color: 'white',
    textShadow: '#999 0px 0px 1px',
    fontSize: 12,
    cursor: 'pointer',
    top: 0,
    bottom: 0,
    width: 30,
    position: 'absolute',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 15
  },
  image: {
    border: '1px solid #ccc'
  }
};


// Check env to see if this is running in dev mode in Storybook.
function isStorybookDev() {
  if (!window.process || !window.process.env) return false;
  if (window.process.env.NODE_ENV !== 'development') return false;
  if (window.process.env.STORYBOOK_RUNNING !== 'true') return false;
  return true;
}