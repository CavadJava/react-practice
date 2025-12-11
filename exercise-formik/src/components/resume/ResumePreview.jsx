import React from 'react';
import styles from './ResumePreview.module.css';

// neticeni gosteren komponent (Component that shows the result)

function ResumePreview({
            fullName,
            email,
            phone,
            address,
            summary,
            experience,
            education,
            skills}){

    // The component is already receiving data via props, 
    // so the useState hook (const [data, setData] = React.useState();) is not strictly needed 
    // unless you plan to handle internal state, which is unnecessary here.

    const hasExperience = experience && experience.length > 0;
    const hasEducation = education && education.length > 0;
    const hasSkills = skills && skills.length > 0;

    return (
        <div className={styles.preview}>
            {/* --- Header Section --- */}
            <header className={styles.header}>
                <h1 className={styles.fullName}>{fullName || 'Your Full Name'}</h1>
                <div className={styles.contactInfo}>
                    <p>{email}</p>
                    <p>{phone}</p>
                    <p>{address}</p>
                </div>
            </header>

            {/* --- Summary/Objective Section --- */}
            {summary && (
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Summary</h3>
                    <p className={styles.summaryText}>{summary}</p>
                </section>
            )}

            {/* --- Experience Section --- */}
            {hasExperience && (
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Experience</h3>
                        <div className={styles.jobEntry}>
                            <div className={styles.jobHeader}>
                            <p className={styles.jobTitle}>
                                <strong>{experience || 'Job Title'}</strong>
                            </p>
                        </div>
                            <p className={styles.jobDescription}>{experience}</p>
                        </div>
                    
                </section>
            )}


            {/* --- Education Section --- */}
            {hasEducation && (
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Education</h3>
                        <div className={styles.educationEntry}>
                            <div className={styles.eduHeader}>
                                <p className={styles.eduDegree}>
                                    <strong>{education || 'Degree/Certificate'}</strong>
                                </p>
                            </div>
                            <p className={styles.eduInstitution}>{education || 'Institution Name'}</p>
                        </div>
                </section>
            )}

            {/* --- Skills Section --- */}
            {hasSkills && (
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Skills</h3>
                    <ul className={styles.skillsList}>
                            <li className={styles.skillItem}>{skills}</li>
                    </ul>
                </section>
            )}

            
            
            {/* Displaying a message if no core data is provided */}
            {!fullName && !summary && !hasExperience && !hasEducation && !hasSkills && (
                <p className={styles.emptyMessage}>
                    Please enter your resume details in the form to see the preview here.
                </p>
            )}
        </div>
    )
}

export default ResumePreview;