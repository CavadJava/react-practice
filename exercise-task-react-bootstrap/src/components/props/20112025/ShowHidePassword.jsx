import React, {useState} from "react";

function ShowHidePassword(){

    const [visible,setVisible] = useState(true)

    function handler() {
        if (visible) {
            setVisible(false)
        } else {
            setVisible(true)
        }
    }
    return(
        <>
            <div className="container">
                <input type={visible ? "text" : "password" } id="password" />
                <button onClick={()=>{handler()}}>ToggleButton</button>
            </div>
        </>
    )
}
export default ShowHidePassword;