import React, { useState, useRef } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

function AdvancedDoubleNumber() {

    const [number, setNumber] = useState(1);
    const inputRef = useRef();
    const [stopDouble, setStopDouble] = useState(false);
    const [doubleNumberList, setDoubleNumberList] = useState([]);
    const [isFullDoubleNumberList, setIsFullDoubleNumberList] = useState(false);

    const divStyle = {
        padding: "20px",
        textAlign: "center",
        borderRadius: "16px",
        padding: "24px auto",
        maxWidth: "230px",
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
    const resultStyle = {
        padding: "4px 2px",
        fontSize: "18px",
        borderRadius: "20px",
        cursor: "pointer",
        backgroundColor: "purple",
        color: "white",
        border: "none",
    }

    function handleClick() {
        if(stopDouble){
            return;
        }

        if(isFullDoubleNumberList){
            return
        }else{
            setIsFullDoubleNumberList(false);
            setNumber(Number(inputRef.current.textContent) * 2)
        }
    }


    return (
        <div className="container" style={divStyle}>
            <p ref={inputRef} style={pStyle}>{number}</p>
            <button onClick={handleClick} className="btn btn-primary">Double Number</button>
            <br></br>

            <button className="btn btn-primary"  onClick={()=>{
                if(doubleNumberList.length>=3){
                    alert("Double Number List is full");
                    setIsFullDoubleNumberList(true);
                }else{
                    setDoubleNumberList([...doubleNumberList, number]);
                }
            }}>Add Double Number</button>
            <p></p>

            <button className="btn btn-danger"  onClick={()=>{
                setStopDouble(true);
            }}>Stop</button>
            <button className="btn btn-warning"  onClick={()=>{
                setStopDouble(false);
            }}>Continue</button>
            <button className="btn btn-success" onClick={()=>{
                setStopDouble(false);
                setNumber(1);
                inputRef.current.textContent = 1;
                if(isFullDoubleNumberList){
                    setIsFullDoubleNumberList(false);
                    setDoubleNumberList([]);
                }

            }}>Reset</button>
            <div className="row">
                <p style={pStyle}>Double Number List</p>
                {
                    doubleNumberList.map((item, index) => {
                        return <p style={resultStyle} key={index}>{item}</p>
                    })
                }
            </div>
        </div>
    );
}

export default AdvancedDoubleNumber;