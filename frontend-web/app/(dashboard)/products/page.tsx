import type { Metadata } from 'next';
import { Topbar } from '@/components/layout/Topbar';
import { ProductsCatalog } from '@/components/products/ProductsCatalog';
import { Plus } from 'lucide-react';

export const metadata: Metadata = { title: 'Products & Services | DAS CRM' };

export default function ProductsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Products & Services Catalog" actions={
        <button className="btn-primary text-sm gap-1.5"><Plus size={14} /> Add Product</button>
      } />
      <main className="flex-1 p-6 overflow-auto">
        <ProductsCatalog />
      </main>
    </div>
  );
}
