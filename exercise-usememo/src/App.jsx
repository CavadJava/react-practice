import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import SimpleWithUseId from './components/SimpleWithUseId'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <SimpleWithUseId />
      </div>
    </>
  )
}

export default App
