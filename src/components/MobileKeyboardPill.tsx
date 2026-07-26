import { FormEvent, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUp, Check, Keyboard, Mic, Plus, ScanLine } from 'lucide-react';

type EditableElement = HTMLInputElement | HTMLTextAreaElement | HTMLElement;

const isEditableElement = (target: EventTarget | null): target is EditableElement => {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLTextAreaElement) return !target.disabled && !target.readOnly;
  if (target instanceof HTMLInputElement) {
    return !target.disabled && !target.readOnly && !['button', 'checkbox', 'file', 'hidden', 'radio', 'range', 'reset', 'submit'].includes(target.type);
  }
  return target.isContentEditable;
};

const inputLabel = (element: EditableElement) =>
  element.getAttribute('aria-label') ||
  element.getAttribute('placeholder') ||
  element.closest('label')?.textContent?.trim() ||
  'Aan het typen';

const elementValue = (element: EditableElement) => {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) return element.value;
  return element.textContent || '';
};

const setElementValue = (element: EditableElement, value: string) => {
  if (element instanceof HTMLInputElement) {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(element, value);
  } else if (element instanceof HTMLTextAreaElement) {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set?.call(element, value);
  } else {
    element.textContent = value;
  }
  element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
};

export function MobileKeyboardPill() {
  const [activeElement, setActiveElement] = useState<EditableElement | null>(null);
  const [draft, setDraft] = useState('');
  const [committed, setCommitted] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const activeElementRef = useRef<EditableElement | null>(null);
  const proxyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 767px), (pointer: coarse)');
    const viewport = window.visualViewport;
    const updateViewport = () => {
      if (!viewport) return setKeyboardInset(0);
      setKeyboardInset(Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop));
    };
    const handleFocusIn = (event: FocusEvent) => {
      if (!mobileQuery.matches || !isEditableElement(event.target)) return;
      if (event.target instanceof HTMLElement && event.target.dataset.mobileKeyboardProxy === 'true') return;
      activeElementRef.current = event.target;
      setActiveElement(event.target);
      setDraft(elementValue(event.target));
      setCommitted(false);
      window.requestAnimationFrame(updateViewport);

      if (event.target.dataset.mobileKeyboardTarget === 'chat') {
        window.requestAnimationFrame(() => proxyInputRef.current?.focus({ preventScroll: true }));
      }
    };
    const handleFocusOut = () => {
      window.setTimeout(() => {
        if (!isEditableElement(document.activeElement)) {
          activeElementRef.current = null;
          setActiveElement(null);
        }
        updateViewport();
      }, 80);
    };
    const handleInput = (event: Event) => {
      if (event.target !== activeElementRef.current || !isEditableElement(event.target)) return;
      setDraft(elementValue(event.target));
      setCommitted(false);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    document.addEventListener('input', handleInput);
    viewport?.addEventListener('resize', updateViewport);
    viewport?.addEventListener('scroll', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      document.removeEventListener('input', handleInput);
      viewport?.removeEventListener('resize', updateViewport);
      viewport?.removeEventListener('scroll', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  const closeKeyboard = () => {
    proxyInputRef.current?.blur();
    activeElement?.blur();
    activeElementRef.current = null;
    setActiveElement(null);
  };

  const isChatTarget = activeElement?.dataset.mobileKeyboardTarget === 'chat';
  const isPasswordTarget = activeElement instanceof HTMLInputElement && activeElement.type === 'password';
  const visibleDraft = isPasswordTarget ? '•'.repeat(draft.length) : draft;

  const commitDraft = (event?: FormEvent) => {
    event?.preventDefault();
    if (!activeElement) return;
    setElementValue(activeElement, draft);
    setCommitted(true);
    if (isChatTarget && draft.trim()) {
      window.setTimeout(() => {
        activeElement.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          bubbles: true,
          cancelable: true,
        }));
        setDraft('');
      }, 0);
    }
    window.setTimeout(() => setCommitted(false), 1400);
  };

  const triggerChatControl = (label: string) => {
    const composer = activeElement?.closest('.chat-composer');
    const button = composer?.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
    button?.click();
  };

  return (
    <AnimatePresence>
      {activeElement && (
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 430, damping: 32 }}
          className="pointer-events-none fixed left-1/2 z-[10000] w-[min(92vw,420px)] -translate-x-1/2 px-2 md:hidden"
          style={{ bottom: `calc(${Math.max(12, keyboardInset + 12)}px + env(safe-area-inset-bottom, 0px))` }}
        >
          {isChatTarget ? (
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => triggerChatControl('Add file, payment, invoice or quick link')}
                className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#17171b]/95 text-[#ded5ff] shadow-[0_16px_45px_rgba(0,0,0,.48)] backdrop-blur-2xl transition-transform active:scale-90"
                aria-label="Open chat actions"
              >
                <Plus className="h-7 w-7 stroke-[1.7]" aria-hidden="true" />
              </button>
              <form
                onSubmit={commitDraft}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-white/10 bg-[#17171b]/95 p-1.5 pl-5 text-white shadow-[0_16px_45px_rgba(0,0,0,.48)] backdrop-blur-2xl"
              >
                <input
                  ref={proxyInputRef}
                  data-mobile-keyboard-proxy="true"
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setCommitted(false);
                  }}
                  enterKeyHint="send"
                  autoComplete="off"
                  aria-label={`Mobiele invoer voor ${inputLabel(activeElement)}`}
                  placeholder={inputLabel(activeElement)}
                  className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-white outline-none placeholder:text-white/40"
                />
                <ScanLine className="h-5 w-5 shrink-0 text-white/80" aria-hidden="true" />
                {draft.trim() ? (
                  <button
                    type="submit"
                    className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all ${
                      committed ? 'bg-emerald-300 text-black' : 'bg-[#d7cbff] text-[#7148f5] active:scale-90'
                    }`}
                    aria-label="Send chat message"
                  >
                    {committed
                      ? <Check className="h-4 w-4" aria-hidden="true" />
                      : <ArrowUp className="h-5 w-5 stroke-[2.5]" aria-hidden="true" />}
                  </button>
                ) : (
                  <button
                    type="button"
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => triggerChatControl('Record voice message')}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#d7cbff] text-[#7148f5] transition-transform active:scale-90"
                    aria-label="Record voice message"
                  >
                    <Mic className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
              </form>
            </div>
          ) : (
            <form
              onSubmit={commitDraft}
              className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/15 bg-[#0a0a0a]/92 p-1.5 pl-4 text-white shadow-[0_18px_60px_rgba(0,0,0,.55)] backdrop-blur-2xl"
            >
              <Keyboard className="h-4 w-4 shrink-0 text-orange-300" aria-hidden="true" />
                <span
                  aria-live="polite"
                  className={`min-w-0 flex-1 truncate text-sm font-medium ${visibleDraft ? 'text-white' : 'text-white/45'}`}
                >
                  {visibleDraft || inputLabel(activeElement)}
                </span>
                <button
                  type="button"
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={closeKeyboard}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-bold text-black"
                  aria-label="Sluit het toetsenbord"
                >
                  <Check className="h-4 w-4" aria-hidden="true" /> Klaar
                </button>
            </form>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
