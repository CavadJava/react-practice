import React, {useState} from "react";

function ToggleTask() {

    const [active, setActive] = useState(false);

    function handleToggle(){
        return active ? setActive(false) : setActive(true);
    }
    return (
        <div className="container">
            <h1>Toggle Task1 ? React or Javascript </h1>
            <button onClick={handleToggle}
             style={active ? {backgroundColor: "blue", color: "white"} : {backgroundColor: "white", color: "blue"}}>Toggle Button</button>
            <span>{active ? "React" : "Javascript"}</span>
        </div>
    );
}

export default ToggleTask;