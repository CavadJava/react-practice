import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import LoginPage from './components/LoginForm/LoginForm'
import AdminPage from './components/admin/home/index'
import Dashboard from './components/admin/dashboard/dashboard'
import DashboardCard01 from './components/admin/bexamples/card01/card01'
import User from './components/admin/users/user'
import Company from './components/admin/company/company/company'
import CompanyView from './components/admin/company/company-view/company-view'
import ProjectView from './components/admin/project/projectview/projectview'
import Project from './components/admin/project/project/project'
import Monitoring from './components/admin/bank/monitoring/monitoring'
import ProjectDetail from './components/admin/bank/project/projectdetail'
import CustomersData from './components/admin/bank/project/customer'
import DepositPage from './components/admin/bank/project/deposit-page/deposit'
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
          path="/dashboard/users"
          element={<User />}
        />User page

        <Route
          path="/dashboard/companies"
          element={<Company />}
        />Company page

        <Route
          path="/dashboard/company-view"
          element={<CompanyView />}
        />CompanyView page

        <Route
          path="/dashboard/projects"
          element={<Project />}
        />Project page

        <Route
          path="/dashboard/project-view"
          element={<ProjectView />}
        />ProjectView page

        <Route
          path="/dashboard/cards/card01"
          element={<DashboardCard01/>}
        />Dashboard - Card - 01 page

        <Route
          path="/dashboard/bank/monitoring"
          element={<Monitoring/>}
        />Dashboard - Bank Monitoring

        <Route
          path="/dashboard/bank/project/:uniqueId"
          element={<ProjectDetail/>}
        />Dashboard - BankProject Detail page
        <Route
          path="/dashboard/bank/project/:uniqueId/customers"
          element={<CustomersData/>}
          />Dashboard - BankProject CustomerData page
        <Route
          path="/dashboard/bank/project/deposit"
          element={<DepositPage/>}
          />Dashboard - BankProject Deposit page
        
        {/* Səhv link yazılanda avtomatik /dashboard-a yönləndirsin */}
        <Route path="*" element={<Navigate to="/dashboard/bank/monitoring" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App