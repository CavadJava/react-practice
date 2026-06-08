import heroImg from  './assets/hero.png';
const header = () =>{
    return (
        <div className="header">
            <nav className="header-nav">
                <div className="logo">
                    <img src={heroImg}/>
                </div>
            </nav>
        </div>
    )
}