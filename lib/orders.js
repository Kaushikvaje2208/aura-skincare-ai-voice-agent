// Mock order database used by the get_order_details tool.
export const ORDERS = {
  'ORD-101': {
    order_id: 'ORD-101',
    customer_name: 'Priya Sharma',
    items: ['Vitamin C Brightening Serum (30 ml)'],
    total_inr: 1299,
    payment_method: 'Prepaid (UPI)',
    status: 'Shipped',
    order_date: '2026-09-29',
    shipped_date: '2026-10-01',
    expected_delivery: '2026-10-07',
    courier: 'BlueDart',
    tracking_id: 'BD7781230045',
  },
  'ORD-102': {
    order_id: 'ORD-102',
    customer_name: 'Rahul Mehta',
    items: ['Hydrating Gel Moisturiser (50 g)', 'SPF 50 Sunscreen (50 ml)'],
    total_inr: 1848,
    payment_method: 'Cash on Delivery',
    status: 'Delivered',
    order_date: '2026-09-15',
    shipped_date: '2026-09-17',
    delivered_date: '2026-09-21',
    courier: 'Delhivery',
    tracking_id: 'DL5520918832',
  },
  'ORD-103': {
    order_id: 'ORD-103',
    customer_name: 'Ananya Iyer',
    items: ['Niacinamide 10% Face Serum (30 ml)'],
    total_inr: 899,
    payment_method: 'Prepaid (Card)',
    status: 'Processing',
    order_date: '2026-10-04',
    expected_delivery: '2026-10-10',
  },
};

export function getOrderDetails(orderId) {
  const id = String(orderId || '').trim().toUpperCase().replace(/\s+/g, '').replace(/^ORD(?!-)/, 'ORD-');
  return ORDERS[id] || { error: `No order found with ID "${orderId}". Ask the customer to re-check the order ID.` };
}
