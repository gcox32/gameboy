import { Suspense } from 'react';
import OaksLab from '@/components/oaks-lab/OaksLab';

// OaksLab reads the address (see enhanceAtRanchHref in oaks-lab/links), which Next requires inside Suspense
export default function OaksLabPage() {
    return (
        <Suspense fallback={null}>
            <OaksLab />
        </Suspense>
    );
}
