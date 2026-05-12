import { useState } from 'react'
import './App.css'

import Header from './components/header/header'
import Card from './components/cards/cards'
import Footer from './components/footer/footer'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Header/>
      <Card/>
      <Footer/>
    </>
  )
}

export default App