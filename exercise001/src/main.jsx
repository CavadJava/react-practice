import React from 'react'
import { createRoot } from 'react-dom/client'

function Car(props) {
    return (
        <h2>The car is from {props.year}!</h2>
    );
}

createRoot(document.getElementById('root')).render(
    <Car year={1969} />
);