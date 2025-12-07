import { useRef, useState } from "react";

function StateManagement(){

    const [cards,setCards] = useState([])
    const [card,setCard] = useState({})

    const fullNameref = useRef("")
    const nickNameref = useRef("")
    const ageRef = useRef("")

    const addCardHandle = (e)=>{
        card.fullname = fullNameref.current.value;
        card.nickname = nickNameref.current.value;
        card.age = ageRef.current.value;
        console.log(card)
        setCards([...cards,card])

    }

    return (
        <>
            <div className="container">
                <input type="text" placeholder="FullName" ref={fullNameref}/><p/>
                <input type="text" placeholder="NickName" ref={nickNameref}/><p/>
                <input type="number" ref={ageRef}/><p/>
                <div className="groupbutton">
                    <button onClick={(e)=>addCardHandle(e)}>Add to Card</button>
                    <button>RemoveAll</button>
                </div>
            </div>
        </>
    )

}
function CardItem(){

    return(
        <>
            <div className="carditem">
                <p>FullName: </p>
                <p>NickName: </p>
                <p>Age: </p>
                <div className="carditem-groupbutton">
                    <button>Edit</button>
                    <button>Remove</button>
                </div>
            </div>
        </>
    )
}


export default StateManagement;