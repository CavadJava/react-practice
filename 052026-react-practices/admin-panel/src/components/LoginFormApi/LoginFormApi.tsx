import { useState } from 'react'

import styles from './LoginFormApi.module.css'

const LoginFormApi = () => {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    try {
      const response = await fetch(
        'http://localhost:3000/api/login',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      )

      if (!response.ok) {
        
        console.warn("Login failed").
        //throw new Error('Login failed')
      }

      const data = await response.json()

      console.log(data)

      localStorage.setItem(
        'token',
        data.token
      )

      alert('Login success')
    } catch (error) {
      console.error(error)

      alert('Invalid credentials')
    }
  }


  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Login</h1>

        <form className={styles.form}>
          <div className={styles.group}>
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
            />
          </div>

          <div className={styles.group}>
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />
          </div>

          <button type="submit">
            Login
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginFormApi