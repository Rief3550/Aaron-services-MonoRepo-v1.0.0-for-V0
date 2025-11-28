/**
 * Página de Detalle de Orden de Trabajo (Server Component)
 * Wrapper para permitir generateStaticParams
 */

import OrderDetailClient from './client-page';

// Generate static params for static export
export async function generateStaticParams() {
    // Return a placeholder to ensure at least one page is generated
    // This is required for output: 'export' to pass build validation
    return [{ id: 'static-placeholder' }];
}

export default function OrderDetailPage() {
    return <OrderDetailClient />;
}
