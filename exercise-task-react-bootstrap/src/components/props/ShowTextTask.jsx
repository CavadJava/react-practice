import { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

function ShowTextTask(){
    const [text, setText] = useState(false);

    return (

        <div class="container" 
            onMouseEnter={() => setText(true)}
            onMouseLeave={() => setText(false)}
            style={{backgroundColor: text ? "green" : ""}}
>
            <button onClick={() => text ? setText(false) : setText(true)} style={{fontSize: text ? "20px" : "10px"}}>Hover</button>
            <p>{text ? "Gorundu" : ""}</p>

        </div>
    )
}

export default ShowTextTask;