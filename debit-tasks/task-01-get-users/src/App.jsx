import { useState } from 'react'
import getUsers from './api';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ToastContainer, toast } from 'react-toastify';

function App() {
  const [usersData, setUsersData] = useState([]);

  if(usersData.length === 0){
    getUsers().then(data => setUsersData(data.users)).catch(error => {
      console.error(error);
      toast.error("Error fetching users data.");
    });
  }
  
  const handleRoleStyle = (role) => {
    switch(role){
      case 'admin':
        return {color: 'blue', fontWeight: 'bold'};
      case 'moderator':
        return {color: 'red', fontWeight: 'bold'};
      case 'user':
        return {color: 'green', fontWeight: 'bold'};
      default:
        return {color: 'black'};
    } 
  }

  return (
    <>
      <div className='container-fluid text-center d-flex justify-content-center'>
        <table className='table table-striped table-hover'>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">First Name</th>
              <th scope="col">Last Name</th>
              <th scope="col">Email</th>
              <th scope="col">Phone</th>
              <th scope="col">Age</th>
              <th scope="col">Role</th>
              <th scope="col">Address</th>
              <th scope="col">Department</th>
              <th scope="col">CardNumber</th>
            </tr>
          </thead>
          <tbody>
            {
              usersData.length>0 ? usersData.map((user,index)=>{
                return (
                  <tr key={user.id}>
                    <th scope="row">{index + 1}</th>
                    <td>{user.firstName}</td>
                    <td>{user.lastName}</td>
                    <td>{user.email}</td>
                    <td>{user.phone}</td>
                    <td>{user.age}</td>
                    <td style={handleRoleStyle(user.role)}>{user.role}</td>
                    <td>{user.address.address}</td>
                    <td>{user.company.department}</td>
                    <td>{user.bank.cardNumber}</td>
                  </tr>
                )
              }) : <tr><td colSpan="10">No data available </td></tr>
            }
          </tbody>
        </table>
      </div>
      <ToastContainer />
    </>
  )
}

export default App
