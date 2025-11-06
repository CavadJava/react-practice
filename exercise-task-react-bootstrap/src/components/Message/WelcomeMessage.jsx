import styles from "./WelcomeMessage.module.css";
import PropTypes from "prop-types";

export const WelcomeMessage = (
    {name='Card List', showType='show', alignment='center'}) => {

    const showTypeClassName = styles[showType] || '';
    const alignmentClassName = styles[alignment] || '';

    return (
        <div className="container">
            <h1 className={`${showTypeClassName} ${alignmentClassName}`}>{name}</h1>
        </div>
    )
}
WelcomeMessage.prototype = {
    name: PropTypes.string.isRequired,
    showType: PropTypes.oneOf(['show', 'hide']),
    alignment: PropTypes.oneOf(['left', 'center', 'right']),
}