import React, { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { getStoredPrivacyConsent, PRIVACY_CONSENT_CHANGE_EVENT } from '../lib/privacyConsent';

export const PrivacyAnalytics = () => {
  const [enabled, setEnabled] = useState(() => getStoredPrivacyConsent()?.categories.analytics === true);

  useEffect(() => {
    const onChange = () => setEnabled(getStoredPrivacyConsent()?.categories.analytics === true);
    window.addEventListener(PRIVACY_CONSENT_CHANGE_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(PRIVACY_CONSENT_CHANGE_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  return enabled ? <><Analytics /><SpeedInsights /></> : null;
};

