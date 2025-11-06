import React from "react"

function Fullname() {

    function showFun(){
        const name = document.getElementById("name").value;
        const surname = document.getElementById("surname").value;
        document.getElementById("result").textContent = name + " " + surname;
    }

    return (
        <>
        <input type="text" id="name" placeholder="First Name" />
        <input type="text" id="surname" placeholder="Last Name" />
        <button onClick={showFun}>Show FullName</button>
        <div className="result" id="result"></div>
        </>
    )
}
export default Fullname