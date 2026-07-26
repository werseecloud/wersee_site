import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { format, formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Fingerprint,
  KeyRound,
  Loader2,
  Pencil,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import {
  getPasskeyErrorMessage,
  isPasskeyCancellation,
  isPasskeySupported,
  sortPasskeys,
  type UserPasskey,
} from '../../../lib/passkeys';

type PasskeysSettingsProps = {
  user: User | null;
};

type DeleteState = {
  passkeyId: string;
  name: string;
} | null;

const MAX_FRIENDLY_NAME_LENGTH = 120;

const formatAddedDate = (value: string) =>
  `Added on ${format(new Date(value), 'MMMM d, yyyy', { locale: enUS })}`;

const formatLastUsedDate = (value?: string | null) =>
  value
    ? `Last used ${formatDistanceToNow(new Date(value), { addSuffix: true, locale: enUS })}`
    : 'Not used yet';

const isSsoOnlyAccount = (user: User | null) => {
  const providers = user?.app_metadata?.providers;
  if (Array.isArray(providers)) {
    return providers.length > 0 && providers.every((provider) => provider === 'sso');
  }

  return user?.app_metadata?.provider === 'sso';
};

export const PasskeysSettings = ({ user }: PasskeysSettingsProps) => {
  const [passkeys, setPasskeys] = useState<UserPasskey[]>([]);
  const [loadingPasskeys, setLoadingPasskeys] = useState(false);
  const [creatingPasskey, setCreatingPasskey] = useState(false);
  const [updatingPasskeyId, setUpdatingPasskeyId] = useState<string | null>(null);
  const [deletingPasskeyId, setDeletingPasskeyId] = useState<string | null>(null);
  const [editingPasskeyId, setEditingPasskeyId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteState, setDeleteState] = useState<DeleteState>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  const passkeysSupported = isPasskeySupported();
  const sortedPasskeys = useMemo(() => sortPasskeys(passkeys), [passkeys]);
  const activeEditPasskey = passkeys.find((passkey) => passkey.id === editingPasskeyId);
  const trimmedEditingName = editingName.trim();
  const renameIsInvalid =
    !trimmedEditingName ||
    trimmedEditingName.length > MAX_FRIENDLY_NAME_LENGTH ||
    trimmedEditingName === (activeEditPasskey?.friendly_name ?? 'Passkey');

  const setSafeStatus = (message: string | null) => {
    if (!mountedRef.current) return;
    setStatusMessage(message);
  };

  const setSafeError = (message: string | null) => {
    if (!mountedRef.current) return;
    setErrorMessage(message);
  };

  const loadPasskeys = useCallback(async () => {
    if (!user) {
      setPasskeys([]);
      return;
    }

    setLoadingPasskeys(true);
    setSafeError(null);

    try {
      const { data, error } = await supabase.auth.passkey.list();
      if (error) throw error;
      if (!mountedRef.current) return;
      setPasskeys(sortPasskeys(data ?? []));
    } catch (error: unknown) {
      setSafeError(getPasskeyErrorMessage(error));
    } finally {
      if (mountedRef.current) {
        setLoadingPasskeys(false);
      }
    }
  }, [user]);

  useEffect(() => {
    mountedRef.current = true;
    loadPasskeys();

    return () => {
      mountedRef.current = false;
    };
  }, [loadPasskeys]);

  useEffect(() => {
    if (!deleteState) return;

    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!deleteState || deletingPasskeyId) return;

      if (event.key === 'Escape') {
        setDeleteState(null);
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        document.querySelectorAll<HTMLElement>('[data-passkey-delete-modal] button:not(:disabled)'),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [deleteState, deletingPasskeyId]);

  const canRegisterPasskey = () => {
    if (!user) {
      setSafeError('You must be logged in to add a passkey.');
      return false;
    }

    if (user.is_anonymous) {
      setSafeError('Link a confirmed email address or phone number to your account before adding a passkey.');
      return false;
    }

    if (!user.email_confirmed_at && !user.phone_confirmed_at) {
      setSafeError('Confirm your email address or phone number before adding a passkey.');
      return false;
    }

    if (isSsoOnlyAccount(user)) {
      setSafeError('This account cannot register passkeys right now. Use another available sign-in method.');
      return false;
    }

    if (!passkeysSupported) {
      setSafeError('Passkeys require a modern browser and a secure HTTPS connection. Localhost still works for development.');
      return false;
    }

    return true;
  };

  const handleCreatePasskey = async () => {
    if (creatingPasskey || !canRegisterPasskey()) return;

    setCreatingPasskey(true);
    setSafeError(null);
    setSafeStatus(null);

    try {
      const { data, error } = await supabase.auth.registerPasskey();
      if (error) throw error;

      await loadPasskeys();
      setSafeStatus(
        data?.friendly_name
          ? `Passkey added successfully: ${data.friendly_name}. You can now use it to sign in to Wersee.`
          : 'Passkey added successfully. You can now use it to sign in to Wersee.',
      );

      if (data?.id && mountedRef.current) {
        setEditingPasskeyId(data.id);
        setEditingName(data.friendly_name ?? 'Passkey');
      }
    } catch (error: unknown) {
      const message = getPasskeyErrorMessage(error);
      if (isPasskeyCancellation(error)) {
        setSafeStatus(message);
      } else {
        setSafeError(message);
      }
    } finally {
      if (mountedRef.current) {
        setCreatingPasskey(false);
      }
    }
  };

  const startRename = (passkey: UserPasskey) => {
    setEditingPasskeyId(passkey.id);
    setEditingName(passkey.friendly_name ?? 'Passkey');
    setSafeError(null);
    setSafeStatus(null);
  };

  const cancelRename = () => {
    setEditingPasskeyId(null);
    setEditingName('');
  };

  const handleRenamePasskey = async (passkeyId: string) => {
    if (renameIsInvalid || updatingPasskeyId) return;

    setUpdatingPasskeyId(passkeyId);
    setSafeError(null);
    setSafeStatus(null);

    try {
      const { data, error } = await supabase.auth.passkey.update({
        passkeyId,
        friendlyName: trimmedEditingName,
      });
      if (error) throw error;

      setPasskeys((current) =>
        sortPasskeys(
          current.map((passkey) =>
            passkey.id === passkeyId ? { ...passkey, ...(data ?? {}), friendly_name: trimmedEditingName } : passkey,
          ),
        ),
      );
      cancelRename();
      setSafeStatus('Name updated.');
    } catch (error: unknown) {
      setSafeError(getPasskeyErrorMessage(error));
    } finally {
      if (mountedRef.current) {
        setUpdatingPasskeyId(null);
      }
    }
  };

  const handleDeletePasskey = async () => {
    if (!deleteState || deletingPasskeyId) return;

    setDeletingPasskeyId(deleteState.passkeyId);
    setSafeError(null);
    setSafeStatus(null);

    try {
      const { error } = await supabase.auth.passkey.delete({
        passkeyId: deleteState.passkeyId,
      });
      if (error) throw error;

      setPasskeys((current) => current.filter((passkey) => passkey.id !== deleteState.passkeyId));
      setDeleteState(null);
      setSafeStatus('Passkey revoked.');
    } catch (error: unknown) {
      setSafeError(getPasskeyErrorMessage(error));
    } finally {
      if (mountedRef.current) {
        setDeletingPasskeyId(null);
      }
    }
  };

  const renderCreateButton = (label: string, fullWidth = false) => (
    <button
      type="button"
      onClick={handleCreatePasskey}
      disabled={creatingPasskey || !passkeysSupported}
      className={`${fullWidth ? 'w-full' : 'w-full sm:w-auto'} min-h-11 px-4 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
      aria-label={label}
    >
      {creatingPasskey ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
      {creatingPasskey ? 'Creating passkey...' : label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div aria-live="polite" className="sr-only">
        {statusMessage || errorMessage || ''}
      </div>

      <div className="bg-[#141414] border border-white/5 rounded-2xl p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white">
                <Fingerprint className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Passkeys</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">
              Use your fingerprint, face recognition, device passcode, or security key to sign in to Wersee securely.
            </p>
          </div>
          {renderCreateButton('Create new passkey')}
        </div>

        {!passkeysSupported && (
          <div className="mt-5 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-300" />
            <p>
              Passkeys require a modern browser and a secure HTTPS connection. Localhost and 127.0.0.1 still work for development.
            </p>
          </div>
        )}

        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-5 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-300 flex items-start gap-3"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <p>{statusMessage}</p>
            </motion.div>
          )}

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-5 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-300 flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p>{errorMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loadingPasskeys ? (
        <div className="grid grid-cols-1 gap-4">
          {[0, 1].map((item) => (
            <div key={item} className="bg-[#141414] border border-white/5 rounded-2xl p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/10" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-1/3 bg-white/10 rounded" />
                  <div className="h-3 w-2/3 bg-white/5 rounded" />
                  <div className="h-3 w-1/2 bg-white/5 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : sortedPasskeys.length === 0 ? (
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-gray-300 shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">No passkeys yet</h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Add a passkey to sign in faster and with better protection without using your password every time.
                </p>
              </div>
            </div>
            <div className="md:w-56">{renderCreateButton('Create first passkey', true)}</div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              'Passkeys zijn phishingbestendig.',
              'Wersee does not receive fingerprint or face data.',
              'Biometrische controle gebeurt lokaal door je apparaat of passwordmanager.',
            ].map((item) => (
              <div key={item} className="p-3 bg-black/40 border border-white/5 rounded-xl text-xs text-gray-400 leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sortedPasskeys.map((passkey) => {
            const name = passkey.friendly_name?.trim() || 'Passkey';
            const isEditing = editingPasskeyId === passkey.id;
            const isUpdating = updatingPasskeyId === passkey.id;
            const isDeleting = deletingPasskeyId === passkey.id;

            return (
              <motion.div
                key={passkey.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#141414] border border-white/5 rounded-2xl p-4 md:p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-gray-200 shrink-0">
                      <Fingerprint className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      {isEditing ? (
                        <div className="space-y-3">
                          <label className="sr-only" htmlFor={`passkey-name-${passkey.id}`}>
                            Passkeynaam
                          </label>
                          <input
                            id={`passkey-name-${passkey.id}`}
                            type="text"
                            value={editingName}
                            maxLength={MAX_FRIENDLY_NAME_LENGTH}
                            onChange={(event) => setEditingName(event.target.value)}
                            className="w-full min-h-11 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                            autoFocus
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRenamePasskey(passkey.id)}
                              disabled={renameIsInvalid || isUpdating}
                              className="min-h-11 px-4 py-2 bg-white text-black rounded-xl text-sm font-bold hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                              Opslaan
                            </button>
                            <button
                              type="button"
                              onClick={cancelRename}
                              disabled={isUpdating}
                              className="min-h-11 px-4 py-2 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50"
                            >
                              Annuleren
                            </button>
                            <span className={`text-xs ${trimmedEditingName.length > MAX_FRIENDLY_NAME_LENGTH ? 'text-red-300' : 'text-gray-500'}`}>
                              {trimmedEditingName.length}/{MAX_FRIENDLY_NAME_LENGTH}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-white font-bold truncate">{name}</h4>
                            {!passkey.last_used_at && (
                              <span className="px-2 py-1 bg-white/10 text-gray-300 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                Not used yet
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-x-4 text-xs text-gray-500">
                            <span>{formatAddedDate(passkey.created_at)}</span>
                            <span>{formatLastUsedDate(passkey.last_used_at)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => startRename(passkey)}
                        className="min-h-11 min-w-11 px-3 py-2 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 flex items-center justify-center gap-2"
                        aria-label={`Naam wijzigen voor ${name}`}
                      >
                        <Pencil className="w-4 h-4" />
                        <span className="hidden sm:inline">Naam wijzigen</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteState({ passkeyId: passkey.id, name })}
                        disabled={isDeleting}
                        className="min-h-11 min-w-11 px-3 py-2 bg-red-500/10 text-red-300 border border-red-500/20 rounded-xl text-sm font-medium hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-300/40 disabled:opacity-50 flex items-center justify-center gap-2"
                        aria-label={`Passkey intrekken voor ${name}`}
                      >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        <span className="hidden sm:inline">Intrekken</span>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {deleteState && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="passkey-delete-title"
            aria-describedby="passkey-delete-description"
            data-passkey-delete-modal
          >
            <motion.div
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
              className="w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 id="passkey-delete-title" className="text-xl font-bold text-white">
                    Passkey intrekken?
                  </h3>
                  <p id="passkey-delete-description" className="text-sm text-gray-400 mt-2 leading-relaxed">
                    You will no longer be able to sign in to Wersee with this passkey. Other passkeys and login methods remain available.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteState(null)}
                  disabled={!!deletingPasskeyId}
                  className="min-h-11 min-w-11 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-sm text-gray-300 mb-5">
                {deleteState.name}
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  ref={cancelButtonRef}
                  onClick={() => setDeleteState(null)}
                  disabled={!!deletingPasskeyId}
                  className="min-h-11 px-4 py-2 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50"
                >
                  Annuleren
                </button>
                <button
                  type="button"
                  onClick={handleDeletePasskey}
                  disabled={!!deletingPasskeyId}
                  className="min-h-11 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300/50 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deletingPasskeyId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Passkey intrekken
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
