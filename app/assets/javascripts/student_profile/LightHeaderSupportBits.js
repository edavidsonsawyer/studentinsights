import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  hasActive504Plan,
  supportsSpedLiaison,
  supportsCounselor
} from '../helpers/PerDistrict';
import {
  hasActiveIep,
  prettyProgramOrPlacementText
} from '../helpers/specialEducation';
import {maybeCapitalize} from '../helpers/pretty';
import HelpBubble, {
  modalFromLeft,
  modalFullScreenFlex,
  dialogFullScreenFlex
} from '../components/HelpBubble';
import Team from '../components/Team';
import IepDialogLink from './IepDialogLink';
import EdPlansPanel from './EdPlansPanel';
import LanguageStatusLink from './LanguageStatusLink';


/*
UI component for seconds column with extra bits about the
student (eg, IEP, FLEP, staff contacts).
*/
export default class LightHeaderSupportBits extends React.Component {
  educatorNamesFromServices() {
    const {activeServices} = this.props;
    const rawEducatorNames = activeServices.map(service => service.provided_by_educator_name);
    return _.compact(_.uniq(rawEducatorNames)).filter(name => name !== '');
  }

  render() {
    const {style} = this.props;

    // This has to fit within five lines, given parent layout.
    return (
      <div className="LightHeaderSupportBits" style={{...styles.root, style}}>
        {this.render504()}
        {this.renderProgram()}
        {this.renderIEP()}
        {this.renderLanguage()}
        {this.renderEducators()}
      </div>
    );
  }

  renderEducators() {
    const {districtKey} = this.context;
    const {student} = this.props;
    const hasAnyContacts = (
      (supportsCounselor(districtKey) && student.counselor) ||
      student.sped_liaison ||
      (this.educatorNamesFromServices().length > 0)
    );
    if (!hasAnyContacts) return <span>No educator contacts</span>;

    return (
      <HelpBubble
        style={{marginLeft: 0, display: 'inline-block'}}
        linkStyle={styles.subtitleItem}
        teaser="Educator contacts"
        modalStyle={modalFromLeft}
        title="Educator contacts"
        content={this.renderEducatorContactsDialog()} />
    );
  }

  renderEducatorContactsDialog() {
    return (
      <div style={{fontSize: 14}}>
        <div style={styles.contactItem}>
          {this.renderCounselor()}
        </div>
        <div style={styles.contactItem}>
          {this.renderSpedLiaison()}
        </div>
        {this.renderCoaches()}
        {this.renderOtherStaff()}
      </div>
    );
  }

  renderCounselor() {
    const {districtKey} = this.context;
    if (!supportsCounselor(districtKey)) return false;

    const {student} = this.props;
    const {counselor} = student;
    if (!counselor) return null;

    return (
      <div style={styles.contactItem}>
        <div>Counselor:</div>
        <div>{maybeCapitalize(counselor)}</div>
      </div>
    );
  }

  renderSpedLiaison() {
    const {districtKey} = this.context;
    if (supportsSpedLiaison(districtKey)) return false;

    const {student} = this.props;
    const spedLiaison = student.sped_liaison;
    if (spedLiaison === null || spedLiaison === undefined) return null;

    return (
      <div style={styles.contactItem}>
        <div>SPED liaison:</div>
        <div>{maybeCapitalize(spedLiaison)}</div>
      </div>
    );
  }

  // Include all teams, not just active
  renderCoaches() {
    const {teams} = this.props;
    const coachNames = _.uniq(_.compact(teams.map(team => team.coach_text)));
    if (coachNames.length === 0) return null;

    return (
      <div style={styles.contactItem}>
        <div>Team coaches:</div>
        {teams.map(team=> (
          <div key={team.activity_text}>{team.coach_text} for <Team team={team} /> in the {team.season_key} season</div>
        ))}
      </div>
    );
  }

  renderOtherStaff() {
    const educatorNames = this.educatorNamesFromServices();
    if (educatorNames.length === 0) return null;

    return (
      <div style={styles.contactItem}>
        <div>Educators providing services:</div>
        {educatorNames.map(educatorName => (
          <div key={educatorName}>{educatorName}</div>
        ))}
      </div>
    );
  }

  renderIEP() {
    const {student, iepDocument} = this.props;
    if (!hasActiveIep(student)) return null;

    return (
      <IepDialogLink
        student={student}
        iepDocument={iepDocument}
      />
    );
  }

  renderProgram() {
    const {student} = this.props;
    const prettyText = prettyProgramOrPlacementText(student);
    if (!prettyText) return null;

    return (
      <div style={styles.subtitleItem}>{prettyText}</div>
    );
  }


  render504() {
    const {edPlans, student} = this.props;
    const plan504 = student.plan_504;
    if (!hasActive504Plan(plan504)) return null;

    const plan504El = <div style={styles.subtitleItem}>504 plan</div>;
    if (edPlans.length === 0) return plan504El;

    return (
      <HelpBubble
        style={{marginLeft: 0, display: 'block'}}
        teaser="504 plan"
        linkStyle={styles.subtitleItem}
        modalStyle={modalFullScreenFlex}
        dialogStyle={dialogFullScreenFlex}
        title={`${student.first_name}'s 504 plan`}
        withoutSpacer={true}
        withoutContentWrapper={true}
        content={this.render504Dialog()}
      />
    );
  }

  render504Dialog() {
    const {edPlans, student} = this.props;
    const studentName = `${student.first_name} ${student.last_name}`;
    return (
      <div style={styles.dialog}>
        <EdPlansPanel edPlans={edPlans} studentName={studentName} />
      </div>
    );
  }

  renderLanguage() {
    const {student, access} = this.props;
    const limitedEnglishProficiency = student.limited_english_proficiency;
    return (
      <LanguageStatusLink
        style={styles.subtitleItem}
        studentFirstName={student.first_name}
        ellTransitionDate={student.ell_transition_date}
        limitedEnglishProficiency={limitedEnglishProficiency}
        access={access} 
      />
    );
  }
}
LightHeaderSupportBits.contextTypes = {
  districtKey: PropTypes.string.isRequired
};
LightHeaderSupportBits.propTypes = {
  iepDocument: PropTypes.object,
  access: PropTypes.object,
  teams: PropTypes.arrayOf(PropTypes.shape({
    activity_text: PropTypes.string.isRequired,
    coach_text: PropTypes.string.isRequired
  })).isRequired,
  activeServices: PropTypes.arrayOf(PropTypes.shape({
    provided_by_educator_name: PropTypes.string
  })).isRequired,
  edPlans: PropTypes.arrayOf(PropTypes.object).isRequired,
  student: PropTypes.shape({
    id: PropTypes.number.isRequired,
    first_name: PropTypes.string.isRequired,
    last_name: PropTypes.string.isRequired,
    grade: PropTypes.string,
    disability: PropTypes.string,
    sped_placement: PropTypes.string,
    plan_504: PropTypes.string,
    limited_english_proficiency: PropTypes.string,
    ell_entry_date: PropTypes.string,
    ell_transition_date: PropTypes.string,
    enrollment_status: PropTypes.string,
    home_language: PropTypes.string,
    date_of_birth: PropTypes.string,
    student_address: PropTypes.string,
    primary_phone: PropTypes.string,
    primary_email: PropTypes.string,
    house: PropTypes.string,
    counselor: PropTypes.string,
    sped_liaison: PropTypes.string,
    homeroom_id: PropTypes.number,
    school_name: PropTypes.string,
    school_local_id: PropTypes.string,
    homeroom_name: PropTypes.string,
    has_photo: PropTypes.bool
  }).isRequired,
  style: PropTypes.object
};

const styles = {
  root: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end'
  },
  overviewColumn: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1
  },
  subtitleItem: {
    display: 'inline-block',
    fontSize: 14
  },
  contactItem: {
    paddingTop: 2
  },
  svgIcon: {
    fill: "#3177c9",
    opacity: 0.5
  },
  carousel: {
    flex: 1,
    display: 'flex'
  },
  dialog: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    fontSize: 14
  },
  flexVertical: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  pdfInline: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    marginTop: 10,
    marginBottom: 10,
    border: '1px solid #333'
  },
  pdfFallbackMessage: {
    padding: 20,
    background: '#eee',
    color: '#333',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iepDocumentSection: {
    marginTop: 20,
    marginBottom: 20,
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  }
};

