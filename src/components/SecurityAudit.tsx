import React, { useEffect } from 'react';

/**
 * SecurityAudit component performs basic checks for common security misconfigurations
 * and logs warnings to the console. This is intended for development and monitoring.
 */
export const SecurityAudit: React.FC = () => {
  useEffect(() => {
    const runAudit = () => {
      console.group('🛡️ Wersee Security Audit');
      
      // 1. Check for HTTPS
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        console.warn('❌ SECURITY: Site is not running on HTTPS. This is critical for production.');
      } else {
        console.log('✅ HTTPS: Active');
      }

      // 2. Check for CSP (basic check)
      // Note: We can't easily read the CSP from JS if it's set via headers, 
      // but we can check if certain restricted actions are possible.
      try {
        // eslint-disable-next-line no-eval
        // eval('console.log("CSP Test")');
        // If eval works, CSP might be too loose (though we might need it for some libs)
      } catch (e) {
        console.log('✅ CSP: Eval restricted');
      }

      // 3. Check for sensitive data in localStorage
      const sensitiveKeys = ['token', 'key', 'secret', 'password', 'auth'];
      const foundSensitive = Object.keys(localStorage).filter(key => 
        sensitiveKeys.some(s => key.toLowerCase().includes(s)) && !key.includes('sb-')
      );
      if (foundSensitive.length > 0) {
        console.warn('⚠️ STORAGE: Found potential sensitive keys in localStorage:', foundSensitive);
      }

      // 4. Check for iframe nesting (X-Frame-Options test)
      const testIframe = document.createElement('iframe');
      testIframe.style.display = 'none';
      testIframe.src = window.location.href;
      testIframe.onload = () => {
        console.warn('⚠️ SECURITY: X-Frame-Options might not be active. Page was able to load in an iframe.');
        document.body.removeChild(testIframe);
      };
      testIframe.onerror = () => {
        console.log('✅ X-Frame-Options: Active');
        document.body.removeChild(testIframe);
      };
      // Note: This test might be blocked by browser security or AI Studio environment, 
      // so we use it as a hint.
      // document.body.appendChild(testIframe);

      if (window.self !== window.top) {
        console.log('ℹ️ IFRAME: Running inside an iframe (expected for AI Studio preview)');
      }

      console.groupEnd();
    };

    // Run audit after a short delay to allow app to settle
    const timer = setTimeout(runAudit, 3000);
    return () => clearTimeout(timer);
  }, []);

  return null;
};
