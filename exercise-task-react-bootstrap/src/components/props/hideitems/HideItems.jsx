import React,{useState} from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function HideItems(){


    const [list,setList] = useState([
        {
            id: "1",
            type: "course",
            name: "English Lesson",
            hidden: false,
            icon: "bi bi-translate"
        },
        {
            id: "2",
            type: "course",
            name: "Music Lesson",
            hidden: false,
            icon: "bi bi-music-note-list"
        },
        {
            id: "3",
            type: "work-issue",
            name: "Mentoring",
            hidden: false,
            icon: "bi bi-cpu"
        },
        {
            id: "4",
            type: "work-issue",
            name: "problem-solving",
            hidden: false,
            icon: "bi bi-file-code-fill"
        },
        {
            id: "5",
            type: "work-issue",
            name: "Online Meeting",
            hidden: false,
            icon: "bi bi-android"
        },
        {
            id: "6",
            type: "vocation-time",
            name: "collegas & friends",
            hidden: false,
            icon: "bi bi-music-note-list"
        },
        {
            id: "7",
            type: "vocation-time",
            name: "Walking",
            hidden: false,
            icon: "bi bi-person-walking"
        },
        {
            id: "8",
            type: "vocation-time",
            name: "Music time",
            hidden: false,
            icon: "bi bi-music-note"
        },
        {
            id: "9",
            type: "vocation-time",
            name: "Travel Time",
            hidden: false,
            icon: "bi bi-luggage"
        },
        {
            id: "10",
            type: "motivation",
            name: "Travel Time",
            hidden: false,
            icon: "bi bi-luggage"
        },
        {
            id: "11",
            type: "motivation",
            name: "Movie Time",
            hidden: false,
            icon: "bi bi-film"
        },
        {
            id: "11",
            type: "motivation",
            name: "Shopping",
            hidden: false,
            icon: "bi bi-shop"
        }
    ]);

    function removeItem(itemId){
        console.log(itemId);
        list.map((item)=>{
            if(item.id==itemId){
                item.hidden = true;
            }
        })
        setList([...list]);
    }


    return (
        <div>
            <div className="container">
                <div className="row d-flex flex-column g-3 align-items-center">
                    <hr/>
                        <h1><u>Courses</u></h1>
                            {
                                list.map((item) => {
                                    if(item.type === "course"){
                                        return <div className='col-auto' key={item.id+"-"+item.type} onClick={()=>{
                                            removeItem(item.id);
                                        }} style={{display: item.hidden ? "none" : "block"}}>
                                            <label htmlFor="inputTime" className="col-form-label">
                                                <p className={item.icon}>{item.name}</p></label>
                                        </div>;
                                    }
                                    return null; // Return null for items that don't match any type
                                })
                            }
                </div>
                <div className="row d-flex flex-column g-3 align-items-center">
                        <hr/>
                        <h1><u>Work Issues</u></h1>
                            {
                                list.map((item) => {
                                    if(item.type === "work-issue"){
                                        return <div className='col-auto' key={item.id+"-"+item.type} onClick={()=>{
                                            removeItem(item.id);
                                        }} style={{display: item.hidden ? "none" : "block"}}>
                                            <label htmlFor="inputTime" className="col-form-label">
                                                <p className={item.icon}>{item.name}</p></label>
                                        </div>;
                                    }
                                    return null; // Return null for items that don't match any type
                                })
                            }
                </div>
                <div className="row d-flex flex-column g-3 align-items-center">
                        <hr/>
                        <h1><u>Vocation time</u></h1>
                            {
                                list.map((item) => {
                                    if(item.type === "vocation-time"){
                                        return <div className='col-auto' key={item.id+"-"+item.type} onClick={()=>{
                                            removeItem(item.id);
                                        }} style={{display: item.hidden ? "none" : "block"}}>
                                            <label htmlFor="inputTime" className="col-form-label">
                                                <p className={item.icon}>{item.name}</p></label>
                                        </div>;
                                    }
                                    return null; // Return null for items that don't match any type
                                })
                            }
                </div>
                <div className="row d-flex flex-column g-3 align-items-center">
                        <hr/>
                        <h1><u>Motivation Time</u></h1>
                            {
                                list.map((item) => {
                                    if(item.type === "motivation"){
                                        return <div className='col-auto' key={item.id+"-"+item.type} onClick={()=>{
                                            removeItem(item.id);
                                        }} style={{display: item.hidden ? "none" : "block"}}>
                                            <label htmlFor="inputTime" className="col-form-label">
                                                <p className={item.icon}>{item.name}</p></label>
                                        </div>;
                                    }
                                    return null; // Return null for items that don't match any type
                                })
                            }
                </div>
            </div>
        </div>
    );

}


export default HideItems;