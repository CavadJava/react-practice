import React from "react";

function GreetingComponent({ name, job }){
    return (
        <div className="container">
            <h1 className="text-center">
                Hello {name},
                I am {job}</h1>
        </div>
    );
}
export default GreetingComponent