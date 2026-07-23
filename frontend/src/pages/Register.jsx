import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { inputStyle, primaryButtonStyle, errorStyle } from '../components/formStyles';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { usePrefs } from '../lib/PrefsContext';

export default function Register() {
  const { t } = usePrefs();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { token, user } = await api.register({ name, email, password });
      login(token, user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title={t('createAccount')}
      subtitle={t('registerSubtitle')}
      footer={
        <span style={{ color: 'var(--text-secondary)' }}>
          {t('alreadyHaveAccount')} <Link to="/login" style={{ color: 'var(--accent)' }}>{t('signIn')}</Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit}>
        {error && <p style={errorStyle}>{error}</p>}
        <input
          style={inputStyle}
          type="text"
          placeholder={t('yourName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          style={inputStyle}
          type="email"
          placeholder={t('email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          style={inputStyle}
          type="password"
          placeholder={t('passwordHint')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button style={primaryButtonStyle} disabled={busy} type="submit">
          {busy ? t('creatingAccount') : t('createAccountBtn')}
        </button>
      </form>
    </AuthShell>
  );
}
