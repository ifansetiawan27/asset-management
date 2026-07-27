import { Suspense } from 'react';

import { Spinner } from '@/components/ui';
import { AssetDetailClient } from './detail-client';

// Detail aset memakai query param (?id=) agar aman diekspor sebagai satu
// halaman statis dan bekerja untuk id apa pun (termasuk aset yang baru dibuat).
export default function AssetDetailPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AssetDetailClient />
    </Suspense>
  );
}
