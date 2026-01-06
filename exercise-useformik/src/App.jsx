import { useState } from 'react'
import './App.css'
import { useFormik } from 'formik';

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
      localStorage.setItem('userData',JSON.stringify(newData));
      console.log()
    },
    onReset: () => {
      console.log('Form reset');
    }
  });

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
      </div>
    </div>
    </>
  )
}

export default App
