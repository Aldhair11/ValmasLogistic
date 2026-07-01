import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { AuthService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { notifyError } from '../lib/notify';
import axios from 'axios';

interface LocationState {
  from?: { pathname: string };
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const token = await AuthService.login(username.trim(), password);
      login(token);
      const fromPath =
        (location.state as LocationState | null)?.from?.pathname ?? '/dashboard';
      const redirectTo =
        fromPath === '/' || fromPath === '/login' || fromPath === '/register'
          ? '/dashboard'
          : fromPath;
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        notifyError(err, 'Usuario o contraseña incorrectos.', 'Acceso denegado');
      } else {
        notifyError(err, 'No se pudo iniciar sesión.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-container-low px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bento-cell">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center border-2 border-on-surface bg-primary text-on-primary shadow-brutal">
              <LogIn className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold uppercase tracking-tight text-on-surface">
              Valmas Logistics
            </h1>
            <p className="mt-2 text-sm font-medium text-on-surface-muted">
              Inicia sesión para acceder al portal logístico.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="username" className="brutalist-label">
                Usuario
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={submitting}
                required
                className="brutalist-input"
              />
            </div>

            <div>
              <label htmlFor="password" className="brutalist-label">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={submitting}
                required
                className="brutalist-input"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="brutalist-button-primary w-full"
            >
              {submitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>

            <p className="text-center text-sm font-medium text-on-surface-muted">
              ¿No tienes cuenta?{' '}
              <Link
                to="/register"
                className="font-bold uppercase tracking-wide text-primary underline decoration-2 underline-offset-4"
              >
                Regístrate aquí
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
