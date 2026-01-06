import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Task02 from './components/Task02'
import TemperatureCheck from './components/TempratureCheck'
import PasswordCheck from './components/PasswordCheck'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      {/* <Task01 task={{ title: 'Sample Task', description: 'This is a sample task description.' }} /> */}
      <PasswordCheck />
    </>
  )
}

export default App
