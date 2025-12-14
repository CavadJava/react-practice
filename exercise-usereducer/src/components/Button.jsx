import { use } from "react";
import styles from "./Button.module.css";
import PropTypes from 'prop-types';

export const Button = ({size = "medium", variant = "primary", disabled = false, showArrow = false, children, onBtnClick}) => {
// export const Button = ({size, variant, disabled, showArrow, children}) => {

    // const componentId = useId();

    // console.log("Button componentId:", componentId);

    // const [size, variant, disabled, showArrow] = propTypes;

    // const sizeClassName = styles[size] || '';

    const variantClassName = styles[variant] || '';
    const arrowNext = showArrow ? ' -> ' : '';

    return (
        <button className={`${styles.btn} ${sizeClassName} ${variantClassName}`} disabled={disabled} onClick={onBtnClick}>
            {children} {arrowNext}
        </button>
    )
}
Button.propTypes = {
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'info', 'light', 'dark']),
    disabled: PropTypes.bool,
    showArrow: PropTypes.bool,
    children: PropTypes.node.isRequired,
    onBtnClick: PropTypes.func
}

// Button.defaultProps = {
//     size: 'medium',
//     variant: 'primary',
//     disabled: false,
//     showArrow: false
// }