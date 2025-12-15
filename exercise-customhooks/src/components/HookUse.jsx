
import React from 'react';
import { useState } from 'react';
import { useBoolean } from '../hooks/useBoolean';

const HookUse = () => {

    const { open, setToggle, setOpenTrue, setOpenFalse } = useBoolean(false);
  
  
    return (
      <div>
        <h3>Hook Component</h3>
        <p>Open State: {open ? "TRUE" : "FALSE"}</p>
        <button onClick={setOpenTrue}>Open</button>
        <button onClick={setOpenFalse}>Close</button>
        {open && <p>The state is true!</p>}
      </div>
    )

};

export default HookUse;