import React, { useState, useEffect } from 'react';

const SimpleForm = () => {
    // 1. Giriş sahələri üçün state
    const [values, setValues] = useState({
        email: '',
        password: ''
    });

    // İstifadəçi məlumatlarını saxlamaq üçün state (localStorage üçün)
    const [data, setData] = useState([]);

    // 2. Giriş sahələri dəyişdikdə state-i yeniləyir
    const handleChange = (e) => {
        setValues({
            ...values,
            [e.target.name]: e.target.value
        });
    };
    
    // localStorage-dan mövcud datanı yükləmək üçün useEffect
    useEffect(() => {
        const storedData = localStorage.getItem('userData');
        if (storedData) {
            setData(JSON.parse(storedData));
        }
    }, []);

    // 3. Formanın göndərilməsini idarə edir
    const handleSubmit = (e) => {
        // Formanın defolt yenilənməsinin qarşısını alır
        e.preventDefault(); 
        
        console.log('Form data', values);
        
        // Yeni datanı köhnə dataya əlavə edir və state-i yeniləyir
        const newData = [...data, values];
        setData(newData);
        
        // localStorage-a yazır
        window.localStorage.setItem('userData', JSON.stringify(newData));
        
        // Göndərilən dəyərləri göstərir
        alert('Göndərilən Dəyərlər:\n' + JSON.stringify(values, null, 2));
        
        // Formanı təmizləmək
        setValues({
            email: '',
            password: ''
        });
    }

    // Əlavə: Bütün datanı silmək üçün funksiya
    const handleRemoveAll = () => {
        window.localStorage.removeItem('userData');
        setData([]);
        alert('Bütün Məlumatlar Silindi!');
    };

    return (
        <div className='container'>
            <form onSubmit={handleSubmit}>
                <label htmlFor="email">Email Address</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    value={values.email} // State ilə əlaqələndiririk
                    onChange={handleChange} // Dəyişikliyi idarə edirik
                />
                
                <label htmlFor="password">Password</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    value={values.password} // State ilə əlaqələndiririk
                    onChange={handleChange} // Dəyişikliyi idarə edirik
                />
                
                <button type="submit">Submit</button>
                <button type="button" onClick={handleRemoveAll}>Remove All</button>
            </form>
            
            {/* Saxlanmış datanı göstərmək (əlavə) */}
            <h3>💾 Saxlanmış Data ({data.length})</h3>
            <ul>
                {data.map((item, index) => (
                    <li key={index}>
                        **Email:** {item.email}, **Password:** ***{item.password.length > 0 ? 'Məxfi' : 'Yoxdur'}***
                    </li>
                ))}
            </ul>
        </div>
    );
}
export default SimpleForm;