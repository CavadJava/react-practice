
import { useState } from 'react';
import React from 'react';


const NoHook = () => {

    const [open, setOpen] = useState(false);

    const setToggle = () => setOpen(!open); 

    const setOpenTrue = () => setOpen(true);

    const setOpenFalse = () => setOpen(false);
  
  
    return <div>
      <h3>No Hook Component</h3>
      <p>Open State: {open.toString()}</p>
      <button onClick={setToggle}>Toggle</button>
      <button onClick={setOpenTrue}>Open</button>
      <button onClick={setOpenFalse}>Close</button>
    </div>

};
export default NoHook;