import {useRef, useState} from "react";

function NameFormatter(){

    const [formatter,setFormatter] = useState("");
    const [unformatter,setUnFormatter] = useState("");
    const inputRef = useRef("")

    function formatHandler(){
        setFormatter(inputRef.current.value.toUpperCase());
        console.log(inputRef.current.value)
    }
    function unformatHandler(){
        setUnFormatter(inputRef.current.value.toLowerCase());
    }

    return(
        <>
            <div className="container">
                <input type="text"  ref={inputRef} placeholder="Name:"
                       onChange={()=>{
                           formatHandler();
                       }} />
                <p>{formatter}</p>
                <p>{unformatter}</p>
                <button onClick={()=>{unformatHandler()}}>Change Content</button>
            </div>
        </>
    )
}

export default NameFormatter;