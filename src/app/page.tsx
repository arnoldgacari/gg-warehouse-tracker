import { createClient } from '@/utils/supabase/server'
import { adjustStock } from '@/app/actions'
import { TransferForm } from '@/components/TransferForm'

type Warehouse = { id: string; name: string; location: string }
type Product = { id: string; sku: string; name: string; price: number }

// Handle both single object and array formats returned by Supabase joins
type StockItem = {
  id: string
  quantity: number
  warehouses: Warehouse | Warehouse[] | null
  products: Product | Product[] | null
}

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch stock items
  const { data: stockItems, error } = await supabase
    .from('warehouse_stock')
    .select(`
      id,
      quantity,
      warehouses ( id, name, location ),
      products ( id, sku, name, price )
    `)

  // Fetch master lists for dropdowns
  const { data: warehouses } = await supabase.from('warehouses').select('*')
  const { data: products } = await supabase.from('products').select('*')

  if (error) {
    return <div className="p-8 text-red-500">Error: {error.message}</div>
  }

  return (
    <main className="p-8 max-w-4xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Multi-Warehouse Inventory Tracker</h1>
      
      {/* Transfer Form Component */}
      <TransferForm warehouses={warehouses || []} products={products || []} />

      <h2 className="text-2xl font-semibold mb-4 text-gray-900">Current Inventory Stock</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {stockItems?.map((item: StockItem) => {
          // Normalize Supabase array/object return values safely
          const warehouse = Array.isArray(item.warehouses) ? item.warehouses[0] : item.warehouses
          const product = Array.isArray(item.products) ? item.products[0] : item.products

          return (
            <div key={item.id} className="border p-5 rounded-lg shadow-sm bg-white flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{product?.name}</h3>
                <p className="text-sm text-gray-500">SKU: {product?.sku}</p>
                <p className="mt-2 text-gray-700">
                  <strong>Warehouse:</strong> {warehouse?.name} ({warehouse?.location})
                </p>
                <p className="mt-1 text-lg font-bold text-blue-600">
                  Quantity: {item.quantity} units
                </p>
              </div>

              {/* Quick Adjustment Action Forms */}
              <div className="mt-4 pt-3 border-t flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Quick Adjust</span>
                <div className="flex gap-2">
                  <form action={async () => {
                    'use server'
                    await adjustStock(item.id, -1)
                  }}>
                    <button 
                      type="submit"
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold rounded transition"
                      title="Decrease quantity by 1"
                    >
                      -
                    </button>
                  </form>

                  <form action={async () => {
                    'use server'
                    await adjustStock(item.id, 1)
                  }}>
                    <button 
                      type="submit"
                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-bold rounded transition"
                      title="Increase quantity by 1"
                    >
                      +
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}