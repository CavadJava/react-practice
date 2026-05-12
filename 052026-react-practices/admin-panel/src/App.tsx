import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom'

import LoginPage from './components/LoginForm/LoginForm'
import AdminPage from './components/admin/home/index'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<LoginPage />}
        /> Login Page

        <Route
          path="/admin"
          element={<AdminPage />}
        />Admin page
      </Routes>
    </BrowserRouter>
  )
}

export default App