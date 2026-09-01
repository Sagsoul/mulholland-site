import { getProducts } from '@/lib/store';
import POSTerminal from '@/components/admin/POSTerminal';

export default async function POSPage() {
  const allProducts = await getProducts({ isActive: true });
  return (
    <div className="h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-navy">POS Terminal</h1>
        <p className="text-sm text-gray-500 mt-1">Process in-store sales.</p>
      </div>
      <POSTerminal products={allProducts} />
    </div>
  );
}
