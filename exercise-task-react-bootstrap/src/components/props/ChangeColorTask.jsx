import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
function ChangeColorTask(){
    
    const [red, setRed] = useState(false);

    return (
        <div class="container" style={{backgroundColor: red ? "red" : "blue"}}>
            <h1>Props Exercise 4</h1>
            <button className="btn btn-primary ms-3" onClick={() => setRed(!red)}>Change Color</button>
        </div>
    )
}

export default ChangeColorTask;