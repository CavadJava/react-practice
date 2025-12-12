import React from 'react';
import { useMemo } from 'react';

function SimpleWitMemo({num=0}) {
    const [count1, setCount1] = React.useState(0);
    const [count2, setCount2] = React.useState(0);

    // Hesablamalar coxdursa; 
    // Iki ve daha cox state props-dan asilidirsa onda istifade etmek olar;
    const a = useMemo(() => {
        let result = 3.14 + count1;
        return result;
    }, [count1]);

    const b =  useMemo(() => {
        let result = 42+ count2;
        return result;
    }, [count2]);

    return (
        <div>
            <h2>Simple useMemo Example</h2>
            <div>
                <p>Count 1: {count1}</p>
                <button onClick={() => setCount1(count1 + 1)}>Increment Count 1</button>
            </div>
            <div>
                <p>Count 2: {count2}</p>
                <button onClick={() => setCount2(count2 + 1)}>Increment Count 2</button>
            </div>
        </div>
    );
}

export default SimpleWithoutMemo;