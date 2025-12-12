import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import LoginForm from './components/formik_forms/LoginForm'
import YumLoginForm from './components/YumLoginForm'
import SimpleForm from './components/SimpleForm'
// import PersonalResume from './components/resume/PersonalResume'
import PersonalResume from './components/resume-formik/PersonalResume'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <PersonalResume />
    </>
  )
}

export default App
