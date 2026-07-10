import { redirect } from 'next/navigation';

// La raíz del portal redirige al dashboard
export default function PortalRoot() {
  redirect('/dashboard');
}
