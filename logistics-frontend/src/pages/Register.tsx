import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { AuthService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { notifyError, notifySuccess } from '../lib/notify';
import axios from 'axios';

function Register() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [dni, setDni] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const result = await AuthService.registerClient({
        username: username.trim(),
        password,
        dni: dni.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });

      notifySuccess(
        'Cuenta creada',
        `Bienvenido, ${result.fullName}. Ya puedes iniciar sesión.`,
      );
      navigate('/login', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        notifyError(err, 'El usuario o DNI ya están registrados.', 'Registro duplicado');
      } else {
        notifyError(err, 'No se pudo completar el registro.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-container-low px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="bento-cell">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center border-2 border-on-surface bg-primary text-on-primary shadow-brutal">
              <UserPlus className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold uppercase tracking-tight text-on-surface">
              Crear cuenta de cliente
            </h1>
            <p className="mt-2 text-sm font-medium text-on-surface-muted">
              Regístrate para programar recojos y gestionar tus envíos.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="dni" className="brutalist-label">
                  DNI
                </label>
                <input
                  id="dni"
                  type="text"
                  value={dni}
                  onChange={(event) => setDni(event.target.value)}
                  disabled={submitting}
                  required
                  className="brutalist-input"
                />
              </div>

              <div>
                <label htmlFor="fullName" className="brutalist-label">
                  Nombre completo
                </label>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  disabled={submitting}
                  required
                  className="brutalist-input"
                />
              </div>

              <div>
                <label htmlFor="email" className="brutalist-label">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={submitting}
                  required
                  className="brutalist-input"
                />
              </div>

              <div>
                <label htmlFor="phone" className="brutalist-label">
                  Teléfono
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  disabled={submitting}
                  required
                  className="brutalist-input"
                />
              </div>

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
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={submitting}
                  required
                  minLength={6}
                  className="brutalist-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="brutalist-button-primary w-full"
            >
              {submitting ? 'Registrando...' : 'Crear cuenta'}
            </button>

            <p className="text-center text-sm font-medium text-on-surface-muted">
              ¿Ya tienes cuenta?{' '}
              <Link
                to="/login"
                className="font-bold uppercase tracking-wide text-primary underline decoration-2 underline-offset-4"
              >
                Inicia sesión
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
