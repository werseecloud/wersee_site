update public.invoice_links as link
set link =
  'https://pay.wersee.com'
  || case
    when invoice.stripe_invoice_id = 'sandbox_invoice' then '/sandbox'
    else ''
  end
  || '/pay/invoice/'
  || link.username
  || '/'
  || coalesce(invoice.invoice_number, invoice.slug, invoice.id::text)
from public.invoices as invoice
where invoice.id = link.invoice_id
  and link.link is distinct from (
    'https://pay.wersee.com'
    || case
      when invoice.stripe_invoice_id = 'sandbox_invoice' then '/sandbox'
      else ''
    end
    || '/pay/invoice/'
    || link.username
    || '/'
    || coalesce(invoice.invoice_number, invoice.slug, invoice.id::text)
  );
