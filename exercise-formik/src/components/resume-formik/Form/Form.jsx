import { useState } from "react"
import { isEmailValid, isPasswordStrong } from "../../constant/regex"




export const FormContainer = () => {

    const [fullname, setFullname] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")


    console.log("fullname",fullname);
    
    const handleSubmit = () => {

        if(!isEmailValid(email)){
            alert("Invalid email format")
            return
        }

        if(!isPasswordStrong(password)){
            alert("Password is not strong enough")
            return
        }


        const form = {
            full_name: fullname,
            email: email,
            password: password,
        }



        console.log("form submitted", form);
    }


    const isEmpty = fullname.trim() === "" || password.trim() === ""


  return (
    <div style={{border:"2px solid white",padding:40}}>
      {/* Form will go here */}

      <div>
        <input 
          type="text" 
          placeholder="Fullname" 
          value={fullname}
          onChange={(e) => setFullname(e.target.value)}
        />

        <br/>

       <input 
          type="text" 
          placeholder="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <br/>

        <input 
          type="text" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {/* {!fullname.trim() && <p style={{color:"red"}}>Fullname is required</p>}
        <p>Total: {fullname.length}</p> */}

        {isEmpty && <p style={{color:"red"}}>All fields are required</p>}
      </div>

      <button onClick={handleSubmit} disabled={isEmpty}>
        Submit
      </button>
    </div>
  )
}