'use client';

import { useState } from 'react';
import { ShoppingCart, Loader2, Check } from 'lucide-react';
import { enrollInCourse } from '@/app/actions/enroll';
import { signInWithGoogle } from '@/app/actions/auth';
import { useCart } from '@/context/cart-context';
import { useRouter } from 'next/navigation';

interface Props {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  coursePrice: number;
  courseThumbnailUrl: string | null;
  isLoggedIn: boolean;
  isFree: boolean;
}

export function EnrollButton({
  courseId,
  courseSlug,
  courseTitle,
  coursePrice,
  courseThumbnailUrl,
  isLoggedIn,
  isFree,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  
  const { addToCart, isInCart } = useCart();
  const router = useRouter();

  const handleFreeEnroll = async () => {
    if (!isLoggedIn) {
      await signInWithGoogle(`/courses/${courseSlug}`);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      await enrollInCourse(courseId, courseSlug);
    } catch (err) {
      const errorObj = err as { message?: string };
      if (errorObj.message && errorObj.message.includes('NEXT_REDIRECT')) {
        return;
      }
      setErrorMsg(errorObj.message || 'Ocurrió un error al inscribirte');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    addToCart({
      id: courseId,
      title: courseTitle,
      slug: courseSlug,
      price: coursePrice,
      thumbnail_url: courseThumbnailUrl,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart({
      id: courseId,
      title: courseTitle,
      slug: courseSlug,
      price: coursePrice,
      thumbnail_url: courseThumbnailUrl,
    });
    router.push('/checkout');
  };

  if (isFree) {
    return (
      <div className="w-full space-y-2">
        <button
          onClick={handleFreeEnroll}
          disabled={loading}
          id="btn-enroll"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-3.5 text-base font-semibold text-white transition-all hover:bg-[var(--color-primary-hover)] active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ShoppingCart className="h-5 w-5" />
          )}
          Inscribirse gratis
        </button>
        {errorMsg && (
          <p className="text-center text-xs font-medium text-red-500">
            {errorMsg}
          </p>
        )}
      </div>
    );
  }

  const alreadyInCart = isInCart(courseId);

  return (
    <div className="w-full space-y-2.5">
      {/* Botón Comprar ahora */}
      <button
        onClick={handleBuyNow}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-3.5 text-base font-semibold text-white transition-all hover:bg-[var(--color-primary-hover)] active:scale-[0.98] cursor-pointer"
      >
        <ShoppingCart className="h-5 w-5" />
        Comprar ahora
      </button>

      {/* Botón Agregar al carrito */}
      <button
        onClick={handleAddToCart}
        disabled={alreadyInCart}
        className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer ${
          alreadyInCart
            ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 cursor-not-allowed'
            : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
        }`}
      >
        {alreadyInCart ? (
          <>
            <Check className="h-4 w-4 text-emerald-600" />
            En el carrito
          </>
        ) : added ? (
          <>
            <Check className="h-4 w-4 text-emerald-600" />
            ¡Agregado!
          </>
        ) : (
          'Agregar al carrito'
        )}
      </button>
    </div>
  );
}
