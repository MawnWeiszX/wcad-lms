'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  courseIds: string[];
  amount: number;
}

interface BrickController {
  unmount(): void;
}

interface MercadoPagoWindow {
  MercadoPago?: new (key: string, options?: unknown) => {
    bricks(): {
      create(brick: string, containerId: string, options: unknown): Promise<BrickController>;
    };
  };
}

export function MercadoPagoBrick({ courseIds, amount }: Props) {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const brickControllerRef = useRef<BrickController | null>(null);

  useEffect(() => {
    let active = true;

    const loadMp = async () => {
      // 1. Cargar el script de Mercado Pago de forma dinámica si no está presente
      if (!(window as unknown as MercadoPagoWindow).MercadoPago) {
        const script = document.createElement('script');
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      if (!active) return;

      const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
      if (!publicKey) {
        setErrorMsg('Llave pública de Mercado Pago no configurada. Agrega NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY a .env.local');
        setLoading(false);
        return;
      }

      try {
        const mpClass = (window as unknown as MercadoPagoWindow).MercadoPago;
        if (!mpClass) {
          throw new Error('MercadoPago SDK no cargado en window');
        }
        const mp = new mpClass(publicKey, { locale: 'es-PE' });
        const bricksBuilder = mp.bricks();

        const container = document.getElementById('cardPaymentBrick_container');
        if (container) {
          container.innerHTML = ''; // Limpiar renderizados previos
        }

        // Crear Brick de Pago con Tarjeta (Checkout API Embebido)
        brickControllerRef.current = await bricksBuilder.create('cardPayment', 'cardPaymentBrick_container', {
          initialization: {
            amount: amount,
          },
          customization: {
            paymentMethods: {
              maxInstallments: 1, // Únicamente un pago al contado para simplicidad del LMS
            },
            visual: {
              style: {
                theme: 'flat', // Tema estético moderno
              }
            }
          },
          callbacks: {
            onReady: () => {
              if (active) setLoading(false);
            },
            onSubmit: async (formData: unknown) => {
              try {
                interface SubmitPayload {
                  token: string;
                  issuer_id: string;
                  payment_method_id: string;
                  installments: number;
                }
                const data = formData as SubmitPayload;
                const res = await fetch('/api/payments/mercadopago/process-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    token: data.token,
                    issuer_id: data.issuer_id,
                    payment_method_id: data.payment_method_id,
                    installments: data.installments,
                    courseIds,
                  }),
                });

                const result = await res.json();
                if (!res.ok) {
                  throw new Error(result.error || 'El pago fue rechazado por el banco.');
                }

                // Redirigir al dashboard al finalizar con éxito (vaciar carrito en la página antes de redirigir)
                window.location.href = `/dashboard?success=true`;
              } catch (err) {
                const errorObj = err as { message?: string };
                alert(errorObj.message || 'Error al procesar el pago con la tarjeta.');
              }
            },
            onError: (error: unknown) => {
              console.error('[MercadoPago Brick Error]', error);
              if (active) {
                setErrorMsg('Error en el formulario de cobro. Revisa las llaves de credencial.');
                setLoading(false);
              }
            },
          },
        });
      } catch (err) {
        console.error(err);
        if (active) {
          setErrorMsg('Error al conectar con Mercado Pago.');
          setLoading(false);
        }
      }
    };

    loadMp();

    return () => {
      active = false;
      if (brickControllerRef.current) {
        brickControllerRef.current.unmount();
      }
    };
  }, [courseIds, amount]);

  return (
    <div className="space-y-4">
      {loading && (
        <div className="flex flex-col items-center justify-center p-8 border border-[var(--color-border)] rounded-2xl bg-[var(--color-surface)] space-y-3">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
          <span className="text-xs text-[var(--color-text-secondary)]">Cargando pasarela de tarjeta...</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 border border-red-500/25 bg-red-500/10 text-xs text-red-600 dark:text-red-400 rounded-xl">
          {errorMsg}
        </div>
      )}
      <div id="cardPaymentBrick_container"></div>
    </div>
  );
}
