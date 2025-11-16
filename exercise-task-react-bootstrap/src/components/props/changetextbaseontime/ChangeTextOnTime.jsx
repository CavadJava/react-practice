import React, {useState,useRef} from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

function ChangeTextOnTime() {

    const [text, setText] = useState("Good morning");
    const [time, setTime] = useState(new Date().getHours());
    const [datetime, setDatetime] = useState(new Date());

    
    const timeRef = useRef();

    const timeOfDay = [
        {
            id: "1",
            name: "Good morning",
            start: 0,
            end: 12
        },
        {
            id: "2",
            name: "Good afternoon",
            start: 12,
            end: 18
        },
        {
            id: "3",
            name: "Good evening",
            start: 18,
            end: 24
        }
    ]

    function showDay(){
        var timeValue = timeRef.current.value;
        if(timeRef.current.value === ""){
            return;
        }
        var timeOfDayArr  = timeValue.split(":");
        timeOfDay.forEach(item =>{
            if(item.start <= Math.abs(timeOfDayArr[0]) && item.end >= Math.abs(timeOfDayArr[0])){
                setText(item.name);
                setTime(timeRef.current.value);
            }   
        })
    }

    return (
        <div>
            <div className="container">
                <div className="row d-flex flex-column g-3 align-items-center">
                        <br/>
                        <hr/>
                        <div className="col-auto">
                            <label htmlFor="inputTime" className="col-form-label">Set Time - {datetime.toLocaleTimeString()}</label>
                        </div>
                        <div className="col-auto d-flex flex-column justify-content-between">
                            <input type="time" id="inputTime" ref={timeRef}
                            className="form-control" aria-describedby="timeHelpInline"/>
                            <button className="btn btn-primary"
                            type="button" onClick={(e)=>{showDay(e)}}>Change Text</button>
                        </div>
                        <div className="col-auto">
                            <p id="timeHelpInline" className="form-text">
                                {text} - {time}
                            </p>
                        </div>
                        <hr/>
                    </div>
                </div>
        </div>
    )
}
export default ChangeTextOnTime;