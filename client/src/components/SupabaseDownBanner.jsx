// client/src/components/SupabaseDownBanner.jsx
import React from 'react';
/**
 * Banner shown when Supabase is unavailable.
 * @returns {JSX.Element}
 */
export default function SupabaseDownBanner() {
  return (
    <div className="bg-yellow-100 text-yellow-900 px-4 py-3 text-sm">
      Authentication is temporarily unavailable. You can still browse the demo, but sign‑in and data sync are disabled.
    </div>
  );
}