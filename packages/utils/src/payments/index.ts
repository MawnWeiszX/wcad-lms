// ============================================
// WCAD LMS — Módulo de Pasarelas de Pago
// ============================================

// Tipo de cambio por defecto para PayPal (PEN -> USD)
const PAYPAL_EXCHANGE_RATE = Number(process.env.PAYPAL_EXCHANGE_RATE || '3.75');

// ── MERCADO PAGO HELPERS ──────────────────────────────────────────

/**
 * Crea una preferencia en Mercado Pago para usar con Checkout Pro o el Brick de Card.
 */
export async function createMercadoPagoPreference(params: {
  courseId: string;
  courseTitle: string;
  amount: number;
  studentId: string;
  studentEmail: string;
}) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado en variables de entorno');
  }

  // URL del webhook IPN de confirmación
  const classUrl = process.env.NEXT_PUBLIC_CLASS_URL || 'http://localhost:3000';
  const notificationUrl = `${classUrl}/api/payments/mercadopago/webhook`;

  const response = await fetch('https://api.mercadopago.com/v1/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      items: [
        {
          id: params.courseId,
          title: params.courseTitle,
          quantity: 1,
          unit_price: params.amount,
          currency_id: 'PEN', // Únicamente Soles
        }
      ],
      payer: {
        email: params.studentEmail,
      },
      metadata: {
        course_id: params.courseId,
        student_id: params.studentId,
      },
      notification_url: notificationUrl,
      back_urls: {
        success: `${classUrl}/courses/${params.courseId}`,
        failure: `${classUrl}/courses/${params.courseId}`,
        pending: `${classUrl}/courses/${params.courseId}`,
      },
      auto_return: 'approved',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Error en Mercado Pago: ${JSON.stringify(errorData)}`);
  }

  return response.json(); // Retorna la preferencia (id, init_point, etc.)
}

/**
 * Obtiene los detalles de un pago específico de Mercado Pago.
 */
export async function getMercadoPagoPayment(paymentId: string) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado');
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Error al consultar pago en MP: ${JSON.stringify(errorData)}`);
  }

  return response.json();
}


// ── PAYPAL HELPERS ────────────────────────────────────────────────

// Base URL según el entorno (Sandbox por defecto si no es producción)
const PAYPAL_API_BASE = process.env.NODE_ENV === 'production' && !process.env.PAYPAL_USE_SANDBOX
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

/**
 * Genera un Access Token para autenticarse con las APIs de PayPal.
 */
async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Credenciales de PayPal no configuradas');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Error auth PayPal: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Crea una orden de pago en PayPal convirtiendo el monto de PEN a USD.
 */
export async function createPayPalOrder(params: {
  courseId: string;
  courseTitle: string;
  amountInPen: number;
  studentId: string;
}) {
  const token = await getPayPalAccessToken();

  // Convertir soles a dólares ya que PayPal no soporta PEN de forma nativa
  const amountInUsd = Math.round((params.amountInPen / PAYPAL_EXCHANGE_RATE) * 100) / 100;

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: params.courseId,
          amount: {
            currency_code: 'USD',
            value: amountInUsd.toFixed(2),
          },
          description: params.courseTitle,
          custom_id: JSON.stringify({
            course_id: params.courseId,
            student_id: params.studentId,
          }),
        }
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Error al crear orden en PayPal: ${JSON.stringify(errorData)}`);
  }

  return response.json();
}

/**
 * Captura un pago aprobado previamente en PayPal.
 */
export async function capturePayPalOrder(orderId: string) {
  const token = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Error al capturar orden en PayPal: ${JSON.stringify(errorData)}`);
  }

  return response.json();
}

/**
 * Obtiene los detalles de una orden de PayPal por su ID para verificar su estado real.
 */
export async function getPayPalOrder(orderId: string) {
  const token = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Error al consultar orden en PayPal: ${JSON.stringify(errorData)}`);
  }

  return response.json();
}
