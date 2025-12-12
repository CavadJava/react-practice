import PropTypes from 'prop-types';
import styles from './Input.module.css';
import { useState } from 'react';

export const Input = ({
    type = 'text',
    id,
    name,
    value,
    onChange,
    placeholder,
    error,
    required = false,
    label,
    showRequired = false,
    rows,
    className = ''
}) => {
    const isTextarea = type === 'textarea';

    const [focus, setFocus] = useState(false);

    return (
        <div className={styles.inputWrapper}>
            {label && (
                <label htmlFor={id} className={styles.label}>
                    {label}
                    {showRequired && <span className={styles.required}>*</span>}
                </label>
            )}
            
            {isTextarea ? (
                <textarea
                    id={id}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`${styles.textarea} ${className}`}
                    rows={rows || 4}
                    required={required}
                />
            ) : (
                <input
                    type={type}
                    id={id}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={() => setFocus(false)}
                    onFocus={() => setFocus(true)}
                    placeholder={placeholder}
                    className={`${styles.input} ${className}`}
                    required={required}
                />
            )}

            {error && !focus && <div className={styles.error}>{error}</div>}
            {focus && <div className={styles.info}>Field has been modified</div>}
        </div>
    );
};

Input.propTypes = {
    type: PropTypes.oneOf(['text', 'email', 'tel', 'password', 'number', 'textarea']),
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    required: PropTypes.bool,
    label: PropTypes.string,
    showRequired: PropTypes.bool,
    rows: PropTypes.number,
    className: PropTypes.string
};