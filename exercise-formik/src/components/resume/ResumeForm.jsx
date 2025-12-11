import React from 'react';
import styles from './PersonalResume.module.css';

const initialFormState = {
            fullName: '',
            email: '',
            phone: '',
            address: '',
            summary: '',
            experience: '',
            education: '',
            skills: ''
        }

function ResumeForm ({onSubmitData}) {
    const [form, setForm] = React.useState(initialFormState);
    const handleChange = (e) => {
        const {name, value} = e.target;

        const newForm = {...form, [name]: value};

        setForm(newForm);
        onSubmitData(form);
    };

    const handleSubmit = () => {
        onSubmitData(form);
        alert("Resume Submitted Successfully!");
    }
    const handleReset = () => {
        setForm?.(initialFormState);
    }

    return (
        <>
            <div className={styles.form}>
            <h2>Resume Form</h2>
            <form onReset={handleReset} onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label htmlFor="fullName">Full Name *</label>
                    <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className={styles.input}
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="email">Email *</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={form.email}
                        className={styles.input}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="phone">Phone *</label>
                    <input
                        type="text"
                        id="phone"
                        name="phone"
                        placeholder="1234567890"
                        value={form.phone}
                        className={styles.input}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="address">Address *</label>
                    <input
                        type="text"
                        id="address"
                        name="address"
                        value={form.address}
                        className={styles.input}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="summary">Summary</label>
                    <textarea
                        id="summary"
                        name="summary"
                        rows="3"
                        value={form.summary}
                        className={styles.input}
                        onChange={handleChange}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="experience">Experience</label>
                    <textarea
                        id="experience"
                        name="experience"
                        rows="3"
                        value={form.experience}
                        className={styles.input}
                        onChange={handleChange}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="education">Education</label>
                    <textarea
                        id="education"
                        name="education"
                        rows="3"
                        value={form.education}
                        className={styles.input}
                        onChange={handleChange}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="skills">Skills</label>
                    <input
                        type="text"
                        id="skills"
                        name="skills"
                        placeholder="e.g., JavaScript, React, CSS"
                        value={form.skills}
                        className={styles.input}
                        onChange={handleChange}
                    />
                </div>

                <button type="button" className={styles.submitBtn} onClick={handleReset}>Reset</button>
                <button type="type" className={styles.submitBtn} onClick={handleSubmit}>
                    Submit Resume
                </button>
            </form>
            </div>
        </>
    )
}
export default ResumeForm;