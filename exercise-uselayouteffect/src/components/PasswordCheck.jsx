import React from "react";

const PasswordCheck = () => {

    const [password, setPassword] = React.useState('');
    const [color,setColor] = React.useState('');
    const [message,setMessage] = React.useState('');

    React.useLayoutEffect(() => {
        if(password.length === 0){
            setColor('');
            setMessage('');
        } else if(password.length >= 8){
            setColor('green');
            setMessage('Password is valid');
        } else {
            setColor('red');
            setMessage('Password is too short');
        }
    }, [password]);

    return (
        <div>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
            />
            {message && <p style={{ color: color }}>{message}</p>}
        </div>
    );
}
export default PasswordCheck;