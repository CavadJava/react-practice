import React, { useState } from "react";

function ToggleTexts() {
    const [isText, setIsText] = useState("Hello");


    const divStyle = {
        padding: "20px",
        textAlign: "center",
        borderRadius: "16px",
        margin: "24px auto",
        maxWidth: "280px",
    }
    const buttonStyle = {
        backgroundColor: "red",
        color: "black",
        padding: "10px 20px",
        fontSize: "16px",
        borderRadius: "8px",
        cursor: "pointer",
    }


    return (
        <div className="container"
         style={divStyle}>
            <h1>{isText === "Hello" ? isText : "Goodbye"}</h1>
            <button style={buttonStyle} onClick={() => setIsText(prev => prev === "Hello" ? "Goodbye" : "Hello")}>
                Hello & Goodbye
            </button>
        </div>
    );
}

export default ToggleTexts;