import React, {Fragment} from "react";
import UserProfile from "./UserProfile.jsx";

function App(){
    const users = [
        {
            name: "Ibrahim",
            age: 27
        },
        {
            name: "Ali",
            age: 24
        },
        {
            name: "Elmir",
            age: 25
        }
    ];
    function location(){
        return {
            longitude: 300,
            latitude: 400
        };
    }
    return (
    <Fragment>
        {users.map((user,index) => (
            <UserProfile key={user.name+index} {...user} myLocation={location()}/>
        ))}
    </Fragment>
    );
}
export default App;