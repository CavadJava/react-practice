import {useState} from "react";

function Emoji(){

    const [label,setLabel] = useState("😀");

    const emojis = [
        {id:"1",value:" Face with Tears of Joy 😀"},
        {id:"2",value:" Rolling on the Floor Laughing 🤣"},
        {id:"3",value:" Smiling Face with Smiling Eyes 😊"},
        {id:"4",value:" Slightly Smiling Face 🙂"},
    ]

    return(
        <>
            <div className="container" style={{backgroundColor: "#0DCBF0",textAlign:"center",marginBottom:20,marginTop:20,color:"purple"}}>
                <h1>Emoji: {label}</h1>
                <select id="comp" onChange={(e)=>{
                    setLabel(e.target.value);
                    console.log(label)
                }}>
                    {
                        emojis.map((iu)=>{
                            return     <option key={iu.id}>{iu.value}</option>
                        })
                    }
                </select>
            </div>
        </>
    )
}
export default Emoji