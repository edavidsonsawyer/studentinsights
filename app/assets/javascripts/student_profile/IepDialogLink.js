import React from 'react';
import PropTypes from 'prop-types';
import {
  supportsSpedLiaison,
  shouldShowIepLink
} from '../helpers/PerDistrict';
import {
  hasActiveIep,
  prettyLevelOfNeedText,
  prettyIepTextForSpecialEducationStudent,
  cleanSpecialEducationValues
} from '../helpers/specialEducation';
import HelpBubble, {
  modalFullScreenFlex,
  dialogFullScreenFlex
} from '../components/HelpBubble';
import Pdf from '../student_profile/Pdf'; // TODO

// For students who have an IEP, render a link that describes the IEP
// and lets educators click to open a dialog and see more.
export default class IepDialogLink extends React.Component {
  render() {
    const {districtKey} = this.context;
    const {student, linkEl} = this.props;
    if (!hasActiveIep(student)) return null;

    // Enable different text (eg, shorted) and disabling links
    const specialEducationText = (linkEl === undefined || linkEl === null)
      ? prettyIepTextForSpecialEducationStudent(student)
      : linkEl;
    if (!shouldShowIepLink(districtKey)) {
      return <span>{specialEducationText}</span>;
    }
    
    return (
      <HelpBubble
        style={{marginLeft: 0, display: 'block'}}
        teaser={specialEducationText}
        linkStyle={styles.subtitleItem}
        modalStyle={{
          ...modalFullScreenFlex,
          overlay: {
            zIndex: 30
          }
        }}
        dialogStyle={dialogFullScreenFlex}
        title={`${student.first_name}'s ${specialEducationText}`}
        withoutSpacer={true}
        withoutContentWrapper={true}
        content={this.renderIEPDialog()}
      />
    );
  }

  renderIEPDialog() {
    const {districtKey} = this.context;
    const {student, iepDocument} = this.props;

    const spedLiaison = student.sped_liaison;
    const {program, placement, levelOfNeed, disability} = cleanSpecialEducationValues(student);
    return (
      <div style={styles.dialog}>
        {supportsSpedLiaison(districtKey) && spedLiaison && (
          <div style={styles.contactItem}>
            <div>SPED liaison: {spedLiaison}</div>
          </div>
        )}
        {program && (
          <div style={styles.contactItem}>
            <div>Program: {program}</div>
          </div>
        )}
        {placement && (
          <div style={styles.contactItem}>
            <div>Placement: {placement}</div>
          </div>
        )}
        {disability && (
          <div style={styles.contactItem}>
            <div>Disability: {disability}</div>
          </div>
        )}
        {levelOfNeed && (
          <div style={styles.contactItem}>
            <div>Level of need: {prettyLevelOfNeedText(levelOfNeed)}</div>
          </div>
        )}
        {iepDocument && (
          <div style={{...styles.contactItem, ...styles.iepDocumentSection}}>
            <a href={`/students/${student.id}/latest_iep_document`} style={styles.subtitleItem}>Download IEP at a glance PDF</a>
            {this.renderPdfInline(student.id)}
          </div>
        )}
      </div>
    );
  }

  renderPdfInline(studentId) {
    const url = `/students/${studentId}/latest_iep_document#view=FitBH`;
    return (
      <Pdf
        style={styles.pdfInline}
        url={url}
        fallbackEl={(
          <div style={styles.pdfFallbackMessage}>
            <div>Use Firefox, Safari, Edge or Chrome to view this PDF right on the page.</div>
            <div>If you’re using an older version of Internet Explorer, you can install Adobe Acrobat Reader.</div>
          </div>
        )}
      />
    );
  }

}
IepDialogLink.contextTypes = {
  districtKey: PropTypes.string.isRequired
};
IepDialogLink.propTypes = {
  student: PropTypes.object.isRequired,
  iepDocument: PropTypes.object,
  linkEl: PropTypes.node
};

const styles = {
  subtitleItem: {
    display: 'inline-block',
    fontSize: 14
  },
  contactItem: {
    paddingTop: 2
  },
  dialog: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    fontSize: 14
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
  }
};
