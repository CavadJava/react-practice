import {useState} from "react";

function PasswordStrongChecker(){
    const [password,setPassword] = useState("")
    const [selectPasswordType,setSelectPasswordType] = useState("")
    const [isCorrect,setIsCorrect] = useState(false)

    const passwordType = [
        {"type":'weak',"length":5},
        {"type":'medium',"length":10},
        {"type":'strong',"length":15},
    ]
    function handler(event) {
        let inputValue = event.target.value;
        if (inputValue.length < 5) {
            setSelectPasswordType(passwordType[0].type)
            setIsCorrect(true)
        } else if (inputValue.length >= 5 && inputValue.length < 10) {
            setSelectPasswordType(passwordType[1].type)
            setIsCorrect(true)
        } else if (inputValue.length >= 10) {
            setSelectPasswordType(passwordType[2].type)
            setIsCorrect(true)
        }
        setPassword(inputValue)
    }

    return(
        <>
            <div className="container" style={{backgroundColor: "#0DCBF0",textAlign:"center",marginBottom:20,marginTop:20}}>
                <form>
                    <p>Password checking</p>
                    <p style={{display: isCorrect ? "block" : "none"}}>Show password:{password}</p>
                    <p style={{display: isCorrect ? "block" : "none"}}>Selected: <span
                        style={{color: selectPasswordType =="weak" ? "red" :  selectPasswordType =="strong" ? "green" :  "yellow"}}>{selectPasswordType}</span></p>
                    <input type="text" value={password}
                            style={{border:"none",marginBottom:20}}
                           placeholder="Password:"
                       onChange={(e)=> {
                           handler(e)
                        }
                       }
                    />
                </form>
            </div>
        </>
    )

}

export default PasswordStrongChecker;