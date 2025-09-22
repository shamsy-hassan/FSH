import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const AdminNavbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    setIsProfileOpen(false)
  }

  const adminMenuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
    { name: 'Users', path: '/admin/manage-users', icon: '👥' },
    { name: 'Agro Climate', path: '/admin/manage-agro-climate', icon: '🌦️' },
    { name: 'E-Commerce', path: '/admin/manage-ecommerce', icon: '🛒' },
    { name: 'Market', path: '/admin/manage-market', icon: '🏪' },
    { name: 'Orders', path: '/admin/manage-orders', icon: '📦' },
    { name: 'SACCO', path: '/admin/manage-sacco', icon: '💰' },
    { name: 'Skills', path: '/admin/manage-skills', icon: '🎓' },
    { name: 'Store', path: '/admin/manage-store', icon: '🏬' },
  ]

  return (
    <div className="bg-white shadow-md">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center space-x-8">
          <Link to="/admin/dashboard" className="text-xl font-bold text-primary-700">
            Farmers Home Admin
          </Link>
          
          <nav className="hidden md:flex space-x-4">
            {adminMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-primary-700 hover:bg-gray-100'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <span className="text-xl">🔔</span>
          </button>
          
          <div className="relative">
            <button 
              className="flex items-center space-x-2"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <span className="hidden sm:block">{user?.name || 'Admin'}</span>
            </button>
            
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border">
                <div className="px-4 py-2 border-b">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-600">{user?.email}</p>
                </div>
                <Link 
                  to="/user/profile" 
                  className="block px-4 py-2 hover:bg-gray-100 text-sm"
                  onClick={() => setIsProfileOpen(false)}
                >
                  👤 Profile
                </Link>
                <Link 
                  to="/user/dashboard" 
                  className="block px-4 py-2 hover:bg-gray-100 text-sm"
                  onClick={() => setIsProfileOpen(false)}
                >
                  👨‍🌾 User View
                </Link>
                <button 
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                  onClick={handleLogout}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu (simplified) */}
      <div className="md:hidden bg-gray-50 p-2 border-t">
        <select 
          className="w-full p-2 text-sm border rounded-md"
          value={location.pathname}
          onChange={(e) => window.location.href = e.target.value}
        >
          {adminMenuItems.map((item) => (
            <option key={item.path} value={item.path}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default AdminNavbar