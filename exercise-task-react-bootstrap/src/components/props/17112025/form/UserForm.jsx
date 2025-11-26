import React, {useRef, useState} from "react";



function UserForm() {

    const [count, setCount] = useState(0);
    const [tableBody, setTableBody] = useState([]);
    const usernameRef = useRef();
    const fullnameRef = useRef();

    const divStyle = {
        margin: "20px auto",
        backgroundColor: "#CDEBFD",
        padding: "200px",
        borderRadius: "10px",
        maxWidth: "100"
    }

    const formStyle = {
        margin: "20px auto",
        backgroundColor: "#0DCBF0",
        padding: "10px",
        borderRadius: "10px",
        maxWidth: "300px",
    }

    function addUserToTableBody(){
        // Get values from refs
        const username = usernameRef.current?.value;
        const fullname = fullnameRef.current?.value;

        // Basic validation: Don't add if fields are empty
        if (!username || !fullname) {
            alert("Please enter both username and fullname.");
            return;
        }
        let data = {};
        data.itemId = count;
        data.username = username;
        data.fullname = fullname;
        setTableBody(prevTableBody=>[
            ...prevTableBody, data
        ]);
        setCount(count+1);
        usernameRef.current.value = '';
        fullnameRef.current.value = '';
    }

    function removeItem(itemId){
        setTableBody(tableBody.filter((itemm) => {
            return itemm.itemId != itemId;
        }));
    }


    return (
        <>
            <div className="container" style={divStyle}>
                <h1 className="text-center">User Form</h1>
                <form style={formStyle}>
                    <div className="mb-3">
                        <label htmlFor="name" className="form-label">Username</label>
                        <input ref={usernameRef} type="text" className="form-control" id="name" />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="fullname" className="form-label">Fullname</label>
                        <input ref={fullnameRef} type="text" className="form-control" id="fullname" />
                    </div>
                    <div style={{textAlign:"center"}}>
                        <button  className="btn btn-primary" onClick={(e)=>{
                            e.preventDefault();
                            addUserToTableBody(e);
                        }}>Add User</button>
                    </div>
                </form>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Fullname</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>

                    {
                        tableBody.map((item) => (
                            // 'item.count' now holds the correct unique key
                            <tr key={item.itemId}>
                                <td>{item.username}</td>
                                <td>{item.fullname}</td>
                                <td><button className="btn btn-danger" onClick={(e)=>{
                                    e.preventDefault();
                                    removeItem(item.itemId);
                                }}>Delete</button></td>
                            </tr>
                        ))
                    }
                    </tbody>
                </table>
            </div>
        </>
    );

}
export default UserForm;