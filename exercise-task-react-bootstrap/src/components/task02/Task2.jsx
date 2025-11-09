import React from 'react';

function Task() {
    return (
        <div className="container">
            <Photo/>
            <Info/>
            <Song/>
        </div>
    )
}

function Photo(){
    return (
        <div className="container">
            <img style={{width: '200px',height: '300px'}}
                src="https://upload.wikimedia.org/wikipedia/commons/b/b9/Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg" alt="Random" />
        </div>
    );
}
function Info(){
    return (
      <div className="container">
          <h1 style={{width:'500px',fontSize:'22px'}}>Known as the “King of Pop,” Michael Jackson was a best-selling American singer, songwriter, and dancer. </h1>
      </div>
    );
}
function Song(){
    const songs = [
        {
            id: "1",
            name: "King Kunta",
            image: "https://genius.com/Kendrick-lamar-king-kunta-lyrics"
        },
        {
            id: "2",
            name: "Billie Jean",
            image: "https://genius.com/Michael-jackson-billie-jean-lyrics"
        },
        {
            id: "3",
            name: "Wanna Be Startin’ Somethin’",
            image: "https://genius.com/Michael-jackson-wanna-be-startin-somethin-lyrics"
        }
    ]
    return (
        <div className="container">
            <h1 style={{width:'500px',fontSize:'22px',textAlign:'center'}}>Lyrics</h1>
            <ol>
                {
                    songs.map((song) => (
                        <li key={song.id}>
                            <a href={song.image}>{song.name}</a>
                        </li>
                    ))
                }
                <li>
                    <a>...</a>
                </li>
            </ol>
        </div>
    );
}

export default Task;