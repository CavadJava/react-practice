import React from 'react';
import ResumeForm from './ResumeForm';
import ResumePreview from './ResumePreview';
import styles from './PersonalResume.module.css';

function PersonalResume(){
    const [data, setData] = React.useState();

    function onSubmitData(data){
        console.log("Data submitted");
        setData(data);
        console.log(data);
    }

    return (
        <>
            <div className={styles.content}>
                <ResumeForm onSubmitData={onSubmitData}/>
                <ResumePreview {...data}/>
            </div>
        </>
    )
}

export default PersonalResume;