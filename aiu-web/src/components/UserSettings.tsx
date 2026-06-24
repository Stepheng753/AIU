import { useState } from 'react';
import type { UserProfile } from '../App';

interface UserSettingsProps {
  user: UserProfile | null;
  token: string | null;
  apiURL: string;
  onUpdateProfile: (user: UserProfile, token?: string) => void;
  onClearHistory: () => void;
  hasHistory: boolean;
}

export default function UserSettings({
  user,
  token,
  apiURL,
  onUpdateProfile,
  onClearHistory,
  hasHistory
}: UserSettingsProps) {
  const [editField, setEditField] = useState<'name' | 'email' | 'password' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = (field: 'name' | 'email' | 'password') => {
    setError('');
    setSuccess('');
    setEditField(field);
    if (field === 'name') {
      setEditValue(user?.name || '');
    } else if (field === 'email') {
      setEditValue(user?.email || '');
    } else {
      setEditValue('');
    }
  };

  const handleSave = async () => {
    if (!editField) return;
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const payload: any = {};
      if (editField === 'name') payload.name = editValue;
      if (editField === 'email') payload.email = editValue;
      if (editField === 'password') payload.password = editValue;

      const res = await fetch(`${apiURL}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        onUpdateProfile(data.user, data.token);
        setSuccess(`${editField === 'password' ? 'Password' : editField === 'name' ? 'Display Name' : 'Email Address'} updated successfully!`);
        setEditField(null);
      } else {
        setError(data.error || 'Failed to update user profile');
      }
    } catch (err) {
      setError('Network error updating user settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-container">
      {error && <div className="error-banner" style={{ margin: 0 }}>{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      {/* Name Field */}
      <div className="settings-field-group">
        <label className="settings-field-label">Display Name</label>
        {editField === 'name' ? (
          <div className="settings-input-group">
            <input 
              type="text" 
              className="settings-input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Display Name"
              disabled={isSaving}
              autoFocus
            />
            <button className="settings-action-btn settings-save-btn" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button className="settings-action-btn settings-cancel-btn" onClick={() => setEditField(null)} disabled={isSaving}>
              Cancel
            </button>
          </div>
        ) : (
          <div className="settings-field-row">
            <span className="settings-field-value">{user?.name}</span>
            <button className="settings-edit-btn" onClick={() => startEdit('name')}>Edit</button>
          </div>
        )}
      </div>

      {/* Email Field */}
      <div className="settings-field-group">
        <label className="settings-field-label">Email Address</label>
        {editField === 'email' ? (
          <div className="settings-input-group">
            <input 
              type="email" 
              className="settings-input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="you@domain.com"
              disabled={isSaving}
              autoFocus
            />
            <button className="settings-action-btn settings-save-btn" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button className="settings-action-btn settings-cancel-btn" onClick={() => setEditField(null)} disabled={isSaving}>
              Cancel
            </button>
          </div>
        ) : (
          <div className="settings-field-row">
            <span className="settings-field-value">{user?.email}</span>
            <button className="settings-edit-btn" onClick={() => startEdit('email')}>Edit</button>
          </div>
        )}
      </div>

      {/* Password Field */}
      <div className="settings-field-group">
        <label className="settings-field-label">Password</label>
        {editField === 'password' ? (
          <div className="settings-input-group">
            <input 
              type="password" 
              className="settings-input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="••••••••"
              disabled={isSaving}
              autoFocus
            />
            <button className="settings-action-btn settings-save-btn" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button className="settings-action-btn settings-cancel-btn" onClick={() => setEditField(null)} disabled={isSaving}>
              Cancel
            </button>
          </div>
        ) : (
          <div className="settings-field-row">
            <span className="settings-field-value">************</span>
            <button className="settings-edit-btn" onClick={() => startEdit('password')}>Edit</button>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      {hasHistory && (
        <div className="settings-field-group" style={{ borderBottom: 'none', marginTop: '10px' }}>
          <label className="settings-field-label" style={{ color: 'var(--destructive)' }}>Danger Zone</label>
          <div className="settings-field-row">
            <span className="settings-field-value" style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
              Permanently delete all question & answer pairs.
            </span>
            <button 
              className="settings-edit-btn" 
              style={{ color: 'var(--destructive)', borderColor: 'var(--destructive)' }}
              onClick={onClearHistory}
            >
              Clear History
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
