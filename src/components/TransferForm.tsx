'use client';

import { useState, type FormEvent } from 'react';
import { transferStock } from '@/app/actions';

type WarehouseOption = { id: string; name: string };
type ProductOption = { id: string; name: string; sku: string };

export function TransferForm({
  warehouses,
  products,
}: {
  warehouses: WarehouseOption[];
  products: ProductOption[];
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const form = event.currentTarget;
    try {
      const result = await transferStock(new FormData(form));

      if (result.success) {
        setMessage({ text: 'Stock transferred successfully!', isError: false });
        form.reset();
      } else {
        setMessage({ text: result.error || 'Transfer failed', isError: true });
      }
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'Transfer failed',
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Inter-Warehouse Stock Transfer</h2>
      
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
          <select name="productId" required className="w-full border rounded p-2 text-sm text-gray-900 bg-white">
            <option value="">Select product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From Warehouse</label>
          <select name="sourceWarehouseId" required className="w-full border rounded p-2 text-sm text-gray-900 bg-white">
            <option value="">Source warehouse...</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To Warehouse</label>
          <select name="destWarehouseId" required className="w-full border rounded p-2 text-sm text-gray-900 bg-white">
            <option value="">Destination warehouse...</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
          <input type="number" name="quantity" min="1" required placeholder="Qty" className="w-full border rounded p-2 text-sm text-gray-900" />
        </div>

        <div className="md:col-span-4 flex items-center justify-between mt-2 pt-2 border-t">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded text-sm transition disabled:opacity-50"
          >
            {loading ? 'Processing Transfer...' : 'Complete Transfer'}
          </button>

          {message && (
            <p className={`text-sm font-medium ${message.isError ? 'text-red-600' : 'text-green-600'}`}>
              {message.text}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}