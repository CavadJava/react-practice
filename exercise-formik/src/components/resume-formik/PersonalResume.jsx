import React from 'react';
import styles from './PersonalResume.module.css';
import { ResumeForm } from './ResumeFormik';
import ResumeFormik from './ResumeFormik';

function PersonalResume(){
    const [data, setData] = React.useState();

    function onSubmit(formData){
        setData(formData);
    }

    return (
        <>
            <div className={styles.content}>
                <ResumeForm onSubmit={onSubmit}/>
                <ResumeFormik {...data}/>
            </div>
        </>
    )
}

export default PersonalResume;