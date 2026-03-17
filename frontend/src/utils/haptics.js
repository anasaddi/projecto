/**
 * Simple haptic feedback utility using the Vibration API.
 * 
 * @param {number[]} pattern - Vibration pattern, e.g., [50] for a short pulse.
 */
export const haptic = (pattern = [50]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (_) {
      // Ignore vibration errors (e.g., on browsers that block it)
    }
  }
};
