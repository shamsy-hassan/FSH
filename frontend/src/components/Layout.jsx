import { useAuth } from '../contexts/AuthContext'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import AdminNavbar from './AdminNavbar'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'

const Layout = () => {
  const { isAdmin, user } = useAuth()
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar when clicking outside on mobile
  const handleOverlayClick = () => {
    if (isSidebarOpen) {
      setSidebarOpen(false)
    }
  }

  // Admin layout (no sidebar, with AdminNavbar)
  if (isAdmin) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <AdminNavbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 mt-16 overflow-auto">
          <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm p-6 border border-green-100">
            <Outlet />
          </div>
        </main>
      </div>
    )
  }

  // User layout (Sidebar + Navbar)
  return (
    <div className="flex h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Sidebar Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-green-900 bg-opacity-50 z-40 md:hidden"
          onClick={handleOverlayClick}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        bg-gradient-to-b from-green-800 to-emerald-900 text-white shadow-xl
      `}>
        <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Navbar */}
        <div className="fixed top-0 left-0 right-0 z-30 bg-white shadow-md border-b border-green-200">
          <Navbar 
            onMenuClick={() => setSidebarOpen(!isSidebarOpen)} 
            user={user}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 mt-16 overflow-auto">
          <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm p-6 border border-green-100">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout