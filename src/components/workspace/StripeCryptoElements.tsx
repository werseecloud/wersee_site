import React, { ReactNode } from 'react';
import { StripeOnramp } from '@stripe/crypto';

// ReactContext to simplify access of StripeOnramp object
const CryptoElementsContext = React.createContext<{ onramp: StripeOnramp | null } | null>(null);

interface CryptoElementsProps {
  stripeOnramp: Promise<StripeOnramp | null>;
  children: ReactNode;
}

export const CryptoElements = ({
  stripeOnramp,
  children,
}: CryptoElementsProps) => {
  const [ctx, setContext] = React.useState<{ onramp: StripeOnramp | null }>({ onramp: null });

  React.useEffect(() => {
    let isMounted = true;

    Promise.resolve(stripeOnramp).then((onramp) => {
      if (onramp && isMounted) {
        setContext((ctx) => (ctx.onramp ? ctx : { onramp }));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [stripeOnramp]);

  return (
    <CryptoElementsContext.Provider value={ctx}>
      {children}
    </CryptoElementsContext.Provider>
  );
};

// React hook to get StripeOnramp from context
export const useStripeOnramp = () => {
  const context = React.useContext(CryptoElementsContext);
  return context?.onramp;
};

// React element to render Onramp UI
const useOnrampSessionListener = (
  type: string,
  session: any,
  callback?: (payload: any) => void
) => {
  React.useEffect(() => {
    if (session && callback) {
      const listener = (e: any) => callback(e.payload);
      session.addEventListener(type, listener);
      return () => {
        session.removeEventListener(type, listener);
      };
    }
    return () => {};
  }, [session, callback, type]);
};

interface OnrampElementProps {
  clientSecret: string;
  appearance?: any;
  onReady?: (payload: any) => void;
  onChange?: (payload: any) => void;
  [key: string]: any;
}

export const OnrampElement = ({
  clientSecret,
  appearance,
  onReady,
  onChange,
  ...props
}: OnrampElementProps) => {
  const stripeOnramp = useStripeOnramp();
  const onrampElementRef = React.useRef<HTMLDivElement>(null);
  const [session, setSession] = React.useState<any>();

  const appearanceJSON = JSON.stringify(appearance);
  React.useEffect(() => {
    const containerRef = onrampElementRef.current;
    if (containerRef) {
      containerRef.innerHTML = '';

      if (clientSecret && stripeOnramp) {
        setSession(
          stripeOnramp
            .createSession({
              clientSecret,
              appearance: appearanceJSON ? JSON.parse(appearanceJSON) : {}
            })
            .mount(containerRef)
        );
      }
    }
  }, [appearanceJSON, clientSecret, stripeOnramp]);

  useOnrampSessionListener('onramp_ui_loaded', session, onReady);
  useOnrampSessionListener('onramp_session_updated', session, onChange);

  return <div {...props} ref={onrampElementRef}></div>;
};
