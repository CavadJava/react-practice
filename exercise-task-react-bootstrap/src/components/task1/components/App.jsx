import React from "react";
import GreetingComponent from "./GreetingComponent.jsx";

function App(){
    const myPersonal = {
        id:"1",
        name: "Javad",
        job: "Developer"
    };
    return (
        <GreetingComponent key={myPersonal.id} personal={myPersonal}/>
    );
}
export default App;