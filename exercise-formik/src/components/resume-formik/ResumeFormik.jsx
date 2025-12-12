// import { useState } from 'react';
import styles from './PersonalResume.module.css'
import {isInternationalPhoneValid } from './constant/regex';
import { Input } from './Input';
import { FormGroup } from './FormGroup';
import { useFormik } from 'formik';
import * as Yup from 'yup';


const validationSchema = Yup.object({
    fullName: Yup.string().required('Full Name is required'),
    email: Yup.string().email('Please enter a valid email address.').required('Email is required'),
    phone: Yup.string()
        .required('Phone number is required')
        .test('is-valid-phone', 'Please enter a valid international phone number.', function(value) {
            if (!value) return false;
            return isInternationalPhoneValid(value);
        }),
});

const initialValues = {
            fullName: '',
            email: '',
            phone: '',
            address: '',
            summary: '',
            experience: '',
            education: '',
            skills: ''
    }

export const ResumeFormik = ({onSubmit}) => {

    // const [form, setForm] = useState(initialFormState);

    const {values, errors, handleChange, handleSubmit, handleReset, isValid} = useFormik({
        initialValues,
        validationSchema,
        validateOnChange: true,
        validateOnBlur: true,
        validateOnMount: true,
        onSubmit: (values,options) => {
            console.log('Form Data:', values);
            console.log("options",options);
            
            onSubmit?.(values);

            // options.resetForm();
        },
        // validate: (values) => {
        //     const errors = {};
            
        //     if (!values.fullName) {
        //         errors.fullName = 'Full Name is required';
        //     }

        //     if (!values.email) {
        //         errors.email = 'Email is required';
        //     } else if (!isEmailValid(values.email)) {
        //         errors.email = 'Please enter a valid email address.';
        //     }

        //     if (values.phone && !isInternationalPhoneValid(values.phone)) {
        //         errors.phone = 'Please enter a valid international phone number.';
        //     }

        //     return errors;
        // }
    })



    // Handle input changes for all form fields
    // const handleChange = (e) => {

    //     const value = e.target.value;
    //     const name = e.target.name;

    //     const newForm = {
    //         ...form,
    //         [name]: value
    //     }

    //     setForm(newForm);
        
    //     // Update preview in real-time
    //     // if (onFormChange) {
    //     //     onFormChange(newForm);
    //     // }

    // };

    // Handle form submission
    // const handleSubmit = () => {
    //     console.log('Form Data:', form);


    //     if(!isEmailValid(form.email)){
    //         alert('Please enter a valid email address.');
    //         return;
    //     }

    //     if(!isInternationalPhoneValid(form.phone) ){
    //         alert('Please enter a valid international phone number.');
    //         return;
    //     }

    //     onSubmit?.(form);
    //     alert('Resume generated! You can now download it as PDF.');
    // };

    // Handle form reset
    // const handleReset = () => {
    //     setForm(initialFormState);
    //         onSubmit?.(initialFormState);
    // };

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
                                value={values.fullName}
                                error={errors.fullName}
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
                                    value={values.email}
                                    error={errors.email}
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
                                    value={values.phone}
                                    error={errors.phone}
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
                                value={values.address}
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
                                value={values.summary}
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
                                value={values.experience}
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
                                value={values.education}
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
                                value={values.skills}
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
                            // onClick={()=>handleSubmit()}
                            disabled={!isValid}
                        >
                            Generate Resume
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
