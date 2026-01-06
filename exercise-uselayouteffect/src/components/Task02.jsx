import React, { useLayoutEffect, useState } from 'react';

const PasswordCheck = () => {
  const [password, setPassword] = useState('');
  const [isValid, setIsValid] = useState(null);

  useLayoutEffect(() => {
    if (password.length === 0) {
      setIsValid(null);
    } else if (password.length >= 8) {
      setIsValid(true);
    } else {
      setIsValid(false);
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
      {isValid === true && <p style={{ color: 'green' }}>Password is valid</p>}
      {isValid === false && <p style={{ color: 'red' }}>Password is too short</p>}
    </div>
  );
}
export default PasswordCheck;