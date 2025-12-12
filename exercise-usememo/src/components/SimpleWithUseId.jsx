import React from 'react';
import { useId } from 'react';
import { useRef } from 'react'; // useMemo silindi

function SimpleWithUseId({num=0}) {
    const [count, setCount] = React.useState(0);

    // Düzəliş 2: useRef indi düzgün istifadə üçün .current ilə əldə ediləcək
    // constant.js falinda sabit dəyər kimi saxlanıla biler ordan import edilə biler
    const piRef = useRef(3.14); 

    // Düzəliş 1: Hər element üçün unikal ID yaratmaq üçün müxtəlif useId() çağırışları
    const componentIdPrefix = useId();
    const buttonId = useId();
    // Yaxud: const resultId = useId();

    let result = piRef.current + count + num;
   
    return (
        <div>
            <h2>Simple useMemo Example</h2>
            <div>
                {/* Düzəliş 1: componentIdPrefix-dən istifadə edərək unikal sinif adı */}
                <p className={`${componentIdPrefix}-count`}>Count 1: {count}</p> 

                {/* Düzəliş 1: Unikal button ID */}
                <button id={buttonId} onClick={() => setCount(count + 1)}>Increment Count 1</button>
            </div>
            <div>
                {/* Düzəliş 2: useRef-in dəyərinə daxil olmaq üçün .current istifadəsi */}
                <h1 id={`${componentIdPrefix}-pi`}>PI: {piRef.current}</h1> 

                {/* Düzəliş 1: Unikal ID */}
                <h2 id={`${componentIdPrefix}-result`}>Result: {result}</h2>
            </div>
        </div>
    );
}

export default SimpleWithUseId;