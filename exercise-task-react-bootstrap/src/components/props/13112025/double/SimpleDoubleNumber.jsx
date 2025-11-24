import React, { useState, useRef } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

function SimpleDoubleNumber() {

    const [number, setNumber] = useState(1);
    const inputRef = useRef();

    const divStyle = {
        padding: "20px",
        textAlign: "center",
        borderRadius: "16px",
        padding: "24px auto",
        maxWidth: "200px",
    }

    const pStyle = {
        marginTop: "100px",
        padding: "10px 2px",
        fontSize: "18px",
        borderRadius: "8px",
        cursor: "pointer",
        backgroundColor: "green",
        color: "white",
        border: "none",
    }

    function handleClick() {
        setNumber(Number(inputRef.current.textContent) * 2)
    }


    return (
        <div className="container" style={divStyle}>
            <p ref={inputRef} style={pStyle}>{number}</p>
            <button onClick={handleClick} className="btn btn-primary">Double Number</button>
        </div>
    );
}

export default SimpleDoubleNumber;