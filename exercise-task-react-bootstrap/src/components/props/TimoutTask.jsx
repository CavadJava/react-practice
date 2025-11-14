import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from "react";
function TimeoutTask(){

    const [clicked,setClicked] = useState(false);



    return (
        <div className="container">

            <h1 style={{display: clicked ? "none" : "block"}}>Clicked</h1>
            <button className="btn btn-primary ms-3" disabled={clicked} onClick={(()=>{
                setTimeout(()=>{
                    setMouse(true);
                    setClicked(true);
                },3000)
            })}>Click</button>

        </div>
    )
}
export default TimeoutTask;