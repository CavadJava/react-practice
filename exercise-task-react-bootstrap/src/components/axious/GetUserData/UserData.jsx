import getUsers from "../AxiosUtil.jsx";
import {useEffect, useState} from "react";

function UserData() {

    const [data, setData] = useState([]);

    const result = async () => {
        try {
            const data = await getUsers();
            console.log("UserData:" + data)
            setData(data?.users)
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        result()
        console.log("test-1")
    }, []);

    function getRoleColor(role){
        return role === "admin" ? "blue" :
            role === "moderator" ? "red" :
                "green"
    }
    const colStyle = {fontWeight:700,textAlign:"center"}
    const rowStyle = {textAlign:"center"}

    return (
        <>
            <div className="container">
                <table className="table table-responsive table-group-divider table-bordered w-100 table-striped-columns">
                    <thead>
                    <tr className="w-100">
                        <td style={colStyle}>ID</td>
                        <td style={colStyle}>FirstName</td>
                        <td style={colStyle}>Lastname</td>
                        <td style={colStyle}>Email</td>
                        <td style={colStyle}>Phone</td>
                        <td style={colStyle}>Age</td>
                        <td style={colStyle}>Role</td>
                        <td style={colStyle}>Address</td>
                        <td style={colStyle}>Department</td>
                        <td style={colStyle}>CardNumber</td>
                    </tr>
                    </thead>
                    <tbody>
                    {
                        data?.map((item, index) => (
                            <tr key={index}>
                                <td style={rowStyle}>{item.id}</td>
                                <td style={rowStyle}>{item.firstName}</td>
                                <td style={rowStyle}>{item.lastName}</td>
                                <td style={rowStyle}>{item.email}</td>
                                <td style={rowStyle}>{item.phone}</td>
                                <td style={rowStyle}>{item.age}</td>
                                <td style={{
                                    color:getRoleColor(item.role),
                                    fontWeight: 700,
                                    textAlign: "center"

                                }}>{item.role}</td>
                                <td style={rowStyle}>{item.address.address}</td>
                                <td style={rowStyle}>{item.company.department}</td>
                                <td style={rowStyle}>{item.bank.cardNumber}</td>
                            </tr>
                        ))
                    }
                    </tbody>
                </table>
            </div>
        </>
    )
}

export default UserData;