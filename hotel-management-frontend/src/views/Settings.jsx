import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'

export default function Settings() {
  const { theme, setTheme, toggleTheme, showToast, setGlobalLoading } = useApp()
  const [hotelName, setHotelName] = useState('Grand Horizon Resort')
  const [hotelEmail, setHotelEmail] = useState('operations@grandhorizon.com')
  const [hotelPhone, setHotelPhone] = useState('+1 (555) 019-2830')
  const [checkInPolicy, setCheckInPolicy] = useState('14:00')
  const [checkOutPolicy, setCheckOutPolicy] = useState('12:00')

  useEffect(() => {
    setHotelName(localStorage.getItem('gh_hotel_name') || 'Grand Horizon Resort')
    setHotelEmail(localStorage.getItem('gh_hotel_email') || 'operations@grandhorizon.com')
    setHotelPhone(localStorage.getItem('gh_hotel_phone') || '+1 (555) 019-2830')
    setCheckInPolicy(localStorage.getItem('gh_hotel_checkin') || '14:00')
    setCheckOutPolicy(localStorage.getItem('gh_hotel_checkout') || '12:00')
  }, [])

  const setThemeMode = (nextTheme) => {
    if (theme === nextTheme) {
      return
    }

    setTheme(nextTheme)
    showToast(`Switched to ${nextTheme === 'dark' ? 'Dark' : 'Light'} Mode.`, 'info')
  }

  const saveHotelSettings = (event) => {
    event.preventDefault()
    setGlobalLoading(true)

    setTimeout(() => {
      localStorage.setItem('gh_hotel_name', hotelName.trim())
      localStorage.setItem('gh_hotel_email', hotelEmail.trim())
      localStorage.setItem('gh_hotel_phone', hotelPhone.trim())
      localStorage.setItem('gh_hotel_checkin', checkInPolicy)
      localStorage.setItem('gh_hotel_checkout', checkOutPolicy)

      showToast('Hotel configurations updated successfully.', 'success')
      setGlobalLoading(false)
    }, 800)
  }

  const currentTheme = theme || 'dark'

  return (
    <div className="space-y-6 animate-fade-in font-sans text-slate-350">
      {/* Header section */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight font-heading">Portal Settings</h1>
        <p className="text-sm text-slate-400">Manage portal themes, stay policy parameters, and general resort options.</p>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Side: Appearance & Theme */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 shadow-lg flex flex-col h-full">
          <div>
            <h3 className="text-base font-bold text-slate-200 font-heading mb-1">
              <i className="fa-solid fa-palette text-brand-500 mr-2"></i>Appearance & Theme
            </h3>
            <p className="text-xs text-slate-400 mb-6">Choose between light and dark modes for your admin interface.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
            <button
              type="button"
              onClick={() => setThemeMode('light')}
              className={`flex flex-col items-center justify-between p-4 rounded-xl border transition-all text-left ${currentTheme === 'light' ? 'border-brand-500 bg-brand-50/10 shadow-lg shadow-brand-500/5' : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-slate-100/50 dark:bg-slate-900/30'}`}
            >
              <div className="w-full flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-200">Light Mode</span>
                <div className="w-4 h-4 rounded-full border border-slate-355 dark:border-slate-655 flex items-center justify-center p-0.5">
                  <div className={`w-full h-full rounded-full bg-brand-500 ${currentTheme === 'light' ? '' : 'hidden'}`}></div>
                </div>
              </div>
              <div className="w-full h-24 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between p-2 overflow-hidden shadow-inner">
                <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1">
                  <div className="w-3 h-3 rounded-full bg-brand-500"></div>
                  <div className="h-2 bg-slate-300 w-12 rounded"></div>
                </div>
                <div className="flex gap-2">
                  <div className="w-1/3 h-10 rounded bg-white border border-slate-200 shadow-sm"></div>
                  <div className="w-2/3 h-10 rounded bg-white border border-slate-200 shadow-sm"></div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setThemeMode('dark')}
              className={`flex flex-col items-center justify-between p-4 rounded-xl border transition-all text-left ${currentTheme === 'dark' ? 'border-brand-500 bg-brand-950/10 shadow-lg shadow-brand-500/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-slate-100/50 dark:bg-slate-900/30'}`}
            >
              <div className="w-full flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-200">Dark Mode</span>
                <div className="w-4 h-4 rounded-full border border-slate-355 dark:border-slate-655 flex items-center justify-center p-0.5">
                  <div className={`w-full h-full rounded-full bg-brand-500 ${currentTheme === 'dark' ? '' : 'hidden'}`}></div>
                </div>
              </div>
              <div className="w-full h-24 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between p-2 overflow-hidden shadow-inner">
                <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1">
                  <div className="w-3 h-3 rounded-full bg-brand-500"></div>
                  <div className="h-2 bg-slate-700 w-12 rounded"></div>
                </div>
                <div className="flex gap-2">
                  <div className="w-1/3 h-10 rounded bg-slate-900 border border-slate-800"></div>
                  <div className="w-2/3 h-10 rounded bg-slate-900 border border-slate-800"></div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Right Side: Hotel Configurations */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 shadow-lg">
          <div>
            <h3 className="text-base font-bold text-slate-200 font-heading mb-1">
              <i className="fa-solid fa-hotel text-brand-500 mr-2"></i>Hotel Configurations
            </h3>
            <p className="text-xs text-slate-400 mb-6">Update general resort data and stay policies.</p>
          </div>

          <form onSubmit={saveHotelSettings} className="space-y-4 font-sans">
            <div>
              <label htmlFor="setting-hotel-name" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Resort Name</label>
              <input id="setting-hotel-name" type="text" required value={hotelName} onChange={(event) => setHotelName(event.target.value)} className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="setting-hotel-email" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Contact Email</label>
                <input id="setting-hotel-email" type="email" required value={hotelEmail} onChange={(event) => setHotelEmail(event.target.value)} className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm" />
              </div>
              <div>
                <label htmlFor="setting-hotel-phone" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Phone Number</label>
                <input id="setting-hotel-phone" type="text" required value={hotelPhone} onChange={(event) => setHotelPhone(event.target.value)} className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="setting-hotel-checkin" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Check-in Time Policy</label>
                <input id="setting-hotel-checkin" type="time" required value={checkInPolicy} onChange={(event) => setCheckInPolicy(event.target.value)} className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm" />
              </div>
              <div>
                <label htmlFor="setting-hotel-checkout" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Check-out Time Policy</label>
                <input id="setting-hotel-checkout" type="time" required value={checkOutPolicy} onChange={(event) => setCheckOutPolicy(event.target.value)} className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm" />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/50 flex justify-end">
              <button type="submit" className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-brand-500/10 hover:shadow-brand-500/20">Save Configurations</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}