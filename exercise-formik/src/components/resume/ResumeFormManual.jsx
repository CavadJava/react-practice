import { useState } from 'react';
import styles from './PersonalResume.module.css';
import { Input } from './input/Input';
import { FormGroup } from './FormGroup/FormGroup';
import { isEmailValid, isInternationalPhoneValid } from './constant/regex';


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

export const ResumeFormManual = ({onSubmit}) => {

    const [form, setForm] = useState(initialFormState);

    // Handle input changes for all form fields
    const handleChange = (e) => {

        const value = e.target.value;
        const name = e.target.name;

        const newForm = {
            ...form,
            [name]: value
        }

        setForm(newForm);
        
        // Update preview in real-time
        // if (onFormChange) {
        //     onFormChange(newForm);
        // }

    };

    // Handle form submission
    const handleSubmit = () => {
        console.log('Form Data:', form);


        if(!isEmailValid(form.email)){
            alert('Please enter a valid email address.');
            return;
        }

        if(!isInternationalPhoneValid(form.phone) ){
            alert('Please enter a valid international phone number.');
            return;
        }

        onSubmit?.(form);
        alert('Resume generated! You can now download it as PDF.');
    };

    // Handle form reset
    const handleReset = () => {
        setForm(initialFormState);
            onSubmit?.(initialFormState);
    };

    return (
        <div className={styles.form}>
            <div className={styles.formContainer}>
                <h2 className={styles.formTitle}>Personal Resume Builder</h2>
                <p className={styles.formSubtitle}>Fill out the form to create your professional resume</p>

                <div  className={styles.resumeForm}>
                    
                    {/* Personal Information Section */}
                    <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>Personal Information</h3>
                        
                        <FormGroup>
                            <Input
                                type="text"
                                id="fullName"
                                name="fullName"
                                value={form.fullName}
                                onChange={handleChange}
                                placeholder="John Doe"
                                label="Full Name"
                                showRequired={true}
                                required
                            />
                        </FormGroup>

                        <div className={styles.formRow}>
                            <FormGroup>
                                <Input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="john.doe@example.com"
                                    label="Email"
                                    showRequired={true}
                                    required
                                />
                            </FormGroup>

                            <FormGroup>
                                <Input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="+1 (555) 123-4567"
                                    label="Phone Number"
                                />
                            </FormGroup>
                        </div>

                        <FormGroup>
                            <Input
                                type="text"
                                id="address"
                                name="address"
                                value={form.address}
                                onChange={handleChange}
                                placeholder="123 Main St, City, State, ZIP"
                                label="Address"
                            />
                        </FormGroup>
                    </div>

                    {/* Professional Summary Section */}
                    <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>Professional Summary</h3>
                        
                        <FormGroup>
                            <Input
                                type="textarea"
                                id="summary"
                                name="summary"
                                value={form.summary}
                                onChange={handleChange}
                                placeholder="Brief description of your professional background and goals..."
                                label="About You"
                                rows={4}
                            />
                        </FormGroup>
                    </div>

                    {/* Experience Section */}
                    <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>Work Experience</h3>
                        
                        <FormGroup>
                            <Input
                                type="textarea"
                                id="experience"
                                name="experience"
                                value={form.experience}
                                onChange={handleChange}
                                placeholder="Company Name - Position&#10;Date Range&#10;Job responsibilities and achievements..."
                                label="Experience Details"
                                rows={6}
                            />
                        </FormGroup>
                    </div>

                    {/* Education Section */}
                    <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>Education</h3>
                        
                        <FormGroup>
                            <Input
                                type="textarea"
                                id="education"
                                name="education"
                                value={form.education}
                                onChange={handleChange}
                                placeholder="Degree - Institution Name&#10;Graduation Year&#10;Relevant coursework or achievements..."
                                label="Education Details"
                                rows={4}
                            />
                        </FormGroup>
                    </div>

                    {/* Skills Section */}
                    <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>Skills</h3>
                        
                        <FormGroup>
                            <Input
                                type="textarea"
                                id="skills"
                                name="skills"
                                value={form.skills}
                                onChange={handleChange}
                                placeholder="JavaScript, React, Node.js, etc..."
                                label="Your Skills"
                                rows={3}
                            />
                        </FormGroup>
                    </div>

                    {/* Form Actions */}
                    <div className={styles.formActions}>
                        <button 
                            type="button" 
                            onClick={handleReset}
                            className={`${styles.btn} ${styles.btnSecondary}`}
                        >
                            Reset Form
                        </button>
                        <button 
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            onClick={handleSubmit}
                        >
                            Generate Resume
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
