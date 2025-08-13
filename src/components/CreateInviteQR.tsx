"use client";
import { useState } from 'react';
import QRCode from 'qrcode';
import Image from 'next/image';

interface Props { propertyId: string; }

export default function CreateInviteQR({ propertyId }: Props) {
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/owner/properties/${propertyId}/invite`, { method: 'POST', body: JSON.stringify({ maxUses: 1, expiresInHours: 24 }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); setLoading(false); return; }
      setInviteUrl(data.invitation.joinUrl);
      const svg = await QRCode.toDataURL(data.invitation.joinUrl, { margin: 1, width: 256 });
      setQrDataUrl(svg);
  } catch {
      setError('Network error');
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h4 className="text-white font-medium mb-2">Generate Invite QR</h4>
      <button onClick={create} disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded disabled:opacity-50">{loading ? 'Creating...' : 'Create QR'}</button>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      {qrDataUrl && inviteUrl && (
        <div className="mt-4 flex flex-col items-center gap-2">
          {/* Using next/image for optimization */}
          <Image src={qrDataUrl} alt="Invite QR" width={256} height={256} className="bg-white p-2 rounded" />
          <p className="text-xs text-gray-300 break-all">{inviteUrl}</p>
        </div>
      )}
    </div>
  );
}
