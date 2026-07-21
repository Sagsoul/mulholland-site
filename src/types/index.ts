export interface Category {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
}

export interface Product {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  category_id: string | null;
  category?: Category;
  price_usd: number;
  stock_qty: number;
  is_second_hand: boolean;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  unit_price_usd: number;
  quantity: number;
  line_total_usd: number;
}

export interface Sale {
  id: string;
  invoice_number: string;
  channel: 'online' | 'pos';
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  subtotal_usd: number;
  total_usd: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  sale_items?: SaleItem[];
}

export interface PricelistCategory {
  id: string;
  name: string;
  note: string | null;
  sort_order: number;
  pricelist_rows?: PricelistRow[];
}

export interface PricelistRow {
  id: string;
  category_id: string;
  part_no: string | null;
  description: string;
  qty_per_reel: string | null;
  size: string | null;
  unit: string | null;
  price_usd: number | null;
  sort_order: number;
}

export interface CheckoutFormData {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  notes: string;
}

export interface OrderResponse {
  sale_id: string;
  total_usd: number;
  subtotal_usd: number;
  items: SaleItem[];
  invoice_url: string | null;
}
