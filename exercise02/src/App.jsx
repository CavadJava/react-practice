import './App.css'
import Button from "./components/button/button.jsx";

function App() {

  return (
    <>
      <div>
          <Button label={"Hello React"} alertEnable={false}></Button>
          <Button label={"Hello React, Click button"} alertEnable={true} alertText={"Hello React"}></Button>
      </div>
    </>
  )
}

export default App
