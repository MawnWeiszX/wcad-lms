'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { createClient } from '@wcad/utils/supabase/client';
import { Check, X, Eye, Loader2, Calendar, RefreshCw, History, Clock, FileText, CheckCircle2 } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  voucher_url: string | null;
  rejection_reason: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
  transaction_courses: {
    courses: {
      id: string;
      title: string;
    } | null;
  }[] | null;
}

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  
  // Modales
  const [activeVoucher, setActiveVoucher] = useState<string | null>(null);
  const [rejectingTx, setRejectingTx] = useState<Transaction | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const supabase = createClient();

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          payment_method,
          status,
          voucher_url,
          rejection_reason,
          created_at,
          profiles:student_id(full_name, email),
          transaction_courses(
            courses(id, title)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions((data as unknown as Transaction[]) || []);
    } catch (err) {
      console.error('[Fetch Payments Error]', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleApprove = async (txId: string) => {
    if (!confirm('¿Estás seguro de que deseas aprobar este pago? Esto activará el acceso del alumno a todos los cursos comprados.')) {
      return;
    }

    try {
      setActionLoading(txId);
      const res = await fetch('/api/payments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: txId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al aprobar el pago');
      }

      // Actualizar localmente la transacción
      setTransactions((prev) =>
        prev.map((t) => (t.id === txId ? { ...t, status: 'approved' } : t))
      );
      alert('Pago aprobado con éxito. Acceso al curso activado.');
    } catch (err) {
      const errorObj = err as { message?: string };
      alert(errorObj.message || 'Ocurrió un error.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingTx) return;

    try {
      setActionLoading(rejectingTx.id);
      const res = await fetch('/api/payments/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: rejectingTx.id,
          rejectionReason: rejectionReason.trim() || 'Comprobante no válido o ilegible',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al rechazar el pago');
      }

      // Actualizar localmente la transacción
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === rejectingTx.id
            ? { ...t, status: 'rejected', rejection_reason: rejectionReason.trim() || 'Comprobante no válido' }
            : t
        )
      );
      setRejectingTx(null);
      setRejectionReason('');
      alert('Pago rechazado y notificado.');
    } catch (err) {
      const errorObj = err as { message?: string };
      alert(errorObj.message || 'Ocurrió un error.');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filtrado de pestañas
  const pendingPayments = transactions.filter(
    (t) => t.status === 'pending' && ['yape', 'plin'].includes(t.payment_method)
  );

  const historyPayments = transactions.filter(
    (t) => t.status !== 'pending'
  );

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case 'yape':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      case 'plin':
        return 'bg-teal-500/10 text-teal-600 dark:text-teal-400';
      case 'mercadopago':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'paypal':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border)] pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Gestión de Pagos</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Verifica comprobantes pendientes o consulta el historial de transacciones
          </p>
        </div>
        <button
          onClick={fetchPayments}
          className="self-start flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-all cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)]">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          <Clock className="h-4 w-4" />
          Pendientes
          {pendingPayments.length > 0 && (
            <span className="ml-1 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs font-bold text-white">
              {pendingPayments.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          <History className="h-4 w-4" />
          Historial de Pagos
          {historyPayments.length > 0 && (
            <span className="ml-1 rounded-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] px-2 py-0.5 text-xs font-semibold text-[var(--color-text-secondary)]">
              {historyPayments.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Cargando transacciones...</p>
        </div>
      ) : activeTab === 'pending' ? (
        /* VISTA PENDIENTES */
        pendingPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center max-w-lg mx-auto">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
            <h3 className="text-lg font-bold text-[var(--color-text)]">¡Todo al día!</h3>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              No hay transferencias de Yape o Plin esperando aprobación en este momento.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {pendingPayments.map((payment) => {
              const student = payment.profiles;
              const courses = (payment.transaction_courses || []).map((tc) => tc.courses?.title || 'Curso');
              
              return (
                <div
                  key={payment.id}
                  className="flex flex-col md:flex-row gap-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all hover:border-[var(--color-primary)]/30 hover:shadow-lg hover:shadow-[var(--color-primary)]/5"
                >
                  {/* Vista previa del Voucher */}
                  <div className="relative h-44 w-full md:w-32 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] flex items-center justify-center group">
                    {payment.voucher_url ? (
                      <>
                        <Image
                          src={payment.voucher_url}
                          alt="Voucher"
                          width={128}
                          height={176}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                        <button
                          onClick={() => setActiveVoucher(payment.voucher_url)}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-semibold text-xs gap-1.5 cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                          Ver voucher
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-[var(--color-text-muted)]">Sin comprobante</span>
                    )}
                  </div>

                  {/* Detalles de la transacción */}
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--color-border)] pb-3">
                      <div>
                        <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${getMethodBadgeClass(payment.payment_method)}`}>
                          {payment.payment_method}
                        </span>
                        <h3 className="font-bold text-base text-[var(--color-text)] mt-1.5">
                          S/ {Number(payment.amount).toFixed(2)}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mt-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(payment.created_at)}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Alumno */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Alumno</h4>
                        <p className="text-sm font-semibold text-[var(--color-text)]">{student?.full_name || 'Estudiante'}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{student?.email || 'Email'}</p>
                      </div>

                      {/* Cursos a inscribir */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Cursos ({courses.length})</h4>
                        <ul className="list-disc pl-4 space-y-0.5 text-xs text-[var(--color-text-secondary)]">
                          {courses.map((title: string, i: number) => (
                            <li key={i} className="line-clamp-1" title={title}>{title}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex md:flex-col justify-end gap-2.5 shrink-0 border-t md:border-t-0 md:border-l border-[var(--color-border)] pt-4 md:pt-0 md:pl-5">
                    <button
                      onClick={() => handleApprove(payment.id)}
                      disabled={actionLoading !== null}
                      className="flex-1 md:w-32 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {actionLoading === payment.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Aprobar
                    </button>
                    <button
                      onClick={() => setRejectingTx(payment)}
                      disabled={actionLoading !== null}
                      className="flex-1 md:w-32 flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 py-2.5 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                      Rechazar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* VISTA HISTORIAL DE PAGOS */
        historyPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center max-w-lg mx-auto">
            <FileText className="h-12 w-12 text-[var(--color-text-muted)] mb-3" />
            <h3 className="text-lg font-bold text-[var(--color-text)]">Historial vacío</h3>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Aún no se han registrado transacciones aprobadas o rechazadas en el sistema.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {historyPayments.map((payment) => {
              const student = payment.profiles;
              const courses = (payment.transaction_courses || []).map((tc) => tc.courses?.title || 'Curso');
              const isManual = ['yape', 'plin'].includes(payment.payment_method);
              
              return (
                <div
                  key={payment.id}
                  className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-primary)]/20 transition-all"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getMethodBadgeClass(payment.payment_method)}`}>
                        {payment.payment_method}
                      </span>
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        payment.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : payment.status === 'rejected'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                      }`}>
                        {payment.status === 'approved' ? 'Aprobado' : payment.status === 'rejected' ? 'Rechazado' : payment.status}
                      </span>
                      <span className="text-[11px] text-[var(--color-text-secondary)] font-semibold">
                        S/ {Number(payment.amount).toFixed(2)}
                      </span>
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        {formatDate(payment.created_at)}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-[var(--color-text)]">
                        {student?.full_name || 'Estudiante'} <span className="font-normal text-[var(--color-text-secondary)]">({student?.email || 'sin email'})</span>
                      </p>
                      <p className="text-[var(--color-text-secondary)] truncate">
                        <strong>Cursos:</strong> {courses.join(', ') || 'Ninguno'}
                      </p>
                      {payment.status === 'rejected' && payment.rejection_reason && (
                        <p className="text-rose-500 italic mt-1 text-[11px]">
                          <strong>Motivo de rechazo:</strong> {payment.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones Historial */}
                  {isManual && payment.voucher_url && (
                    <button
                      onClick={() => setActiveVoucher(payment.voucher_url)}
                      className="shrink-0 flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-all cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Voucher
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Modal Visor de Voucher */}
      {activeVoucher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setActiveVoucher(null)}
        >
          <div className="relative max-w-lg max-h-[85vh] overflow-hidden rounded-2xl bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeVoucher}
              alt="Voucher Zoom"
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />
            <button
              onClick={() => setActiveVoucher(null)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/75 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Motivo de Rechazo */}
      {rejectingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <h3 className="font-bold text-lg text-[var(--color-text)]">Rechazar Pago</h3>
              <button
                onClick={() => { setRejectingTx(null); setRejectionReason(''); }}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleReject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                  Especifica la razón del rechazo:
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ej: Monto incorrecto, captura borrosa, código de operación falso."
                  required
                  rows={4}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] placeholder-[var(--color-text-muted)] resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setRejectingTx(null); setRejectionReason(''); }}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading !== null}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition-all cursor-pointer disabled:opacity-50"
                >
                  {actionLoading === rejectingTx.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirmar Rechazo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
