import * as Sentry from '@sentry/react';
// Add this button component to your app to test Sentry's error tracking
function SentryTest() {
  return (
    <button
      onClick={() => {
        throw new Error('This is your first error!');
      }}
    >
      Break the world
    </button>
  );
}
export default SentryTest;