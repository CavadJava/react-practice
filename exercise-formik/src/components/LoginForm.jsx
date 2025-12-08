import React, { useEffect } from 'react';
import { useFormik } from 'formik';

const LoginForm = () => {
    const [data, setData] = React.useState([]);
    const formik = useFormik({
        initialValues: {
            email: '',
            password: ''
        },
        onSubmit: values => {
            console.log('Form data', values);
            setData([...data, values]);
            window.localStorage.setItem('userData', JSON.stringify([...data, values]));
            alert(JSON.stringify(values, null, 2));
        }
    });
    useEffect(() =>{
        console.log("Component mounted");
        const storeData = JSON.parse(window.localStorage.getItem('userData'));
        if(storeData){
            setData(storeData);
        }
    },[])

    const handleRemoveAll = () => {
        window.localStorage.removeItem('userData');
        setData([]);
    }
    
    return (
        <div className='container'>
            <form onSubmit={formik.handleSubmit}>
                <label htmlFor="email">Email Address</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    onChange={formik.handleChange}
                    value={formik.values.email}
                />
                
                <label htmlFor="password">Password</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    onChange={formik.handleChange}
                    value={formik.values.password}
                />
                
                <button type="submit">Submit</button>
                <button type="button" onClick={handleRemoveAll}>Remove All</button>
            </form>
            <div className='cards'>
                {data.map((item, index) => (
                    <div className='card' key={index}>
                        <p><strong>Email:</strong> {item.email}</p>
                        <p><strong>Password:</strong> {item.password}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
export default LoginForm;