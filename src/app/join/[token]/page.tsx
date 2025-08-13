"use client";
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function JoinByToken({ params }: { params: Promise<{ token: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'joining' | 'success' | 'error' | 'auth'>('idle');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    params.then(({ token }) => setToken(token));
  }, [params]);

  useEffect(() => {
    if (status === 'loading' || !token) return;
    if (!session) {
      setState('auth');
      // redirect to auth with callback to this page
      router.replace(`/auth?callbackUrl=/join/${token}`);
      return;
    }
    redeem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, token]);

  const redeem = async () => {
    setState('joining');
    try {
      const res = await fetch(`/api/join/${token}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setState('success');
        setMessage('Linked successfully. Redirecting...');
        setTimeout(() => {
          router.push(`/property/${data.propertyId}`);
        }, 1500);
      } else {
        setState('error');
        setMessage(data.error || data.message || 'Failed to join');
      }
  } catch {
      setState('error');
      setMessage('Network error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow max-w-md w-full text-center">
        {state === 'joining' && <p className="text-white">Linking you to the PG...</p>}
        {state === 'auth' && <p className="text-white">Redirecting to sign in...</p>}
        {state === 'success' && <p className="text-green-400">{message}</p>}
        {state === 'error' && <p className="text-red-400">{message}</p>}
        {state === 'idle' && <p className="text-white">Preparing...</p>}
      </div>
    </div>
  );
}
