import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

function HideItemsOnClick() {

    const [list,setList] = useState([
        {
            id: "1",
            name: "Button 1",
            hidden: false
        },
        {
            id: "2",
            name: "Button 2",
            hidden: false
        }
    ]);
    function handleClick(itemId){
        list.forEach((item) => {
            if(item.id == itemId){
                item.hidden = true;
            }
        });
        setList([...list]);
    }


    return (
        <div className="container d-flex flex-wrap justify-content-center">
            {list.map((item,index)=>(
                <button

                    key={"-button-"+index}

                    onClick={
                        () => {
                            return handleClick(item.id);
                        } 
                    }
                    style={{display: item.hidden ? "none" : "block"}}

                    className="btn btn-primary m-2"
                >
                    {item.name}
                </button>
            ))}
        </div>
    );
}

export default HideItemsOnClick;