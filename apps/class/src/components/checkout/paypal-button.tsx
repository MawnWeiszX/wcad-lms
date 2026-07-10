'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  courseIds: string[];
}

interface PayPalWindow {
  paypal?: {
    Buttons(options: {
      style?: unknown;
      createOrder(): Promise<string>;
      onApprove(data: { orderID: string }): Promise<void>;
      onError(err: unknown): void;
    }): {
      render(containerId: string): void;
    };
  };
}

export function PayPalButton({ courseIds }: Props) {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const paypalContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    const loadPayPal = async () => {
      const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
      if (!clientId) {
        setErrorMsg('Client ID de PayPal no configurado. Agrega NEXT_PUBLIC_PAYPAL_CLIENT_ID a .env.local');
        setLoading(false);
        return;
      }

      // 1. Cargar el script de PayPal
      const scriptId = 'paypal-sdk-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;

      if (!script) {
        script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
        script.id = scriptId;
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => {
          script!.onload = resolve;
        });
      }

      if (!active) return;

      try {
        if (paypalContainerRef.current) {
          paypalContainerRef.current.innerHTML = ''; // Limpiar renders previos
        }

        const paypalWindow = (window as unknown as PayPalWindow).paypal;
        if (!paypalWindow || !paypalWindow.Buttons) {
          throw new Error('SDK de PayPal no disponible');
        }

        if (active) setLoading(false);

        paypalWindow.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
          },
          createOrder: async () => {
            const res = await fetch('/api/payments/paypal/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ courseIds }),
            });
            const data = await res.json();
            if (!res.ok) {
              throw new Error(data.error || 'No se pudo crear la orden.');
            }
            return data.id; // Retorna el Order ID
          },
          onApprove: async (data: { orderID: string }) => {
            if (active) setLoading(true);
            try {
              const res = await fetch('/api/payments/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: data.orderID }),
              });

              const result = await res.json();
              if (!res.ok) {
                throw new Error(result.error || 'No se pudo capturar el pago.');
              }

              // Redirigir al dashboard exitoso al finalizar
              window.location.href = `/dashboard?success=true`;
            } catch (err) {
              const errorObj = err as { message?: string };
              alert(errorObj.message || 'Error al capturar la orden en el servidor.');
              if (active) setLoading(false);
            }
          },
          onError: (err: unknown) => {
            console.error('[PayPal SDK Error]', err);
            if (active) {
              setErrorMsg('Hubo un error con la pasarela de PayPal.');
            }
          }
        }).render('#paypal-button-container');

      } catch (err) {
        console.error(err);
        if (active) {
          setErrorMsg('Error al renderizar los botones de PayPal.');
          setLoading(false);
        }
      }
    };

    loadPayPal();

    return () => {
      active = false;
    };
  }, [courseIds]);

  return (
    <div className="space-y-4">
      {loading && (
        <div className="flex flex-col items-center justify-center p-8 border border-[var(--color-border)] rounded-2xl bg-[var(--color-surface)] space-y-3">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
          <span className="text-xs text-[var(--color-text-secondary)]">Cargando botones de PayPal...</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 border border-red-500/25 bg-red-500/10 text-xs text-red-600 dark:text-red-400 rounded-xl">
          {errorMsg}
        </div>
      )}
      <div id="paypal-button-container" ref={paypalContainerRef}></div>
    </div>
  );
}
