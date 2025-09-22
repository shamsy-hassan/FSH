import { Link, useLocation } from 'react-router-dom'

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation()

  const userMenuItems = [
    { name: 'Dashboard', path: '/user/dashboard', icon: '📊' },
    { name: 'Agro Climate', path: '/user/agro-climate', icon: '🌦️' },
    { name: 'E-Commerce', path: '/user/ecommerce', icon: '🛒' },
    { name: 'My Market', path: '/user/my-market', icon: '🏪' },
    { name: 'My Orders', path: '/user/my-orders', icon: '📦' },
    { name: 'SACCO', path: '/user/sacco', icon: '💰' },
    { name: 'Skills', path: '/user/skills', icon: '🎓' },
    { name: 'My Store', path: '/user/my-store', icon: '🏬' },
    { name: 'Communicate', path: '/user/communicate', icon: '💬' },
    { name: 'Profile', path: '/user/profile', icon: '👤' },
  ]

  const adminMenuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
    { name: 'Manage Users', path: '/admin/manage-users', icon: '👥' },
    { name: 'Manage Agro Climate', path: '/admin/manage-agro-climate', icon: '🌦️' },
    { name: 'Manage E-Commerce', path: '/admin/manage-ecommerce', icon: '🛒' },
    { name: 'Manage Market', path: '/admin/manage-market', icon: '🏪' },
    { name: 'Manage Orders', path: '/admin/manage-orders', icon: '📦' },
    { name: 'Manage SACCO', path: '/admin/manage-sacco', icon: '💰' },
    { name: 'Manage Skills', path: '/admin/manage-skills', icon: '🎓' },
    { name: 'Manage Store', path: '/admin/manage-store', icon: '🏬' },
  ]

  const isAdminRoute = location.pathname.includes('/admin')
  const menuItems = isAdminRoute ? adminMenuItems : userMenuItems

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden ${
          isOpen ? 'block' : 'hidden'
        }`}
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 w-64 bg-primary-900 text-white h-screen overflow-y-auto z-50
          transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static`}
      >
        {/* Brand */}
        <div className="p-4 text-xl font-bold border-b border-primary-700">
          Farmers Home
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center p-2 rounded-md hover:bg-primary-700 transition-colors ${
                    location.pathname === item.path ? 'bg-primary-700' : ''
                  }`}
                  onClick={onClose} // closes sidebar on mobile
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
