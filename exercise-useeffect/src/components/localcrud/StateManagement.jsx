import { useId, useRef, useState } from "react";
import PropTypes from "prop-types";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from "./MeButton.module.css";

function StateManagement(){

    const [cards,setCards] = useState([])
    const [card,setCard] = useState({})

    const fullNameref = useRef("")
    const nickNameref = useRef("")
    const ageRef = useRef("")

    const addCardHandle = (e)=>{
        const newCard = {
            id:  Date.now() + Math.random(),
            fullname:  fullNameref.current.value,
            nickname:  nickNameref.current.value,
            age: ageRef.current.value
        };
        console.log(newCard)
        setCards([...cards,newCard])

    }

    return (
        <>
            <div className="container">
                <section>
                    <input type="text" className="form-data" placeholder="FullName" ref={fullNameref}/><p/>
                    <input type="text" placeholder="NickName" ref={nickNameref}/><p/>
                    <input type="number" ref={ageRef}/><p/>
                    <div className="groupbutton">
                        <button className="btn btn-primary" onClick={(e)=>addCardHandle(e)}>Add to Card</button>
                        <button>RemoveAll</button>
                    </div>
                </section>
                <div className="card w-100 d-flex justify-content-between flex-row gap-5 .border-0">
                    {
                        cards.map((card)=>{
                            return (
                                 <CardItem key={card.id} {...card}/>
                            )
                        })
                    }
                </div>
            </div>
        </>
    )

}
function CardItem({id, fullname, nickname, age}){

    const hi = () => {
        alert("hi");
    }

    const hello = () => {
        alert("hello");
    }

    return(
        <>
            <div className="card-body" style={{backgroundColor: "gray"}}>
                <p>FullName: {fullname}</p>
                <p>NickName: {nickname}</p>
                <p>Age: {age}</p>
                <div className="carditem-groupbutton">
                    <MeButton _name="Edit" _colorType="yellow" hasCallbck="false" callbck={hello} />
                    <MeButton _name="Remove All" _colorType="yellow" hasCallbck="true" callbck={hi} />
                </div>
            </div>
        </>
    )
}

export const MeButton = ({_name, _colorType, defaultColor="btn", hasCallbck="false", callbck})=>{


    const colorClassName = styles[_colorType] || '';
    const defaultColorValue = defaultColor;
    

    return (
        <button className={`${defaultColorValue} ${colorClassName}`} onClick={()=>{
            if(hasCallbck=="true") {
                return callbck()
            }

        }}>{_name}</button>
    )
}
MeButton.prototype = {
    name : PropTypes.string.isRequired,
    colorType: PropTypes.oneOf(['blue', 'red', 'yellow']),
    defaultColor: PropTypes.string
}


export default StateManagement;