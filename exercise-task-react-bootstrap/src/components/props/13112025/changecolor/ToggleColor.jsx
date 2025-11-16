import React, { useState } from "react";

function ToggleColor() {

    const [isRed, setIsRed] = useState(false);

    const divStyle = {
        backgroundColor: isRed ? "red" : "blue",
        color: isRed ? "black" : "white",
        padding : "20px",
        textAlign : "center",
        borderRadius : "16px",
        margin: "24px auto",
        maxWidth: "280px",
        transition: "background-color 0.3s ease"
    }
    const buttonStyle = {
        padding: "10px 20px",
        fontSize: "16px",
        borderRadius: "8px",
        cursor: "pointer"
    } 

    return (
        <div className="container">
            <div style={divStyle}>
                <h1>Change Color:{setIsRed ? "red" : "white"}</h1>
                <button style={buttonStyle}
                onClick={()=>{
                    setIsRed(pref=>!pref)
                }}
                >
                    Toggle background color
                </button>
            </div>
        </div>
    )
}
export default ToggleColor;