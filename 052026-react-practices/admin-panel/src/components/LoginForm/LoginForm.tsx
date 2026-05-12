import styles from './LoginForm.module.css'

const LoginForm = () => {
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