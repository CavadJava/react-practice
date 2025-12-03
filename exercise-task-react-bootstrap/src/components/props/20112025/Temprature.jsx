import React, {useRef, useState} from "react";

function Temprature() {

    const [inputValue, setInputValue] = useState();

    const inputRef = useRef();

    function handler(e) {
        if (e.target.value === "selected") {
            setInputValue("");
        }else if (e.target.value === "C") {
            setInputValue(((inputRef.current.value * 9 / 5) + 32)+" degree");
        } else {
            setInputValue(Math.floor((inputRef.current.value - 32) * 5 / 9)+" faranheight")
        }
        console.log(e.target.value)
    }

    return (
        <>
            <p>Temprature: {inputValue}</p>
            <input type="number" ref={inputRef}/>
            <select name="" id=""
                    onChange={(e) => handler(e)}>
                <option>selected</option>
                <option id="celcium" value="C">C</option>
                <option id="faranheight" value="F">F</option>
            </select>
        </>
    )
}

export default Temprature