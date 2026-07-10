'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Loader2, Trash2, ShoppingCart, Lock } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { useCart } from '@/context/cart-context';
import { useUser } from '@/components/user-context';
import { signInWithGoogle } from '@/app/actions/auth';
import { createClient } from '@wcad/utils/supabase/client';
import { PaymentMethodSelector, PaymentMethodType } from '@/components/checkout/payment-method-selector';
import { MercadoPagoBrick } from '@/components/checkout/mercadopago-brick';
import { PayPalButton } from '@/components/checkout/paypal-button';
import { YapePlinForm } from '@/components/checkout/yape-plin-form';

interface VerifiedItem {
  id: string;
  title: string;
  slug: string;
  price: number;
  thumbnail_url: string | null;
  is_free: boolean;
  is_published: boolean;
}

export default function CheckoutPage() {
  const { items, removeFromCart, clearCart } = useCart();
  const { user, role } = useUser();

  const [verifiedItems, setVerifiedItems] = useState<VerifiedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<PaymentMethodType>('yape');
  const [notification, setNotification] = useState<string | null>(null);

  const isMpAvailable = !!process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
  const isPayPalAvailable = !!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  // Si las credenciales no están disponibles en el cliente, forzar Yape por defecto
  useEffect(() => {
    if (method === 'mercadopago' && !isMpAvailable) setMethod('yape');
    if (method === 'paypal' && !isPayPalAvailable) setMethod('yape');
  }, [method, isMpAvailable, isPayPalAvailable]);

  // Validar y sincronizar ítems del carrito con la base de datos (evita manipulación de precios)
  useEffect(() => {
    if (items.length === 0) {
      setVerifiedItems([]);
      setLoading(false);
      return;
    }

    const verifyCart = async () => {
      setLoading(true);
      const supabase = createClient();
      
      try {
        const itemIds = items.map((i) => i.id);

        // 1. Consultar detalles de los cursos en la base de datos
        const { data: dbCourses, error: dbError } = await supabase
          .from('courses')
          .select('id, title, slug, price, thumbnail_url, is_free, is_published')
          .in('id', itemIds);

        if (dbError || !dbCourses) {
          throw new Error('Error al consultar cursos en la base de datos');
        }

        // 2. Si el usuario está logueado, consultar sus inscripciones activas
        let enrolledCourseIds: string[] = [];
        if (user) {
          const { data: enrollments } = await supabase
            .from('enrollments')
            .select('course_id')
            .eq('student_id', user.id)
            .eq('status', 'active');

          if (enrollments) {
            enrolledCourseIds = (enrollments as { course_id: string }[]).map((e) => e.course_id);
          }
        }

        // 3. Filtrar y depurar
        const validCourses: VerifiedItem[] = [];
        const removedTitles: string[] = [];

        dbCourses.forEach((course: VerifiedItem) => {
          // Filtrar si ya está inscrito
          if (enrolledCourseIds.includes(course.id)) {
            removeFromCart(course.id);
            removedTitles.push(`"${course.title}" (Ya estás inscrito)`);
            return;
          }
          // Filtrar si es gratuito
          if (course.is_free || Number(course.price) === 0) {
            removeFromCart(course.id);
            removedTitles.push(`"${course.title}" (Es gratuito, inscribirse directamente en su página)`);
            return;
          }
          // Filtrar si no está publicado
          if (!course.is_published) {
            removeFromCart(course.id);
            removedTitles.push(`"${course.title}" (No publicado actualmente)`);
            return;
          }

          validCourses.push(course);
        });

        if (removedTitles.length > 0) {
          setNotification(`Se removieron los siguientes cursos de tu carrito: ${removedTitles.join(', ')}.`);
        } else {
          setNotification(null);
        }

        setVerifiedItems(validCourses);
      } catch (err) {
        console.error('[Verify Cart Error]', err);
      } finally {
        setLoading(false);
      }
    };

    verifyCart();
  }, [items, user, removeFromCart]);

  // Cargar usuario del Navbar
  const userInfo = user ? {
    email: user.email ?? '',
    name: user.name ?? user.email ?? 'Estudiante',
    avatarUrl: user.avatarUrl ?? null,
    role: role ?? 'student',
  } : null;

  const totalCalculado = verifiedItems.reduce((acc, item) => acc + Number(item.price), 0);
  const verifiedCourseIds = verifiedItems.map((i) => i.id);

  // Vaciar carrito tras pago exitoso si la URL tiene ?success=true
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('success=true')) {
      clearCart();
    }
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-[var(--color-surface-alt)] pt-16">
      <Navbar user={userInfo} />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Link href="/courses" className="hover:text-[var(--color-text)]">Cursos</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-[var(--color-text)]">Checkout</span>
        </div>

        {notification && (
          <div className="mb-6 rounded-xl bg-[var(--color-amber-bg)] p-4 text-sm text-[var(--color-amber-text)] border border-[var(--color-amber-border)]">
            {notification}
          </div>
        )}

        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
            <p className="text-sm text-[var(--color-text-secondary)]">Verificando carrito con el servidor...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] text-center max-w-lg mx-auto mt-10">
            <ShoppingCart className="h-16 w-16 text-[var(--color-text-muted)] mb-4" />
            <h2 className="text-xl font-bold text-[var(--color-text)]">Tu carrito está vacío</h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Explora nuestro catálogo de cursos para ingenieros y selecciona tus temas favoritos para iniciar tu aprendizaje.
            </p>
            <Link
              href="/courses"
              className="mt-6 inline-flex justify-center rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-all"
            >
              Ver catálogo de cursos
            </Link>
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center p-12 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] text-center max-w-md mx-auto mt-10">
            <Lock className="h-16 w-16 text-[var(--color-text-muted)] mb-4" />
            <h2 className="text-xl font-bold text-[var(--color-text)]">Inicia sesión para continuar</h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Necesitamos que ingreses a tu cuenta para poder asociar los cursos que compres a tu perfil de estudiante de forma segura.
            </p>
            <button
              onClick={() => signInWithGoogle('/checkout')}
              className="mt-6 w-full flex justify-center rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-[var(--color-primary)]/20"
            >
              Ingresar con Google
            </button>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-3">
            {/* Formulario y Métodos de Pago */}
            <div className="md:col-span-2 space-y-6">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-6">
                <h2 className="text-xl font-bold text-[var(--color-text)]">Finalizar Inscripción</h2>
                
                {/* Selector de Método de Pago */}
                <PaymentMethodSelector
                  selected={method}
                  onChange={setMethod}
                  isMpAvailable={isMpAvailable}
                  isPayPalAvailable={isPayPalAvailable}
                />
              </div>

              {/* Contenedor del método seleccionado */}
              <div>
                {method === 'mercadopago' && isMpAvailable && (
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                    <h3 className="text-base font-bold text-[var(--color-text)] mb-4 text-center">Pagar con tarjeta de crédito/débito</h3>
                    <MercadoPagoBrick
                      courseIds={verifiedCourseIds}
                      amount={totalCalculado}
                    />
                  </div>
                )}

                {method === 'paypal' && isPayPalAvailable && (
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4">
                    <h3 className="text-base font-bold text-[var(--color-text)] text-center">Pagar con PayPal</h3>
                    <p className="text-xs text-[var(--color-text-secondary)] text-center">
                      Serás redirigido a una ventana emergente segura de PayPal para finalizar tu pago de S/ {totalCalculado.toFixed(2)}.
                    </p>
                    <PayPalButton
                      courseIds={verifiedCourseIds}
                    />
                  </div>
                )}

                {(method === 'yape' || method === 'plin') && (
                  <YapePlinForm
                    courseIds={verifiedCourseIds}
                    amount={totalCalculado}
                    method={method}
                  />
                )}
              </div>
            </div>

            {/* Resumen del Pedido */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4 sticky top-24">
                <h3 className="font-bold text-[var(--color-text)] text-lg border-b border-[var(--color-border)] pb-3">Resumen de la compra</h3>
                
                {/* Lista de Cursos */}
                <div className="divide-y divide-[var(--color-border)] max-h-60 overflow-y-auto pr-1 space-y-3">
                  {verifiedItems.map((course) => (
                    <div key={course.id} className="flex gap-3 pt-3 first:pt-0">
                      {course.thumbnail_url ? (
                        <Image
                          src={course.thumbnail_url}
                          alt={course.title}
                          width={80}
                          height={48}
                          className="h-12 w-20 rounded-lg object-cover bg-[var(--color-surface-alt)] shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-20 rounded-lg bg-[var(--color-surface-alt)] flex items-center justify-center text-[10px] text-[var(--color-text-muted)] shrink-0">
                          Sin preview
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-[var(--color-text)] truncate">{course.title}</h4>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs font-semibold text-[var(--color-text-secondary)]">S/ {Number(course.price).toFixed(2)}</span>
                          <button
                            onClick={() => removeFromCart(course.id)}
                            className="text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
                            title="Eliminar curso"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[var(--color-border)] pt-4 space-y-3">
                  <div className="flex justify-between text-sm text-[var(--color-text-secondary)]">
                    <span>Precio total ({verifiedItems.length} cursos):</span>
                    <span>S/ {totalCalculado.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[var(--color-text-secondary)]">
                    <span>Descuentos:</span>
                    <span className="text-emerald-600">- S/ 0.00</span>
                  </div>
                  
                  <div className="flex justify-between text-base font-bold text-[var(--color-text)] border-t border-[var(--color-border)] pt-3">
                    <span>Total a pagar:</span>
                    <span>S/ {totalCalculado.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-[11px] text-[var(--color-text-muted)] text-center leading-relaxed pt-2">
                  Al completar tu inscripción, aceptas nuestros términos de servicio y políticas de reembolso.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
