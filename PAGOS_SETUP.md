# Guía de Configuración — Sistema de Pagos WCAD LMS

Esta guía detalla los pasos para poner en marcha, configurar y probar el sistema de pagos integrado (Mercado Pago, PayPal, Yape y Plin) de **wcad-lms**.

---

## 1. Configuración de Base de Datos y Storage (Supabase)

### A. Estructura Relacional (Tabla Puente)
El sistema soporta compras multi-curso (Carrito). Las transacciones y las inscripciones se vinculan a través de la tabla `transaction_courses`. Si necesitas inicializar la base de datos, ejecuta la migración SQL disponible en el repositorio.

### B. Contenedor de Comprobantes (Storage Bucket)
Para permitir que los alumnos suban vouchers de Yape y Plin, debes crear un contenedor público de almacenamiento en Supabase. Ejecuta el siguiente bloque SQL en el **SQL Editor de Supabase**:

```sql
-- 1. Crear el bucket "vouchers"
INSERT INTO storage.buckets (id, name, public)
VALUES ('vouchers', 'vouchers', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Permitir lectura pública de vouchers
CREATE POLICY "Permitir lectura pública de vouchers" ON storage.objects
  FOR SELECT USING (bucket_id = 'vouchers');

-- 3. Permitir subida de vouchers a alumnos autenticados
CREATE POLICY "Permitir subida de vouchers a alumnos autenticados" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vouchers');
```

---

## 2. Variables de Entorno (`.env.local`)

Crea o actualiza el archivo `.env.local` en las raíces correspondientes (`apps/class/.env.local` y `apps/portal/.env.local`) basándote en la plantilla `.env.example`:

```bash
# Mercado Pago (Credenciales de Pruebas o Producción)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx

# PayPal (Credenciales Sandbox o Live)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=AXXXXXXXXXX_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
PAYPAL_CLIENT_SECRET=EXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Datos para Pagos Manuales (Yape / Plin)
NEXT_PUBLIC_YAPE_NUMBER=987654321
NEXT_PUBLIC_YAPE_HOLDER=WCAD SAC
NEXT_PUBLIC_PLIN_NUMBER=987654321
NEXT_PUBLIC_PLIN_HOLDER=WCAD SAC
```

*Nota: Si las credenciales de Mercado Pago o PayPal no se especifican en el entorno local, los botones correspondientes se deshabilitarán automáticamente en la interfaz del alumno mostrando la etiqueta **"Próximamente"**.*

---

## 3. Integración de Mercado Pago (Automático)

El sistema utiliza la pasarela integrada de Mercado Pago (SDK REST + Mercado Pago Card Brick en el frontend).

### A. Obtener Credenciales
1. Entra a [Mercado Pago Developers](https://developers.mercadopago.com.pe) e inicia sesión con tu cuenta de Mercado Pago.
2. Ve a **Tus Integraciones** y crea una aplicación llamada `wcad-lms`.
3. Dirígete a la sección **Credenciales** (de Pruebas o de Producción).
4. Copia la **Public Key** en `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` y el **Access Token** en `MERCADOPAGO_ACCESS_TOKEN`.

### B. Configuración de Webhook (IPN)
Para que las compras con tarjeta se procesen y activen el curso de forma instantánea de manera asíncrona:
1. En el panel de desarrollador de Mercado Pago, ve a **Webhooks / Notificaciones IPN**.
2. Añade un endpoint configurando la URL de tu backend:
   `https://<tu-dominio-produccion-o-ngrok>/api/payments/mercadopago/webhook`
3. En los eventos a escuchar, selecciona **"Pagos" (Payments)**.
4. Asegúrate de configurar la misma URL para recibir las notificaciones de producción y de sandbox.

### C. Tarjetas de Prueba
Usa los números de tarjeta ficticios provistos por Mercado Pago para realizar simulaciones de éxito y rechazo:
* [Tarjetas de prueba de Mercado Pago](https://www.mercadopago.com.pe/developers/es/docs/checkout-bricks/card-brick/integration-test/test-cards)

---

## 4. Integración de PayPal (Automático)

El checkout integra los botones inteligentes oficiales de PayPal (`@paypal/react-paypal-js`).

### A. Obtener Credenciales
1. Ve al [Portal de Desarrollador de PayPal](https://developer.paypal.com).
2. Entra a **Apps & Credentials** y haz clic en **Create App** (bajo la sección REST API).
3. Obtén tu **Client ID** (para `NEXT_PUBLIC_PAYPAL_CLIENT_ID`) y tu **Secret Key** (para `PAYPAL_CLIENT_SECRET`).

### B. Configuración de Webhook
Para sincronizar las aprobaciones asíncronas y asegurar la inscripción en segundo plano:
1. Dentro de tu App en el portal de PayPal, deslízate hasta la sección **Webhooks** y haz clic en **Add Webhook**.
2. Ingresa la URL de webhook del LMS:
   `https://<tu-dominio-produccion-o-ngrok>/api/payments/paypal/webhook`
3. En la lista de eventos, selecciona exclusivamente:
   * **`PAYMENT.CAPTURE.COMPLETED`**
   * **`CHECKOUT.ORDER.APPROVED`**
4. Guarda los cambios.

---

## 5. Integración de Yape y Plin (Manual)

### A. Flujo del Alumno
1. En la página de `/checkout`, al seleccionar **Yape** o **Plin**, se despliega una tarjeta con los datos bancarios y el número móvil a depositar (los cuales se inyectan dinámicamente desde el archivo de configuración `.env.local`).
2. El alumno realiza la transferencia, toma una captura y sube la imagen mediante el selector de archivos.
3. Al dar clic a **"Enviar comprobante"**, la transacción se guarda con estado `pending`, se crea la relación con los cursos en la tabla puente, y la imagen se sube a Supabase Storage.

### B. Panel de Aprobación del Administrador
Los profesores y administradores pueden gestionar las solicitudes desde el Panel de Control:
1. Ingresa a la app `portal` en `http://localhost:3001/payments` (o en la pestaña **"Pagos"** de la barra lateral).
2. Se listarán todos los vouchers enviados en estado `pending`.
3. Haz clic sobre la miniatura del voucher para ampliarlo.
4. **Aprobar**: Da de alta automáticamente las inscripciones (`enrollments`) del alumno a los cursos comprados.
5. **Rechazar**: Abre un modal para introducir el motivo de rechazo, actualiza la transacción a `rejected` y notifica al usuario.
