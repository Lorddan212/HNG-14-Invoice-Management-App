import { EmptyInvoicesIllustration } from '../components/EmptyInvoicesIllustration';
import { Link } from 'react-router-dom';
import { FilterMenu } from '../components/FilterMenu';
import { StatusBadge } from '../components/StatusBadge';
import { useInvoices } from '../context/InvoiceContext';
import {
  formatCurrency,
  formatInvoiceCount,
  formatInvoiceDate,
} from '../lib/invoices';

export function InvoiceListPage({ onCreateInvoice }) {
  const { filteredInvoices, filters, loading, totalInvoices } = useInvoices();
  const hasActiveFilters = Boolean(filters.length);

  return (
    <section className="page page--list">
      <header className="page-header">
        <div>
          <h1>Invoices</h1>
          <p className="page-header__copy"> There are {" "}
            {loading
              ? 'Loading invoice records...'
              : totalInvoices
                ? formatInvoiceCount(totalInvoices)
                : 'No Invoices'} currently
          </p>
        </div>

        <div className="page-header__actions">
          <FilterMenu />
          <button
            type="button"
            className="button button--primary button--with-icon button--new-invoice"
            onClick={onCreateInvoice}
          >
            <span className="button__plus" aria-hidden="true">
              +
            </span>
            <span>New Invoice</span>
          </button>
        </div>
      </header>

      {loading ? (
        <div className="empty-state">
          <h2>Syncing your invoice desk</h2>
          <p>Your saved invoices are loading from local storage.</p>
        </div>
      ) : filteredInvoices.length ? (
        <ul className="invoice-list">
          {filteredInvoices.map((invoice) => (
            <li key={invoice.id}>
              <Link className="invoice-row" to={`/invoice/${invoice.id}`}>
                <div className="invoice-row__identity">
                  <strong>
                    <span className="hash-mark">#</span>
                    {invoice.id}
                  </strong>
                  <p>Due {formatInvoiceDate(invoice.paymentDue)}</p>
                </div>

                <div className="invoice-row__client">
                  <p>{invoice.clientName || 'Draft client pending'}</p>
                  <small>{invoice.description || 'Untitled invoice draft'}</small>
                </div>

                <strong className="invoice-row__total">
                  {formatCurrency(invoice.total)}
                </strong>

                <StatusBadge status={invoice.status} />
                <span className="invoice-row__arrow" aria-hidden="true">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state empty-state--illustrated">
          <EmptyInvoicesIllustration />
          <div className="empty-state__content">
            <h2>
              {hasActiveFilters
                ? 'No invoices match your filter'
                : 'There is nothing here'}
            </h2>
            <p>
              {hasActiveFilters ? (
                'Try changing your status filters to find an existing invoice.'
              ) : (
                <>
                  Create an invoice by clicking the
                  {' '}
                  <strong>New Invoice</strong>
                  {' '}
                  button and get started.
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
