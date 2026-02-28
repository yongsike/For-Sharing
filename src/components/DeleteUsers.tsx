import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import './Login.css'
import './EditUsers.css'

type UserRow = { user_id: string; full_name: string; email: string; role: string }

const DeleteUsers: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState<UserRow[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (user && !user.admin) {
    navigate('/')
    return null
  }

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('users')
        .select('user_id, full_name, email, role')
        .order('full_name')
      if (data) setUsers(data)
      setLoading(false)
    }
    fetchUsers()
  }, [])

  const toggle = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === users.length) setSelected(new Set())
    else setSelected(new Set(users.map((u) => u.user_id)))
  }

  const handleDelete = async () => {
    const ids = [...selected]
    if (ids.length === 0) return
    setDeleting(true)
    setError(null)
    setSuccess(null)
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('delete-user', {
        body: { user_ids: ids },
      })
      if (invokeError) throw new Error(invokeError.message)
      if (data?.error) throw new Error(data.error)
      setSuccess(`Deleted ${ids.length} user(s).`)
      setSelected(new Set())
      setUsers((prev) => prev.filter((u) => !ids.includes(u.user_id)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete selected users')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="login-page edit-users-page">
      <div className="edit-users-card glass-card animate-fade">
        <header className="login-header">
          <h2>Delete Users</h2>
          <span className="login-subtitle">Remove staff or admin accounts. Reassign their clients first (Edit Users).</span>
        </header>

        {error && (
          <div className="login-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div className="add-user-success">
            <div className="add-user-success-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <div className="add-user-success-content">
              <strong>{success}</strong>
            </div>
          </div>
        )}

        {loading ? (
          <p className="edit-users-loading">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="edit-users-empty">No users to show.</p>
        ) : (
          <>
            <div className="edit-users-bulk-bar">
              <label className="edit-users-check-all">
                <input type="checkbox" checked={selected.size === users.length} onChange={selectAll} />
                Select all
              </label>
              {selected.size > 0 && (
                <div className="edit-users-bulk-actions">
                  <button
                    type="button"
                    className="edit-users-save-btn"
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{ background: 'var(--danger)' }}
                  >
                    {deleting ? 'Deleting...' : `Delete ${selected.size} user(s)`}
                  </button>
                </div>
              )}
            </div>
            <div className="edit-users-table-wrap">
              <table className="edit-users-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}></th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.user_id} onClick={() => toggle(u.user_id)} className="edit-users-clickable-row">
                      <td onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(u.user_id)} onChange={() => toggle(u.user_id)} />
                      </td>
                      <td>{u.full_name}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <p className="login-footer-link">
          <button type="button" onClick={() => navigate('/admin/manage-users')} className="login-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>
            ← Back to Manage Users
          </button>
        </p>
      </div>
    </div>
  )
}

export default DeleteUsers
