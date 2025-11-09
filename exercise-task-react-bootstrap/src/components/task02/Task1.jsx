import React from 'react';

function Task1() {
    return (
        <div className="container">
            <Photo/>
            <Info/>
            <SkillSet name="React" emoji=":react:" color="red"/>
        </div>
    )
}

function Photo(){
    return (
        <div className="container">
            <img style={{width: '200px',height: '300px'}}
                src="https://image.tmdb.org/t/p/w500/whNwkEQYWLFJA8ij0WyOOAD5xhQ.jpg" alt="Random" />
        </div>
    );
}
function Info(){
    return (
      <div className="container">
          <h1 style={{width:'500px',fontSize:'22px'}}>I am Javad. I am Software Engineer from Baku, Azerbaijan</h1>
      </div>
    );
}
function SkillSet(){
    return (
        <div className="container d-flex flex-wrap gap-2">
            <Skill name="React" emoji="💪" color="green"/>
            <Skill name="JavaScript" emoji="💪" color="orangered"/>
            <Skill name="HTML+CSS" emoji="💪" color="yellow"/>
        </div>
    );
}
function Skill({name, emoji, color}){
    return(<div className="skill" style={{backgroundColor: color}}>
        <span>{name}</span>
        <span>{emoji}</span>
    </div>
    );
}

export default Task1;