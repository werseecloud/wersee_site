import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { toast, type ExternalToast } from 'sonner';
import { AlertTriangle, CheckCircle2, Info, Loader2, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';
type DialogVariant = 'danger' | 'warning' | 'info';

type ConfirmOptions = {
  title?: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
};

type InputOptions = ConfirmOptions & {
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  inputType?: React.HTMLInputTypeAttribute;
  required?: boolean;
  validate?: (value: string) => string | null;
};

type ErrorOptions = {
  title?: string;
  description: React.ReactNode;
};

type DialogState =
  | ({ kind: 'confirm'; resolve: (value: boolean) => void } & Required<Pick<ConfirmOptions, 'title' | 'confirmText' | 'cancelText' | 'variant'>> & Pick<ConfirmOptions, 'description'>)
  | ({ kind: 'input'; resolve: (value: string | null) => void; value: string; error: string | null } & Required<Pick<InputOptions, 'title' | 'confirmText' | 'cancelText' | 'variant' | 'required'>> & Pick<InputOptions, 'description' | 'label' | 'placeholder' | 'inputType' | 'validate'>)
  | ({ kind: 'error'; resolve: () => void; title: string } & Pick<ErrorOptions, 'description'>);

const inferToastVariant = (message: React.ReactNode): ToastVariant => {
  const text = String(message).toLowerCase();
  if (/(failed|error|invalid|denied|insufficient|cannot|could not|please|required|must|exceeds)/.test(text)) return 'error';
  if (/(success|saved|copied|sent|complete|completed|created|linked|installed|redeemed|processed|updated)/.test(text)) return 'success';
  if (/(warning|irreversible|careful|check)/.test(text)) return 'warning';
  return 'info';
};

export const appToast = (message: React.ReactNode, variant: ToastVariant = inferToastVariant(message), options?: ExternalToast) => {
  if (variant === 'success') return toast.success(message, options);
  if (variant === 'error') return toast.error(message, options);
  if (variant === 'warning') return toast.warning(message, options);
  return toast.info(message, options);
};

export const appLoadingToast = (message: React.ReactNode, options?: ExternalToast) => toast.loading(message, options);
export const dismissToast = (id?: string | number) => toast.dismiss(id);

const bridge: {
  confirm?: (options: ConfirmOptions) => Promise<boolean>;
  input?: (options: InputOptions) => Promise<string | null>;
  error?: (options: ErrorOptions) => Promise<void>;
} = {};

const defaultConfirm = (options: ConfirmOptions): Required<Pick<ConfirmOptions, 'title' | 'confirmText' | 'cancelText' | 'variant'>> & Pick<ConfirmOptions, 'description'> => ({
  title: options.title ?? (options.variant === 'danger' ? 'Confirm destructive action' : 'Confirm action'),
  description: options.description,
  confirmText: options.confirmText ?? 'Confirm',
  cancelText: options.cancelText ?? 'Cancel',
  variant: options.variant ?? 'info',
});

export const confirmAction = (options: ConfirmOptions) => bridge.confirm?.(options) ?? Promise.resolve(false);

export const destructiveAction = (options: Omit<ConfirmOptions, 'variant'>) =>
  confirmAction({ ...options, variant: 'danger', confirmText: options.confirmText ?? 'Delete' });

export const requestInput = (options: InputOptions) => bridge.input?.(options) ?? Promise.resolve(null);

export const showErrorModal = (options: ErrorOptions) => bridge.error?.(options) ?? Promise.resolve();

type FeedbackContextValue = {
  toast: typeof appToast;
  loading: typeof appLoadingToast;
  dismiss: typeof dismissToast;
  confirm: typeof confirmAction;
  destructive: typeof destructiveAction;
  input: typeof requestInput;
  error: typeof showErrorModal;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export const useFeedback = () => {
  const value = useContext(FeedbackContext);
  if (!value) throw new Error('useFeedback must be used within FeedbackProvider');
  return value;
};

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  useEffect(() => {
    bridge.confirm = (options) =>
      new Promise<boolean>((resolve) => {
        setDialog({ kind: 'confirm', ...defaultConfirm(options), resolve });
      });

    bridge.input = (options) =>
      new Promise<string | null>((resolve) => {
        setDialog({
          kind: 'input',
          ...defaultConfirm(options),
          confirmText: options.confirmText ?? 'Save',
          label: options.label,
          placeholder: options.placeholder,
          inputType: options.inputType ?? 'text',
          required: options.required ?? false,
          validate: options.validate,
          value: options.defaultValue ?? '',
          error: null,
          resolve,
        });
      });

    bridge.error = (options) =>
      new Promise<void>((resolve) => {
        setDialog({
          kind: 'error',
          title: options.title ?? 'Something went wrong',
          description: options.description,
          resolve,
        });
      });

    return () => {
      bridge.confirm = undefined;
      bridge.input = undefined;
      bridge.error = undefined;
    };
  }, []);

  const contextValue = useMemo<FeedbackContextValue>(
    () => ({
      toast: appToast,
      loading: appLoadingToast,
      dismiss: dismissToast,
      confirm: confirmAction,
      destructive: destructiveAction,
      input: requestInput,
      error: showErrorModal,
    }),
    [],
  );

  const closeDialog = (value?: boolean | string | null) => {
    if (!dialog) return;
    if (dialog.kind === 'confirm') dialog.resolve(Boolean(value));
    if (dialog.kind === 'input') dialog.resolve(typeof value === 'string' ? value : null);
    if (dialog.kind === 'error') dialog.resolve();
    setDialog(null);
  };

  const submitInput = () => {
    if (!dialog || dialog.kind !== 'input') return;
    const value = dialog.value.trim();
    if (dialog.required && !value) {
      setDialog({ ...dialog, error: 'This field is required.' });
      return;
    }
    const validationError = dialog.validate?.(value) ?? null;
    if (validationError) {
      setDialog({ ...dialog, error: validationError });
      return;
    }
    closeDialog(value);
  };

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#141414] p-6 text-white shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className={`rounded-2xl p-3 ${
                dialog.kind === 'error' || dialog.variant === 'danger'
                  ? 'bg-red-500/10 text-red-400'
                  : dialog.variant === 'warning'
                    ? 'bg-yellow-500/10 text-yellow-400'
                    : 'bg-blue-500/10 text-blue-400'
              }`}>
                {dialog.kind === 'confirm' || dialog.kind === 'input' ? (
                  dialog.variant === 'info' ? <Info className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
              </div>
              <button
                type="button"
                onClick={() => closeDialog(null)}
                className="rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h2 className="mb-2 text-xl font-bold">{dialog.title}</h2>
            <div className="mb-6 text-sm leading-relaxed text-white/60">{dialog.description}</div>

            {dialog.kind === 'input' && (
              <div className="mb-6">
                {dialog.label && <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/50">{dialog.label}</label>}
                <input
                  autoFocus
                  type={dialog.inputType}
                  value={dialog.value}
                  placeholder={dialog.placeholder}
                  onChange={(event) => setDialog({ ...dialog, value: event.target.value, error: null })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') submitInput();
                  }}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-indigo-500"
                />
                {dialog.error && <p className="mt-2 text-xs font-semibold text-red-400">{dialog.error}</p>}
              </div>
            )}

            <div className="flex gap-3">
              {dialog.kind !== 'error' && (
                <button
                  type="button"
                  onClick={() => closeDialog(null)}
                  className="flex-1 rounded-xl bg-white/5 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
                >
                  {dialog.cancelText}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (dialog.kind === 'confirm') closeDialog(true);
                  if (dialog.kind === 'input') submitInput();
                  if (dialog.kind === 'error') closeDialog();
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                  dialog.kind === 'error' || dialog.variant === 'danger'
                    ? 'bg-red-600 text-white hover:bg-red-500'
                    : dialog.variant === 'warning'
                      ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                      : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {dialog.kind === 'error' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Got it
                  </>
                ) : (
                  dialog.confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
};
