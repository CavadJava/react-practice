import React, { useState } from "react";


function Randomgenerator() {

    const [randomColor, setRandomColor] = useState("#000000");

    function generate() {
        let hexNumber = Math.floor(Math.random()*16777215).toString(16);
        let result = "#"+hexNumber;
        setRandomColor(result);
    };
    const h1Style = {
        width: "200px",
        height: "200px",
        backgroundColor: randomColor,
        borderRadius: "10px",
        textAlign: "center",
        color: "white",
    }
    const buttonStyle = {
        borderRadius: "10px",
        padding: "10px 20px",
        backgroundColor: "green",
        color: "white",
        border: "none",
    }
    const randomColrDiv = {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
    }
    const arraysBorderType = [{id: 1,name: "Generate Random Color", borderRadius: "10px",func:{generate}}]

    return (
        <>
        {
            arraysBorderType.map((item) => (
                <div key={item.id} style={randomColrDiv}>
                    <h1 style={{...h1Style, borderRadius: item.borderRadius}}></h1>
                    <button style={buttonStyle} key={item.id} onClick={()=>{
                        item.func.generate();
                    }}>{item.name}</button>
                </div>
            ))
        }
        </>
    );
}


export default Randomgenerator;