import React from 'react';
import { useParams } from 'react-router-dom';
import { PosCheckoutPage } from './PosCheckoutPage';

export function PosQrPay() {
  const { username, systemname, id } = useParams();
  
  // We can reuse PosCheckoutPage by passing the params it expects,
  // or we can just render it and it will read from useParams.
  // Wait, PosCheckoutPage reads `checkout_id` from useParams.
  // Let's just create a wrapper that sets the right params or we can modify PosCheckoutPage to check for `id` or `checkout_id`.
  return <PosCheckoutPage />;
}
