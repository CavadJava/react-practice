import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Packages from './pages/Packages'
import Addresses from './pages/Addresses'
import Profile from './pages/Profile'
import Balance from './pages/Balance'
import Debts from './pages/Debts'
import Queries from './pages/Queries'
import Courier from './pages/Courier'
import Post from './pages/Post'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Packages />} />
        <Route path="addresses" element={<Addresses />} />
        <Route path="profile" element={<Profile />} />
        <Route path="balance" element={<Balance />} />
        <Route path="debts" element={<Debts />} />
        <Route path="queries" element={<Queries />} />
        <Route path="courier" element={<Courier />} />
        <Route path="post" element={<Post />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
