import React from 'react';
import { useMemo } from 'react';
import { useRef } from 'react';

function SimpleWithUseRef({num=0}) {

    const pi = useRef(3.14);
    const result = useMemo(() => {
        return pi.current + num;
    }, [num]);
    
    const answer = useMemo(() => {
        console.log('Calculating answer...');
        return 42 + num;
    }, [num]);
    return (
        <div>
            <h2>Simple useRef and useMemo Example</h2>
            <div>
                <h1>PI: {result}</h1>
                <h2>Answer: {answer}</h2>
            </div>
        </div>
    );
}

export default SimpleWithUseRef;