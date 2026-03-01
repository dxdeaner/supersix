import { useState } from 'react';
import api from '../services/api';

const EmailVerificationBanner = ({ user, onClose }) => {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const handleResend = async () => {
    setSending(true);
    setMessage('');

    try {
      await api.resendVerification();
      setMessage('Verification email sent! Check your inbox.');
    } catch (error) {
      setMessage('Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!user || user.email_verified) return null;

  return (
    <div className="bg-orange-500/10 border-b border-orange-500/20 px-4 py-3">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center space-x-4">
          <div className="text-center">
            <p className="text-orange-400 text-sm">
              Please verify your email address to ensure account security. Check your inbox and spam for a verification email. If you didn't receive it:
            </p>
            {message && (
              <p className="text-orange-300 text-xs mt-1">{message}</p>
            )}
          </div>
          <button
            onClick={handleResend}
            disabled={sending}
            className="text-orange-400 hover:text-orange-300 text-sm underline disabled:opacity-50 whitespace-nowrap"
          >
            {sending ? 'Sending...' : 'Resend'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
