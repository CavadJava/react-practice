
import React from 'react';
import PropTypes from "prop-types";

function SecondWelcomeMessage({message='Welcome to our website'}) {
    return (
        <div className="container">
            <h1 className="text-center">{message}</h1>
        </div>
    );
}
SecondWelcomeMessage.prototype = {
    message: PropTypes.string.isRequired
}

export default SecondWelcomeMessage;