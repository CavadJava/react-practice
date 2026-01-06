/*
useEffect istifadə etsən:

İstifadəçi "38" yazır.
Brauzer inputu ağ rəngdə render edir.
İstifadəçi ağ rəngi görür.
useEffect işə düşür, rəngi qırmızı edir.
Brauzer yenidən rəngləyir. Nəticə: Göz çox sürətli bir "ağdan qırmızıya keçid" (titrəmə) hiss edə bilər.
*/
import React, { useState, useLayoutEffect } from 'react';

const TemperatureCheck = () => {
  const [temperature, setTemperature] = useState('');
  const [bgColor, setBgColor] = useState('white');

  useLayoutEffect(() => {
    const tempValue = parseFloat(temperature);
    if (!isNaN(tempValue)) {
      if (tempValue > 37.5) {
        setBgColor('red');
      } else {
        setBgColor('green');
      }
    } else {
      setBgColor('white');
    }
  }, [temperature]);

  return (
    <div style={{ backgroundColor: bgColor, padding: '20px' }}>
      <input
        type="number"
        value={temperature}
        onChange={(e) => setTemperature(e.target.value)}
        placeholder="Enter your temperature"
      />
    </div>
  );
};

export default TemperatureCheck;
