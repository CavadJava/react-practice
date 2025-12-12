import React from 'react';

function SimpleWithoutMemo() {
    const [count1, setCount1] = React.useState(0);
    const [count2, setCount2] = React.useState(0);

    const a = 3.14 + count1;
    const b = 42 + count2;

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