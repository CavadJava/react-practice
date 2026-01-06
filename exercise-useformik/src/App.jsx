import { useState } from 'react'
import './App.css'
import { useFormik } from 'formik';
import { useEffect } from 'react';

function App() {
  const [data,setData] = useState([]);

  const {values,handleSubmit,handleChange,handleReset} = useFormik({
    initialValues: {
      username: '',
      fullname: '',
      age: ''
    },
    onSubmit: values => {
      console.log('Form data', values,JSON.stringify(values));
      const newData = [...data,values];
      setData(newData);
      localStorage.setItem('userData',JSON.stringify(newData));
    },
    onReset: () => {
      console.log('Form reset');
    }
  });

  console.log('data:',data);

  useEffect(() => {
    const storedData = localStorage.getItem('userData');
    if(storedData) {
      setData(JSON.parse(storedData));
    }
  }, []);

  return (
    <>
    <div className='container'>
      <h1>Add user</h1>
      <div>
        <input type="text" placeholder='UserName' name="username" value={values.username} onChange={handleChange}/>
        <input type="text" placeholder='FullName' name="fullname" value={values.fullname} onChange={handleChange}/>
        <input type="number" placeholder='Age' name="age" value={values.age} onChange={handleChange}/>
        <button type='submit' onClick={handleSubmit}>Add User</button> 
        <button type='reset' onClick={handleReset}>Remove All</button>
        {
          data.map((user,index) => (
            <div key={index} className='user-card'>
              <p><strong>UserName:</strong> {user.username}</p>
              <p><strong>FullName:</strong> {user.fullname}</p>
              <p><strong>Age:</strong> {user.age}</p>
            </div>
          ))
        }
      </div>
    </div>
    </>
  )
}

export default App
