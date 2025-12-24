
import React from 'react';
import { useState } from 'react';
import { useBoolean } from '../hooks/useBoolean';
import { useFetchData } from '../hooks/useFetchData';
import { useMemo } from 'react';

const HookUse2 = () => {

    const { open, setToggle, setOpenTrue, setOpenFalse } = useBoolean(false);
    // const fetchParams = useMemo(() => ({}), []);
    const { data, loading, error, setUrl} = useFetchData();
  

    return (
      <div>
        <h3>Hook Component</h3>
        {/* <p>Open State: {open ? "TRUE" : "FALSE"}</p> */}
        {/* <button onClick={setOpenTrue}>Open</button> */}
        {/* <button onClick={setOpenFalse}>Close</button> */}
        {/* {open && <p>The state is true!</p>} */}
        {loading ? <p>Loading...</p> : <p>{JSON.stringify(data)}</p>}
      </div>
    )

};

export default HookUse2;