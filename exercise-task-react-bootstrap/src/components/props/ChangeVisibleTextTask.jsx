import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

function ChangeVisibleTextTask(){
    const [visible, setVisible] = useState(false);

    return (
        <div class="container">
            <h1>Props Exercise 5</h1>
            <button className="btn btn-primary ms-3" onClick={() => setVisible(!visible)}>Change Text</button>
            <p className="ms-3" style={{display: visible ? "block" : "none", fontSize: visible ? "50px" : "10px"}}>Visible Text</p>
        </div>
    )
}
export default ChangeVisibleTextTask;