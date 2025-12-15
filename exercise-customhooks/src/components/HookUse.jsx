
import React from 'react';
import { useState } from 'react';
import { useBoolean } from '../hooks/useBoolean';

const HookUse = () => {

    const { open, setToggle, setOpenTrue, setOpenFalse } = useBoolean(false);
  
  
    return (
      <div>
        <h3>No Hook Component</h3>
        <p>Open State: {open}</p>
        <button onClick={setToggle}>Toggle</button>
        <button onClick={setOpenTrue}>Open</button>
        <button onClick={setOpenFalse}>Close</button>
      </div>
    )

};

export default HookUse;