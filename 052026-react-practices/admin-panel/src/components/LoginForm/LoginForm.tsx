import styles from './LoginForm.module.css'
import { useNavigate } from 'react-router-dom'

const LoginForm = () => {

  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()

    // login logic here

    // redirect to admin page
    navigate('/admin')
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Login</h1>

        <form className={styles.form}
                  onSubmit={handleSubmit}
        >
          <div className={styles.group}>
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter email"
            />
          </div>

          <div className={styles.group}>
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter password"
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

export default LoginForm