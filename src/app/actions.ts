'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function adjustStock(stockId: string, adjustment: number) {
  const supabase = await createClient()

  const { data: currentStock, error: fetchError } = await supabase
    .from('warehouse_stock')
    .select('quantity')
    .eq('id', stockId)
    .single()

  if (fetchError || !currentStock) {
    return { success: false, error: 'Stock item not found' }
  }

  const newQuantity = Math.max(0, currentStock.quantity + adjustment)

  const { error: updateError } = await supabase
    .from('warehouse_stock')
    .update({ quantity: newQuantity })
    .eq('id', stockId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function transferStock(formData: FormData) {
  const productId = formData.get('productId') as string
  const sourceWarehouseId = formData.get('sourceWarehouseId') as string
  const destWarehouseId = formData.get('destWarehouseId') as string
  const quantity = parseInt(formData.get('quantity') as string, 10)

  if (!productId || !sourceWarehouseId || !destWarehouseId || isNaN(quantity) || quantity <= 0) {
    return { success: false, error: 'Please fill out all fields with valid numbers.' }
  }

  if (sourceWarehouseId === destWarehouseId) {
    return { success: false, error: 'Source and destination warehouses cannot be the same.' }
  }

  const supabase = await createClient()

  const { data: sourceStock, error: sourceError } = await supabase
    .from('warehouse_stock')
    .select('id, quantity')
    .eq('warehouse_id', sourceWarehouseId)
    .eq('product_id', productId)
    .single()

  if (sourceError || !sourceStock || sourceStock.quantity < quantity) {
    return { success: false, error: 'Insufficient stock in the source warehouse.' }
  }

  const { error: updateSourceError } = await supabase
    .from('warehouse_stock')
    .update({ quantity: sourceStock.quantity - quantity })
    .eq('id', sourceStock.id)

  if (updateSourceError) {
    return { success: false, error: updateSourceError.message }
  }

  const { data: destStock } = await supabase
    .from('warehouse_stock')
    .select('id, quantity')
    .eq('warehouse_id', destWarehouseId)
    .eq('product_id', productId)
    .single()

  if (destStock) {
    const { error: updateDestError } = await supabase
      .from('warehouse_stock')
      .update({ quantity: destStock.quantity + quantity })
      .eq('id', destStock.id)

    if (updateDestError) {
      return { success: false, error: updateDestError.message }
    }
  } else {
    const { error: insertDestError } = await supabase
      .from('warehouse_stock')
      .insert({
        warehouse_id: destWarehouseId,
        product_id: productId,
        quantity: quantity,
      })

    if (insertDestError) {
      return { success: false, error: insertDestError.message }
    }
  }

  revalidatePath('/')
  return { success: true }
}