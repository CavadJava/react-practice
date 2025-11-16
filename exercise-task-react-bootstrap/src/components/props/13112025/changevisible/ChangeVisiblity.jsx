import React, { useState } from "react";


function ChangeVisiblity() {

    const [isVisible,setIsVisible] = useState(false);

    const divStyle = {
        padding: "20px",
        textAlign: "center",
        borderRadius: "16px",
        margin: "24px auto",
        maxWidth: "280px",
    };

    const buttonStyle = {
        padding: "10px 20px",
        fontSize: "16px",
        borderRadius: "8px",
        cursor: "pointer",
        backgroundColor: "green",
        color: "white",
        border: "none",
    };

    return (
        <div className="container">
            <div style={divStyle}>
                <h1 style={{
                    display: isVisible ? "none" : "block",
                    color: isVisible ? "red" : "blue"
                    }}>Change Visiblity</h1>
                <button style={buttonStyle} onClick={()=>setIsVisible(prev=>!prev)}>
                    Toggle text color
                </button>
            </div>
        </div>
    );
}

export default ChangeVisiblity;