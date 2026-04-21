import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { useInvoices } from '../context/InvoiceContext';
import { formatCurrency, formatInvoiceDate } from '../lib/invoices';

function AddressBlock({ address }) {
  return (
    <address className="address-block">
      {[address.street, address.city, address.postCode, address.country]
        .filter(Boolean)
        .map((line) => (
          <span key={line}>{line}</span>
        ))}
    </address>
  );
}

export function InvoiceDetailPage({
  onDeleteInvoice,
  onEditInvoice,
}) {
  const navigate = useNavigate();
  const { invoiceId } = useParams();
  const { getInvoiceById, markInvoiceAsPaid } = useInvoices();
  const [isPaying, setIsPaying] = useState(false);
  const invoice = getInvoiceById(invoiceId);

  if (!invoice) {
    return (
      <section className="page page--detail">
        <button
          type="button"
          className="back-link"
          onClick={() => navigate('/')}
        >
          ‹ Go back
        </button>

        <div className="empty-state">
          <h2>Invoice not found</h2>
          <p>The requested invoice does not exist in this workspace anymore.</p>
        </div>
      </section>
    );
  }

  const handleMarkAsPaid = async () => {
    setIsPaying(true);

    try {
      await markInvoiceAsPaid(invoice.id);
    } finally {
      setIsPaying(false);
    }
  };

  const actionButtons = (
    <>
      <button
        type="button"
        className="button button--secondary button--detail-edit"
        onClick={() => onEditInvoice(invoice.id)}
      >
        Edit
      </button>
      <button
        type="button"
        className="button button--danger"
        onClick={() => onDeleteInvoice(invoice.id)}
      >
        Delete
      </button>
      {invoice.status === 'pending' ? (
        <button
          type="button"
          className="button button--primary button--detail-paid"
          onClick={handleMarkAsPaid}
          disabled={isPaying}
        >
          {isPaying ? 'Updating...' : 'Mark as Paid'}
        </button>
      ) : null}
    </>
  );

  return (
    <section className="page page--detail">
      <button
        type="button"
        className="back-link"
        onClick={() => navigate('/')}
      >
        ‹ Back to Invoices
      </button>

      <div className="detail-toolbar">
        <div className="detail-toolbar__status">
          <span className="detail-toolbar__status-label">Status</span>
          <StatusBadge status={invoice.status} />
        </div>
        <div className="detail-toolbar__actions">{actionButtons}</div>
      </div>

      <article className="invoice-sheet">
        <header className="invoice-sheet__hero">
          <div>
            <h1>
              <span className="hash-mark">#</span>
              {invoice.id}
            </h1>
            <p>{invoice.description || 'No project description added yet.'}</p>
          </div>
          <AddressBlock address={invoice.senderAddress} />
        </header>

        <section className="invoice-sheet__meta">
          <div className="meta-group">
            <div>
              <p>Invoice Date</p>
              <strong>{formatInvoiceDate(invoice.createdAt)}</strong>
            </div>
            <div>
              <p>Payment Due</p>
              <strong>{formatInvoiceDate(invoice.paymentDue)}</strong>
            </div>
          </div>

          <div className="meta-group">
            <p>Bill To</p>
            <strong>{invoice.clientName || 'Client pending'}</strong>
            <AddressBlock address={invoice.clientAddress} />
          </div>

          <div className="meta-group">
            <p>Send To</p>
            <strong>{invoice.clientEmail || 'No email provided'}</strong>
          </div>
        </section>

        <section className="detail-items">
          <div className="detail-items__head">
            <span>Item Name</span>
            <span>Qty.</span>
            <span>Price</span>
            <span>Total</span>
          </div>

          {invoice.items.length ? (
            invoice.items.map((item) => (
              <div className="detail-items__row" key={item.id}>
                <strong>{item.name}</strong>
                <span>{item.quantity}</span>
                <span>{formatCurrency(item.price)}</span>
                <strong>{formatCurrency(item.total)}</strong>
              </div>
            ))
          ) : (
            <div className="detail-items__empty">
              Draft invoices can be saved without items. Edit this invoice to
              add billable work.
            </div>
          )}

          <footer className="detail-items__footer">
            <span>Amount Due</span>
            <strong>{formatCurrency(invoice.total)}</strong>
          </footer>
        </section>
      </article>

      <div className="mobile-actions">{actionButtons}</div>
    </section>
  );
}
