import React from 'react';
import { useCallback } from 'react';
import { useMemo } from 'react';

function SimpleWitMemo(num=0) {
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

    // state deyisenleri ucun callback funksiyalari yaratmaq olar
    // state deyisdikce yeniden yaranmasin deye;
    // esas meqsed performansi artirmagdir
    // surretli funksiyalar ucun istifade etmek olar
    // misal ucun hesablama funksiyasi
    // num deyisenini de elave etdim ki, funksiyanin ozunde
    // sabit deyisen olsun
    // bele olan halda useCallback-in istifadesi daha menali olur
    // cunki count1 deyiseni deyismedikde funksiya yeniden yaranmayacaq
    // num deyiseninin deyismesi ise funksiyanin yeniden yaranmasina sebeb olacaq
    // amma count1-in deyismesi ile yeniden yaranmasin
    // bu da performans baximindan daha effektivdir
    // cunki funksiya her defe yeniden yaranmadiqda yadda saxlanilan resurslar israf olunmur
    
    const handleCount1Increment = useCallback(() => {
        let result = num * count1;
        return result;
    }, [count1,num]);
    const handleCount2Increment = useCallback(() => {
        setCount2(prevCount2 => prevCount2 + 1);
    }, []);

    return (
        <div>
            <h2>Simple useMemo Example</h2>
            <div>
                <p>Count 1: {count1}</p>
                <button onClick={handleCount1Increment}>Increment Count 1</button>
            </div>
            <div>
                <p>Count 2: {count2}</p>
                <button onClick={handleCount2Increment}>Increment Count 2</button>
            </div>
        </div>
    );
}

export default SimpleWithoutMemo;