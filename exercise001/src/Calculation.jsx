import React from "react";

function Calculation(){

    function calc(){
        let monthVar = document.getElementById("month");
        let interestVar = document.getElementById("interest");
        const result = (monthVar.value || 1) * interestVar.value || 1;
        document.querySelector("#result").textContent = result;
    }

    return (
        <>
            <div>
                <label htmlFor="month">Month</label>
                <input type="number" id="month" defaultValue={0}/>
                <br/>
                <label htmlFor="interest">Interest</label>
                <input type="number" id="interest" defaultValue={0}/>
                <button onClick={calc}>Calculate</button>
            </div>
            <div className="result" id="result"></div>
        </>
    );
}

export default Calculation