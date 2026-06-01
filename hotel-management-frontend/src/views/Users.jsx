import { useEffect, useState } from 'react'
import api from '../services/api'
import { useApp } from '../context/AppContext'

const emptyForm = {
  id: '',
  full_name: '',
  email: '',
  username: '',
  role: 'Staff',
  password: '',
}

export default function Users() {
  const { user: currentUser, showToast, setGlobalLoading } = useApp()
  const [users, setUsers] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const isAdmin = (currentUser?.role || '').toLowerCase() === 'admin'

  const fetchUsersData = async () => {
    setLoading(true)

    try {
      const [usersRes, auditRes] = await Promise.all([api.getAdminUsers(), api.getAuditLogs()])
      setUsers(usersRes.data.data || usersRes.data || [])
      setAuditLogs(auditRes.data.data || auditRes.data || [])
    } catch (error) {
      console.error('Error fetching admin directory:', error)
      showToast('Error retrieving administration details from the backend.', 'error')
      setUsers([])
      setAuditLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false)
      return
    }

    fetchUsersData()
  }, [isAdmin])

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4 border border-amber-500/20">
          <i className="fa-solid fa-shield-halved text-2xl"></i>
        </div>
        <h3 className="text-xl font-bold text-slate-200 font-heading">Access Restricted</h3>
        <p className="text-slate-400 mt-2 max-w-md text-sm font-medium">The User Management view is restricted to administrators only. Your account level is currently flagged as {currentUser?.role || 'Unauthorized'}.</p>
        <a href="#dashboard" className="mt-6 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl text-sm transition-colors">
          Return to Dashboard
        </a>
      </div>
    )
  }

  const openModal = (selectedUser = null) => {
    if (selectedUser) {
      setForm({
        id: selectedUser.id || selectedUser._id || '',
        full_name: selectedUser.full_name || selectedUser.name || '',
        email: selectedUser.email || '',
        username: selectedUser.username || '',
        role: selectedUser.role || 'Staff',
        password: '',
      })
    } else {
      setForm(emptyForm)
    }

    setModalOpen(true)
  }

  const closeModal = () => setModalOpen(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      username: form.username.trim(),
      role: form.role,
    }

    if (form.password.trim()) {
      payload.password = form.password.trim()
    }

    setGlobalLoading(true)
    try {
      if (form.id) {
        await api.updateAdminUser(form.id, payload)
        showToast(`User account credentials for ${payload.full_name} updated.`, 'success')
      } else {
        await api.createAdminUser(payload)
        showToast(`User ${payload.full_name} successfully registered.`, 'success')
      }

      closeModal()
      await fetchUsersData()
    } catch (error) {
      console.error('Error saving user profile:', error)
      showToast(error.response?.data?.message || 'Error processing request.', 'error')
    } finally {
      setGlobalLoading(false)
    }
  }

  const confirmDelete = async (id) => {
    const selectedUser = users.find((entry) => (entry.id || entry._id) == id)
    if (!selectedUser) {
      return
    }

    if (!window.confirm(`Remove portal access for user "${selectedUser.name}"? This closes active sessions.`)) {
      return
    }

    setGlobalLoading(true)
    try {
      await api.deleteAdminUser(id)
      showToast(`User ${selectedUser.name} deleted successfully.`, 'success')
      await fetchUsersData()
    } catch (error) {
      console.error('Error removing user:', error)
      showToast(error.response?.data?.message || 'Failed to remove user account.', 'error')
    } finally {
      setGlobalLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight font-heading">User Directory & Audits</h1>
          <p className="text-sm text-slate-400">Configure administrative access credentials and review database audit traces.</p>
        </div>
        <button onClick={() => openModal()} className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 font-semibold transition-all flex items-center gap-2 text-sm">
          <i className="fa-solid fa-user-plus text-xs"></i>
          <span>Create User</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass-panel rounded-2xl border border-slate-800/80 shadow-lg lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-800/60">
            <h3 className="text-base font-bold text-slate-200 font-heading">Active Staff Directory</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 text-[10px] font-bold tracking-wider uppercase border-b border-slate-800/40">
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Username</th>
                  <th className="py-3 px-6">Email</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500">Retrieving system users...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500">No portal users configured.</td>
                  </tr>
                ) : (
                  users.map((entry) => (
                    <tr key={entry.id || entry._id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-200">{entry.full_name || entry.name}</td>
                      <td className="py-4 px-6 font-mono text-slate-400">{entry.username}</td>
                      <td className="py-4 px-6 text-slate-400">{entry.email || 'N/A'}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold border ${entry.role?.toLowerCase() === 'admin' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-800 text-slate-400 border-slate-700/50'}`}>
                          {entry.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openModal(entry)} className="p-2 text-slate-400 hover:text-brand-400 hover:bg-slate-800/80 rounded-lg transition-all" title="Edit user">
                            <i className="fa-solid fa-user-pen text-sm"></i>
                          </button>
                          <button onClick={() => confirmDelete(entry.id || entry._id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all" title="Delete user">
                            <i className="fa-solid fa-trash-can text-sm"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-800/80 shadow-lg overflow-hidden flex flex-col h-[400px]">
          <div className="p-6 border-b border-slate-800/60">
            <h3 className="text-base font-bold text-slate-200 font-heading">Security Audit Trail</h3>
          </div>
          <div className="overflow-y-auto flex-grow p-4 space-y-4">
            {auditLogs.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-8">Retrieving audit trace...</p>
            ) : (
              auditLogs.map((entry) => {
                const timestamp = new Date(entry.timestamp || entry.createdAt)
                const formattedTime = `${timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ${timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

                return (
                  <div key={entry.id || `${entry.username}-${formattedTime}`} className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-slate-400 uppercase tracking-wider">{entry.username || 'System'}</span>
                      <span className="text-slate-500 font-semibold">{formattedTime}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{entry.action || entry.activity}</p>
                    <div className="text-[9px] text-slate-500 tracking-wide font-mono truncate">{entry.details || ''}</div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-500 to-indigo-500"></div>

            <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-100 font-heading">{form.id ? 'Modify Portal Access' : 'Create Portal User'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-200 transition-colors">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="user-name" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">User Full Name</label>
                <input id="user-name" type="text" required value={form.full_name} onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))} placeholder="e.g. Liam Smith" className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm" />
              </div>

              <div>
                <label htmlFor="user-email" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                <input id="user-email" type="email" required value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="e.g. liam@grandhorizon.com" className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm" />
              </div>

              <div>
                <label htmlFor="user-username" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Username</label>
                <input id="user-username" type="text" required value={form.username} onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))} placeholder="e.g. liam_smith" className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="user-role" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Role Type</label>
                  <select id="user-role" required value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))} className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm">
                    <option value="Staff">Staff</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="user-password" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">{form.id ? 'New Password (Optional)' : 'Password'}</label>
                  <input id="user-password" type="password" required={!form.id} value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} placeholder="••••••••" className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-brand-500 transition-all text-sm" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/50 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-slate-800 hover:bg-slate-900 text-slate-300 font-semibold rounded-xl text-sm transition-all">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-all">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}