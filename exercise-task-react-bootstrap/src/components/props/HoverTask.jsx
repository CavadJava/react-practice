import { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

function HoverTask(){
    const [hover, setHover] = useState(false);

    function handleHover(){
        setHover(!hover);
    }

    return (
        <div>
            <h1>Props Exercise 3</h1>
            <button className="btn btn-primary ms-3" onMouseEnter={handleHover} onMouseLeave={handleHover} style={{backgroundColor: hover ? "green" : "blue"}}>Hover</button>
            <p  className="ms-3" style={{color: hover ? "red" : "blue"}}>{hover ? "Hovered" : ""}</p>
        </div>
    )
}
export default HoverTask;