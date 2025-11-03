import './App.css'
import Button2 from "./components/button2/index.jsx";
import Button from "./components/button/index.jsx";

function App() {

    // for Button2 component
    // function handleClick(){
    //     alert("text")
    // }

  return (
    <>
      <div>
          <Button label={"Hello React"} alertEnable={false}></Button>
          <Button label={"Hello React, Click button"} alertEnable={true} alertText={"Hello React"}></Button>


          {/*<Button2 handleClick1={handleClick} label={"Hello React"} ></Button2>*/}
          {/*<Button2 handleClick1={handleClick} label={"Hello React, Click button"}></Button2>*/}
      </div>
    </>
  )
}

export default App
