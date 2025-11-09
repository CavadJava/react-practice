import React from "react";

function UserProfile({name, age, myLocation}){
    return (
        <div className="container">
            <div className="card">
                <div className="card-body d-flex justify-content-between flex-row gap-2 mb-3">
                    <h5 className="card-title">Mentor</h5>
                    <p className="card-text">Name:{name}</p>
                    <p className="card-text">Age:{age}</p>
                    <p className="card-text">Longitude:{myLocation.longitude}</p>
                    <p className="card-text">Longitude:{myLocation.latitude}</p>
                </div>
            </div>
        </div>
    );
}

export default UserProfile