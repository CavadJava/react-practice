import React from 'react';

function Task(){
    console.log("Task started");

    let firstClick = false;
    function handleClickMe(){
        firstClick = true;
        alert("Hello World");
        return true;
    }
    function showMore(){
        document.querySelector(".card-body").style.display = "block";
    }
    function reset(){
        document.querySelector(".card-body").style.display = "none";
    }

    return (
        <div className="container">
            <Button className="btn btn-primary" label="Click me"
                    disableBtn={firstClick}
                    onclick={handleClickMe}
            />
            <Button label="Show More" onclick={showMore}/>
            <Button label="Reset" onclick={reset}/>
            <div className="card-body" style={{display:"none"}}>
                <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
            </div>
        </div>

    );
}
function Button({label, onclick, disableBtn = false}){
    return (
        <>
        {
            <button onClick={onclick} disabled={disableBtn}>{label}</button>
        }
        </>
    );
}
export default Task;