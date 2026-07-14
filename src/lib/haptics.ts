export const hapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
  if (typeof window === 'undefined' || !window.navigator || !window.navigator.vibrate) return;

  try {
    switch (type) {
      case 'light':
        window.navigator.vibrate(10);
        break;
      case 'medium':
        window.navigator.vibrate(20);
        break;
      case 'heavy':
        window.navigator.vibrate(30);
        break;
      case 'success':
        window.navigator.vibrate([10, 50, 20]);
        break;
      case 'warning':
        window.navigator.vibrate([20, 50, 20]);
        break;
      case 'error':
        window.navigator.vibrate([30, 50, 30, 50, 30]);
        break;
      default:
        window.navigator.vibrate(10);
    }
  } catch (e) {
    // Ignore errors
  }
};
