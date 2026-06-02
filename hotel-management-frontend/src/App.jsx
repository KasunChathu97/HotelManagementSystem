import { useEffect } from 'react'
import Login from './views/Login'
import Dashboard from './views/Dashboard'
import Rooms from './views/Rooms'
import Bookings from './views/Bookings'
import Customers from './views/Customers'
import Payments from './views/Payments'
import Expenses from './views/Expenses'
import Reports from './views/Reports'
import Settings from './views/Settings'
import Users from './views/Users'
import { useApp } from './context/AppContext'

function App() {
  const { token, user, activeView, toggleTheme, logout } = useApp()

  useEffect(() => {
    const titles = {
      login: 'Grand Horizon | Login',
      dashboard: 'Grand Horizon | Dashboard',
      rooms: 'Grand Horizon | Rooms',
      bookings: 'Grand Horizon | Bookings',
      customers: 'Grand Horizon | Customers',
      payments: 'Grand Horizon | Payments',
      expenses: 'Grand Horizon | Expenses',
      reports: 'Grand Horizon | Reports',
      settings: 'Grand Horizon | Settings',
      users: 'Grand Horizon | Users',
    }

    document.title = titles[activeView] || 'Grand Horizon'
  }, [activeView])

  if (!token || activeView === 'login') {
    return <Login />
  }

  const views = {
    dashboard: Dashboard,
    rooms: Rooms,
    bookings: Bookings,
    customers: Customers,
    payments: Payments,
    expenses: Expenses,
    reports: Reports,
    settings: Settings,
    users: Users,
  }

  const ActiveView = views[activeView] || Dashboard
  const userName = user?.full_name || user?.name || 'Administrator'
  const userRole = user?.role || 'Staff'
  const navItems = [
    { key: 'dashboard', label: 'Dashboard Home', icon: 'fa-chart-pie' },
    { key: 'rooms', label: 'Room Management', icon: 'fa-door-open' },
    { key: 'bookings', label: 'Booking Management', icon: 'fa-calendar-check' },
    { key: 'customers', label: 'Customer Management', icon: 'fa-users' },
    { key: 'payments', label: 'Payment Management', icon: 'fa-receipt' },
    { key: 'expenses', label: 'Expense Management', icon: 'fa-wallet' },
    { key: 'reports', label: 'Reports', icon: 'fa-file-invoice-dollar' },
  ]

  return (
    <div id="dashboard-layout" className="flex min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <aside id="sidebar-nav" className="hidden lg:flex w-64 flex-col justify-between border-r border-slate-800/80 bg-slate-900">
        <div>
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/50">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <i className="fa-solid fa-hotel text-sm"></i>
            </div>
            <div>
              <span className="font-bold text-lg text-slate-100 tracking-wide block leading-none font-heading">Brookside Hotel</span>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Admin Portal</span>
            </div>
          </div>

          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={`#${item.key}`}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all font-medium ${activeView === item.key ? 'bg-brand-500/15 text-slate-100 border border-brand-500/20' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'}`}
              >
                <i className={`fa-solid ${item.icon} w-5 text-center`}></i>
                <span>{item.label}</span>
              </a>
            ))}

            <div className="pt-4 pb-1">
              <p className="px-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">System Administration</p>
            </div>

            <a
              href="#settings"
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all font-medium ${activeView === 'settings' ? 'bg-brand-500/15 text-slate-100 border border-brand-500/20' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'}`}
            >
              <i className="fa-solid fa-sliders w-5 text-center"></i>
              <span>Settings</span>
            </a>

            {userRole.toLowerCase() === 'admin' && (
              <a
                href="#users"
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all font-medium ${activeView === 'users' ? 'bg-brand-500/15 text-slate-100 border border-brand-500/20' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'}`}
              >
                <i className="fa-solid fa-user-gear w-5 text-center"></i>
                <span>User Management</span>
              </a>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
          <div className="flex items-center gap-3 p-2 bg-slate-950/40 rounded-xl border border-slate-800/30">
            <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold uppercase">
              {userName.charAt(0)}
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate leading-tight">{userName}</p>
              <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-md font-bold mt-1 tracking-wide bg-slate-800 text-slate-400">{userRole}</span>
            </div>
            <button onClick={logout} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all" title="Logout">
              <i className="fa-solid fa-power-off text-sm"></i>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-grow flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-slate-900 border-b border-slate-800/50 px-6 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h2 className="text-lg font-bold text-slate-100 hidden sm:block font-heading">{(
              {
                dashboard: 'Dashboard Home',
                rooms: 'Room Management',
                bookings: 'Booking Management',
                customers: 'Customer Management',
                payments: 'Payment Management',
                expenses: 'Expense Management',
                reports: 'Reports & Analytics',
                settings: 'Portal Settings',
                users: 'User Account Management',
              }[activeView] || 'Grand Horizon'
            )}</h2>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-all" title="Toggle Theme Mode">
              <i className="fa-solid fa-circle-half-stroke text-base"></i>
            </button>
            <div className="hidden md:flex items-center gap-2 text-slate-400 text-sm px-3 py-1.5 bg-slate-950/40 border border-slate-800/50 rounded-xl">
              <i className="fa-solid fa-calendar-days text-brand-400"></i>
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-7xl w-full mx-auto animate-fade-in flex-grow">
          <ActiveView />
        </main>
      </div>
    </div>
  )
}

export default App
