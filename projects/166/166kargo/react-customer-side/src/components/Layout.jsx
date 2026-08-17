import { Outlet } from 'react-router-dom'
import TopNav from './TopNav'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  return (
    <>
      <TopNav />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
