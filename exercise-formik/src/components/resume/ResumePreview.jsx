import React from 'react';
// 1. Lazımi Hook-ları və usePDF-i import edin
import { useRef } from 'react'; 
import { usePDF } from 'react-to-pdf'; 
import styles from './ResumePreview.module.css';

function ResumePreview({
            fullName,
            email,
            phone,
            address,
            summary,
            experience,
            education,
            skills}){

    // 2. usePDF Hook-unu komponentin gövdəsinin əvvəlində çağırın.
    // targetRef: PDF-ə çevriləcək DOM elementinə işarə edir.
    // toPDF: Düyməyə klikləndikdə PDF yaratma funksiyası.
    const { toPDF, targetRef } = usePDF({ 
        // Yüklənəcək PDF faylının adı
        filename: `${fullName || 'resume'}_preview.pdf` 
    });

    const hasExperience = experience && experience.length > 0;
    const hasEducation = education && education.length > 0;
    const hasSkills = skills && skills.length > 0;

    return (
        <div className="content">
            {/* 3. PDF Düyməsini əlavə edin */}
            <div>
                {/* Düyməyə klik hadisəsində toPDF funksiyasını çağırın */}
                <button className={styles.pdfButton} onClick={toPDF}>
                    Download PDF
                </button>
            </div>
            
            {/* 4. Önizləmə div-inə targetRef-i əlavə edin */}
            {/* usePDF bu ref vasitəsilə hansı hissəni çevirəcəyini bilir */}
            <div className={styles.preview} ref={targetRef}>
                
                {/* --- Header Section --- */}
                <header className={styles.header}>
                    <h1 className={styles.fullName}>{fullName || 'Your Full Name'}</h1>
                    <div className={styles.contactInfo}>
                        <p>{email}</p>
                        <p>{phone}</p>
                        <p>{address}</p>
                    </div>
                </header>

                {/* ... (Qalan məzmun burada davam edir) ... */}
                
                {/* --- Summary/Objective Section --- */}
                {summary && (
                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>Summary</h3>
                        <p className={styles.summaryText}>{summary}</p>
                    </section>
                )}
                
                {/* Təcrübə, Təhsil və Bacarıqlar hissələrinin də (əvvəlki cavabda dediyimiz kimi) massiv (array) dövrünə salınması tövsiyə olunur. */}
                {/* ... (Qalan məzmun eynidir) ... */}

                {!fullName && !summary && !hasExperience && !hasEducation && !hasSkills && (
                    <p className={styles.emptyMessage}>
                        Please enter your resume details in the form to see the preview here.
                    </p>
                )}
            </div>
        </div>
    )
}

export default ResumePreview;