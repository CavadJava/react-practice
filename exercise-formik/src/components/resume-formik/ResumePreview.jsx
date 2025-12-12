import styles from './PersonalResume.module.css';
import { usePDF } from 'react-to-pdf';

function ResumePreview({
    fullName = '',
    email = '',
    phone = '',
    address = '',
    summary = '',
    experience = '',
    education = '',
    skills = ''
}){
  const { toPDF, targetRef } = usePDF({filename: `${fullName || 'resume'}.pdf`});

    return (
        <div className={styles.preview}>
            <div className={styles.previewContainer}>
                
                {/* Preview Header */}
                <div className={styles.previewHeader}>
                    <h2 className={styles.previewTitle}>Resume Preview</h2>
                    <button className={styles.downloadBtn} onClick={() => toPDF()} >
                        📄 Download PDF
                    </button>
                </div>

                {/* Resume Paper */}
                <div ref={targetRef} className={styles.resumePaper}>
                    
                    {/* Resume Header - Personal Info */}
                    <div className={styles.resumeHeader}>
                        <h1 className={styles.resumeName}>
                            {fullName || 'Your Name'}
                        </h1>
                        <div className={styles.contactInfo}>
                            {email && (
                                <span className={styles.contactItem}>
                                    📧 {email}
                                </span>
                            )}
                            {phone && (
                                <span className={styles.contactItem}>
                                    📱 {phone}
                                </span>
                            )}
                            {address && (
                                <span className={styles.contactItem}>
                                    📍 {address}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className={styles.divider}></div>

                    {/* Professional Summary */}
                    {summary && (
                        <div className={styles.resumeSection}>
                            <h3 className={styles.resumeSectionTitle}>
                                Professional Summary
                            </h3>
                            <p className={styles.resumeText}>
                                {summary}
                            </p>
                        </div>
                    )}

                    {/* Work Experience */}
                    {experience && (
                        <div className={styles.resumeSection}>
                            <h3 className={styles.resumeSectionTitle}>
                                Work Experience
                            </h3>
                            <div className={styles.resumeText}>
                                {experience.split('\n').map((line, index) => (
                                    line.trim() && (
                                        <p key={index} className={styles.experienceLine}>
                                            {line}
                                        </p>
                                    )
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Education */}
                    {education && (
                        <div className={styles.resumeSection}>
                            <h3 className={styles.resumeSectionTitle}>
                                Education
                            </h3>
                            <div className={styles.resumeText}>
                                {education.split('\n').map((line, index) => (
                                    line.trim() && (
                                        <p key={index} className={styles.educationLine}>
                                            {line}
                                        </p>
                                    )
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Skills */}
                    {skills && (
                        <div className={styles.resumeSection}>
                            <h3 className={styles.resumeSectionTitle}>
                                Skills
                            </h3>
                            <div className={styles.skillsContainer}>
                                {skills.split(',').map((skill, index) => (
                                    skill.trim() && (
                                        <span key={index} className={styles.skillTag}>
                                            {skill.trim()}
                                        </span>
                                    )
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!fullName && !email && !phone && !summary && !experience && !education && !skills && (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>📝</div>
                            <h3 className={styles.emptyTitle}>Start Building Your Resume</h3>
                            <p className={styles.emptyText}>
                                Fill out the form on the left to see your resume preview here
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    )}
    
export default ResumePreview;