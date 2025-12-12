import PropTypes from 'prop-types';
import styles from './FormGroup.module.css';

export const FormGroup = ({ children, className = '' }) => {
    return (
        <div className={`${styles.formGroup} ${className}`}>
            {children}
        </div>
    );
};

FormGroup.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};