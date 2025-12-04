import {useState} from "react";

function FindHeroPower(){

    const [found,setFound] = useState(false)
    const [result,setResult] = useState("No result")

    const heroes = {
        'Iron Man': 'Tech',
        'Spider-Man': 'Spider Powers',
        'Captain America': 'Super Strength',
        'Black Panther': 'Super Speed'
    };

    function handler(e){
        let strings = Object.values(heroes).filter((x)=>x===e.target.value);
        if(strings.length>0){
            setResult("Result:"+" "+strings[0])
            setFound(true)
        }else{
            setResult("No result")
            setFound(false)
        }
    }

    return(
        <>
            <div className="container">
                <input type="text" id="heroInput" onChange={(e)=>handler(e)}/>
                <select id="selectId">
                    {
                         Object.entries(heroes).map((item,index)=>{
                             return <option key={index}>{item[0]}</option>
                         })
                    }
                </select>
                <p className="result" style={{color: found ? "green" : "red"}}>{result}</p>
            </div>
        </>
    )
}
export default FindHeroPower;