import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {apiPutJson} from '../helpers/apiFetchJson';
import WarnBeforeUnload from '../components/WarnBeforeUnload';
import uuidv4 from 'uuid/v4';


export default class SecondTransitionNoteDocumentContext extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      doc: props.initialDoc,
      pending: {},
      failed: {}
    };

    this.beforeUnloadMessage = this.beforeUnloadMessage.bind(this);
    this.putChange = _.throttle(this.putChange.bind(this), props.throttleMs);
    this.onDocChanged = this.onDocChanged.bind(this);
  }

  putChange(params = {}) {
    console.log('putChange', params);
    // const {studentId, benchmarkAssessmentKey, value} = params;
    // const {schoolId, grade} = this.props;
    // const url = `/api/reading/update_data_point_json`;
    // return apiPutJson(url, {
    //   student_id: studentId,
    //   school_id: schoolId,
    //   grade: grade,
    //   benchmark_school_year: 2018,
    //   benchmark_period_key: 'winter',
    //   benchmark_assessment_key: benchmarkAssessmentKey,
    //   value: value
    // });
  }

  // Doesn't catch changes within throttle window
  beforeUnloadMessage() {
    const {pending} = this.state;
    return _.values(pending).length > 0 ? 'You have unsaved changes.' : undefined;
  }

  onDocChanged(docDiff) {
    const {doc} = this.state;
    const updatedDoc = {
      ...doc,
      ...docDiff
    };

    const requestId = uuidv4();
    this.setState({
      doc: updatedDoc,
      pending: {
        ...this.state.pending,
        [requestId]: {updatedDoc}
      }
    });

    console.log('this.putChange', this.putChange, this);
    this.putChange({updatedDoc})
      .then(this.onRequestDone.bind(this, requestId))
      .catch(this.onRequestError.bind(this, requestId));
  }

  onRequestDone(requestId) {
    this.setState({
      pending: _.omit(this.state.pending, requestId)
    });
  }
  
  onRequestError(requestId, err) {
    this.setState({
      pending: _.omit(this.state.pending, requestId),
      failed: {
        ...this.state.failed,
        [requestId]: err
      }
    });
  }

  render() {
    const {children} = this.props;
    const {doc, pending, failed} = this.state;

    return (
      <WarnBeforeUnload messageFn={this.beforeUnloadMessage}>
        {children({
          doc,
          pending: _.values(pending),
          failed: _.values(failed),
          onDocChanged: this.onDocChanged
        })}
      </WarnBeforeUnload>
    );
  }
}
SecondTransitionNoteDocumentContext.propTypes = {
  initialDoc: PropTypes.any.isRequired,
  children: PropTypes.func.isRequired,
  throttleMs: PropTypes.number
};
SecondTransitionNoteDocumentContext.defaultProps = {
  throttleMs: 2000
};