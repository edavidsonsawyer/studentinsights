import PropTypes from 'prop-types';
import React from 'react';
import {eventNoteTypeText} from '../helpers/eventNoteType';
import Educator from '../components/Educator';
import NoteText from '../components/NoteText';
import HouseBadge from '../components/HouseBadge';
import NoteBadge from '../components/NoteBadge';
import Timestamp from '../components/Timestamp';
import FeedCardFrame from './FeedCardFrame';


// Render a card in the feed for an EventNote
export default class EventNoteCard extends React.Component {
  render() {
    const {eventNoteCardJson, iconsEl, style, children} = this.props;
    const {student, educator} = eventNoteCardJson;

    return (
      <div className="EventNoteCard">
        <FeedCardFrame
          style={style}
          student={student}
          byEl={
            <div>
              <span>by </span>
              <Educator
                style={styles.person}
                educator={educator} />
            </div>
          }
          whereEl={<div>in {eventNoteTypeText(eventNoteCardJson.event_note_type_id)}</div>}
          whenEl={<Timestamp railsTimestamp={eventNoteCardJson.recorded_at} />}
          badgesEl={<div>
            {student.house && <HouseBadge style={styles.footerBadge} house={student.house} />}
            <NoteBadge style={styles.footerBadge} eventNoteTypeId={eventNoteCardJson.event_note_type_id} />
          </div>}
          iconsEl={iconsEl}
        >
          {children || <NoteText text={eventNoteCardJson.text} />}
        </FeedCardFrame>
      </div>
    );
  }
}
EventNoteCard.propTypes = {
  eventNoteCardJson: PropTypes.shape({
    id: PropTypes.number.isRequired,
    recorded_at: PropTypes.string.isRequired,
    event_note_type_id: PropTypes.number.isRequired,
    text: PropTypes.string.isRequired,
    educator: PropTypes.object.isRequired,
    student: PropTypes.shape({
      id: PropTypes.number.isRequired,
      first_name: PropTypes.string.isRequired,
      last_name: PropTypes.string.isRequired,
      grade: PropTypes.string.isRequired,
      house: PropTypes.string,
      school: PropTypes.shape({
        local_id: PropTypes.string.isRequired,
        school_type: PropTypes.string.isRequired
      }),
      homeroom: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        educator: PropTypes.object
      })
    })
  }).isRequired,
  iconsEl: PropTypes.node,
  style: PropTypes.object,
  children: PropTypes.node
};


const styles = {
  footerBadge: {
    marginLeft: 5
  },
  person: {
    fontWeight: 'bold'
  }
};
