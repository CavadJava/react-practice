import React from "react";
function Product(props){

    return (
        <>
            <h1>{props.name}</h1>
            <p>{props.age}</p>
            <p>{props.isWorking ? "Working" : "Not Working"}</p>
            <p>{props.list}</p>
            <p>{props.myPerson.name} - {props.myPerson.age}</p>
            <button onClick={props.sayUserAlert}>Say User Alert</button>
        </>
    );


}
export default Product