import React from 'react';
import PropTypes from 'prop-types';
import Circle from '../components/Circle';
import Button from '../components/Button';

// Shows progress through a set of steps for the classroom creator process.
// This also controls the navigation buttons
export default class HorizontalStepper extends React.Component {
  constructor(props) {
    super(props);

    this.onStepChanged = this.onStepChanged.bind(this);
    this.onPreviousClicked = this.onPreviousClicked.bind(this);
    this.onNextClicked = this.onNextClicked.bind(this);
  }

  onStepChanged(stepIndex) {
    const {onStepChanged, availableSteps} = this.props;
    if (availableSteps.indexOf(stepIndex) === -1) return;
    onStepChanged(stepIndex);
  }

  onPreviousClicked() {
    const {stepIndex} = this.props;
    this.onStepChanged(stepIndex - 1);
  }

  onNextClicked() {
    const {stepIndex} = this.props;
    this.onStepChanged(stepIndex + 1);
  }

  render() {
    const {
      steps,
      availableSteps,
      isEditable,
      isRevisable,
      isDirty,
      renderFn,
      style,
      contentStyle
    } = this.props;
    const currentStepIndex = this.props.stepIndex;
    return (
      <div className="HorizontalStepper" style={{...styles.root, ...style}}>
        <div style={styles.bannerContainer}>
          <div>
            {steps.map((step, stepIndex) => {
              return (
                <span
                  key={stepIndex}
                  style={this.renderStyleForBannerItem(stepIndex, currentStepIndex, availableSteps)}
                  onClick={this.onStepChanged.bind(this, stepIndex)}>
                  <Circle
                    text={`${stepIndex+1}`}
                    color={this.renderColorForCircle(stepIndex, availableSteps)}
                    style={{verticalAlign: 'middle'}}/>
                  <span style={styles.bannerText}>{step}</span>
                </span>
              );
            })}
          </div>
          {!isEditable && !isRevisable && <div style={{...styles.label, background: '#666', color: '#eee'}}>readonly</div>}
          {!isEditable && isRevisable && <div style={{...styles.label, background: 'rgb(209, 231, 210)', color: 'green', fontWeight: 'bold'}}>principal</div>}
          {isDirty && <div style={styles.dirty}>●</div>}
        </div>
        <div style={{...styles.content, ...contentStyle}}>
          {renderFn(currentStepIndex, steps[currentStepIndex])}
        </div>
        {this.renderNavigationButtons()}
      </div>
    );
  }

  renderColorForCircle(index, availableSteps) {
    return (availableSteps.indexOf(index) !== -1)
      ? '#3177c9'
      : '#ccc';
  }

  renderStyleForBannerItem(index, currentIndex, availableSteps) {
    if (index === currentIndex) {
      return {
        ...styles.bannerItem,
        borderColor: '#3177c9',
        backgroundColor: 'rgba(49, 119, 201, 0.25)'
      };
    }

    return (availableSteps.indexOf(index) !== -1)
      ? styles.bannerItem
      : {...styles.bannerItem, color: '#ccc' };
  }

  renderNavigationButtons() {
    const {stepIndex, availableSteps} = this.props;
    const shouldShowNext = (availableSteps.indexOf(stepIndex + 1) !== -1);
    const shouldShowPrevious = (availableSteps.indexOf(stepIndex - 1) !== -1);
    return (
      <div style={styles.buttonStrip}>
        {shouldShowPrevious
          ? <Button style={{margin: 10}} onClick={this.onPreviousClicked}>{`< Back `}</Button>
          : <div />}
        {shouldShowNext
          ? <Button style={{margin: 10}} onClick={this.onNextClicked}>{`Next >`}</Button>
          : <div />}
      </div>
    );
  }
}
HorizontalStepper.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.string).isRequired,
  availableSteps: PropTypes.arrayOf(PropTypes.number).isRequired,
  stepIndex: PropTypes.number.isRequired,
  onStepChanged: PropTypes.func.isRequired,
  isEditable: PropTypes.bool.isRequired,
  isRevisable: PropTypes.bool.isRequired,
  isDirty: PropTypes.bool.isRequired,
  renderFn: PropTypes.func.isRequired,
  style: PropTypes.object,
  contentStyle: PropTypes.object
};

const styles = {
  root: {
    paddingTop: 15
  },
  content: {
    borderTop: '1px solid #ccc',
    marginTop: 10,
    flex: 1
  },
  bannerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 12,
    marginLeft: 15,
    marginRight: 15
  },
  bannerItem: {
    padding: 8,
    paddingRight: 10,
    marginLeft: 5,
    marginRight: 8,
    cursor: 'pointer',
    border: '1px solid white',
    borderRadius: 3,
    borderColor: 'white'
  },
  bannerText: {
    paddingLeft: 5
  },
  check: {},
  buttonStrip: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: 10
  },
  divider: {
    width: '2em',
    height: 1,
    borderTop: '1px solid #eee'
  },
  label: {
    display: 'inline-block',
    padding: 6,
    paddingRight: 12,
    paddingLeft: 12,
    marginRight: 10,
    borderRadius: 3
  },
  dirty: {
    color: 'orange',
    display: 'none' // hidden
  }
};
