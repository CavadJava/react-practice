import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

function HideItemOnClick() {

    const [list,setList] = useState([
        {
            id: "1",
            name: "Button 1",
            hidden: false
        }
    ]);
    function handleClick(itemId){
        setList(list.filter((item) => {
            return (item.id == itemId) ? item.hidden = true : item.hidden = false;
        }));
    }


    return (
        <div className="container d-flex flex-wrap justify-content-center">
            <button
                onClick={
                    () => {
                        return handleClick("1");
                    } 
                }
                style={{display: list[0].hidden ? "none" : "block"}}
                
                className="btn btn-primary m-2"
            >
                {list[0].name}
                </button>

        </div>
    );
}

export default HideItemOnClick;