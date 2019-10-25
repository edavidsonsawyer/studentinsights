import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import moment from 'moment';
import serviceColor from '../helpers/serviceColor';
import {questionMarkEl} from './LightHelpBubble';

/*
Renders the list of services.
*/
export default class ServicesList extends React.Component {
  constructor(props) {
    super(props);

    this.state = initialState();
    this.onMouseLeaveCancel = this.onMouseLeaveCancel.bind(this);
    this.onMouseLeaveDiscontinue = this.onMouseLeaveDiscontinue.bind(this);
  }

  wasDiscontinued(service) {
    return (service.discontinued_by_educator_id !== null);
  }

  // Active services before inactive, then sorted by time
  sortedMergedServices(servicesFeed) {
    return _.flatten([
      _.sortBy(servicesFeed.active, 'date_started').reverse(),
      _.sortBy(servicesFeed.discontinued, 'date_started').reverse()
    ]);
  }

  // Confirmation step
  onClickDiscontinueService(serviceId) {
    if (this.state.discontinuingServiceId !== serviceId) {
      this.setState({
        ...initialState(),
        discontinuingServiceId: serviceId
      });
      return;
    }

    this.props.onClickDiscontinueService(serviceId);
    this.setState(initialState());
  }

  onClickCancelDiscontinue(serviceId) {
    this.setState(initialState());
  }

  onMouseEnterDiscontinue(serviceId) {
    this.setState({ hoveringDiscontinueServiceId: serviceId });
  }

  onMouseLeaveDiscontinue() {
    this.setState({ hoveringDiscontinueServiceId: null });
  }

  onMouseEnterCancel(serviceId) {
    this.setState({ hoveringCancelServiceId: serviceId });
  }

  onMouseLeaveCancel() {
    this.setState({ hoveringCancelServiceId: null });
  }

  render() {
    const elements = (this.props.servicesFeed.active.length === 0 && this.props.servicesFeed.discontinued.length === 0)
      ? <div style={styles.noItems}>
      No services
      </div>
      : this.sortedMergedServices(this.props.servicesFeed).map(this.renderService, this);
    return (
      <div className="ServicesList">
        {elements}
      </div>
    );
  }

  renderService(service) {
    const {serviceTypesIndex, servicesInfoDocUrl} = this.props;
    const wasDiscontinued = this.wasDiscontinued(service);
    const serviceText = serviceTypesIndex[service.service_type_id].name;
    const providedByEducatorName = service.provided_by_educator_name;
    return (
      <div
        key={service.id}
        style={{
          ...styles.service,
          background: serviceColor(service.service_type_id),
          opacity: (wasDiscontinued) ? 0.8 : 1
        }}>
        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold' }}>
              {serviceText}
              {servicesInfoDocUrl && (
                <a style={styles.infoDocLink} href={servicesInfoDocUrl} target="_blank" rel="noopener noreferrer">
                  {questionMarkEl(16, {verticalAlign: 'middle'})}
                </a>
              )}
            </div>
            {this.renderEducatorName(providedByEducatorName)}
            {this.renderDateStarted(service)}
            {this.renderEstimatedEndDate(service)}
            {this.renderTimeSinceStarted(service)}
          </div>
          {this.renderDiscontinuedInformation(service)}
        </div>
        <div style={{...styles.userText, paddingTop: 15}}>
          {service.comment}
        </div>
      </div>
    );
  }

  renderDateStarted(service) {
    const momentStarted = moment.utc(service.date_started);

    // For services started earlier than today, show the date started:
    return (
      <div>
        {'Started '}
        {momentStarted.format('MMMM D, YYYY')}
      </div>
    );
  }

  renderEstimatedEndDate(service) {
    const momentEnded = moment.utc(service.estimated_end_date);

    // If estimated end date exist then show ui:
    if (momentEnded.isValid()) return (
      <div>
        {'Scheduled to End '}
        {momentEnded.format('MMMM D, YYYY')}
      </div>
    );
  }

  renderTimeSinceStarted(service) {
    const wasDiscontinued = this.wasDiscontinued(service);
    const momentStarted = moment.utc(service.date_started);

    // For discontinued services, display the length of time between start and discontinue dates
    if (wasDiscontinued) {
      return (
        <div>
          {moment.utc(service.discontinued_recorded_at).from(moment.utc(service.date_started), true)}
        </div>
      );
    }

    // Don't show how long service has been going if it was added today
    const {nowFn} = this.context;
    const nowMoment = nowFn();
    const startedToday = nowMoment.subtract(1, 'day') < momentStarted;
    if (startedToday) return null;

    // Show how long the service has been going
    return (
      <div>
        {moment.utc(service.date_started).from(nowMoment, true)}
      </div>
    );
  }

  renderEducatorName(educatorName) {
    if (educatorName !== "" && educatorName !== null) {
      return (
        <div>
          {'With ' + educatorName}
        </div>
      );
    }
  }

  renderDiscontinuedInformation(service) {
    const discontinuedAt = moment.utc(service.discontinued_recorded_at);
    const now = moment();

    const description = (discontinuedAt > now)
      ? 'Ending'
      : 'Ended';

    if (this.wasDiscontinued(service)) {
      return (
        <div>
          <div>
            {description}
          </div>
          <div>
            {discontinuedAt.format('MMMM D, YYYY')}
          </div>
        </div>
      );
    }

    return this.renderDiscontinueButton(service);
  }

  // Toggles when in confirmation state
  renderDiscontinueButton(service) {
    const isConfirming = (this.state.discontinuingServiceId === service.id);
    const isHovering = (this.state.hoveringDiscontinueServiceId === service.id);
    const isPending = (this.props.discontinueServiceRequests[service.id] === 'pending');
    let text = 'Confirm';

    if (isPending) {
      text = 'Updating...';
    } else if (isConfirming) {
      text = 'Confirm';
    } else if (service.estimated_end_date === null) {
      text = 'Discontinue';
    } else {
      text = 'Discontinue Early';
    }

    const buttonText = text;
    const style = (isConfirming || isPending) ?
      styles.discontinueConfirm
      : (isHovering) ? {} : styles.discontinue;

    const discontinueButton = <button
      className="btn"
      onMouseEnter={this.onMouseEnterDiscontinue.bind(this, service.id)}
      onMouseLeave={this.onMouseLeaveDiscontinue}
      style={style}
      onClick={this.onClickDiscontinueService.bind(this, service.id)}>
      {buttonText}
    </button>;

    const cancelButton = (isConfirming) ? this.renderCancelDiscontinueButton(service) : null;
    return (
      <div>
        {discontinueButton}
        {cancelButton}
      </div>
    );
  }

  renderCancelDiscontinueButton(service) {
    const isHovering = (this.state.hoveringCancelServiceId === service.id);
    const style = (isHovering) ? {} : styles.cancel;

    return (
      <button
        className="btn"
        onMouseEnter={this.onMouseEnterCancel.bind(this, service.id)}
        onMouseLeave={this.onMouseLeaveCancel}
        style={{...style, marginLeft: 5}}
        onClick={this.onClickCancelDiscontinue.bind(this, service.id)}>
        Cancel
      </button>
    );
  }
}
ServicesList.contextTypes = {
  nowFn: PropTypes.func.isRequired
};
ServicesList.propTypes = {
  servicesFeed: PropTypes.object.isRequired,
  serviceTypesIndex: PropTypes.object.isRequired,
  educatorsIndex: PropTypes.object.isRequired,
  discontinueServiceRequests: PropTypes.object.isRequired,
  onClickDiscontinueService: PropTypes.func.isRequired,
  servicesInfoDocUrl: PropTypes.string
};
  
function initialState() {
  return {
    hoveringDiscontinueServiceId: null,
    hoveringCancelServiceId: null,
    discontinuingServiceId: null
  };
}

const styles = {
  noItems: {
    margin: 10
  },
  service: {
    border: '1px solid #eee',
    padding: 15,
    marginTop: 10,
    marginBottom: 10
  },
  userText: {
    whiteSpace: 'pre-wrap'
  },
  daysAgo: {
    opacity: 0.25,
    paddingLeft: '0.5em'
  },
  discontinue: {
    background: 'white',
    opacity: 0.5,
    border: '1px solid #ccc',
    color: '#666'
  },
  cancel: {
    background: 'white',
    color: 'black'
  },
  discontinueConfirm: {
    background: '#E2664A'
  },
  infoDocLink: {
    display: 'inline-block',
    marginLeft: 10,
    color: '#999'
  }
};

