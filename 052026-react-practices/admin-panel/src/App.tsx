import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom'

import LoginPage from './components/LoginForm/LoginForm'
import AdminPage from './components/admin/home/index'
import Dashboard from './components/admin/dashboard/dashboard'
import DashboardCard01 from './components/admin/bexamples/card01/card01'

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

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />Dashboard page

        <Route
          path="/dashboard/cards/card01"
          element={<DashboardCard01/>}
        />Dashboard - Card - 01 page
      </Routes>
    </BrowserRouter>
  )
}

export default App