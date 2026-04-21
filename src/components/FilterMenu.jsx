import { useEffect, useRef, useState } from 'react';
import { useInvoices } from '../context/InvoiceContext';
import { INVOICE_STATUSES } from '../lib/invoices';

export function FilterMenu() {
  const { activeFilterCount, filters, resetFilters, toggleFilter } = useInvoices();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const allSelected =
    !filters.length || filters.length === INVOICE_STATUSES.length;

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  return (
    <div className="filter-menu" ref={containerRef}>
      <button
        type="button"
        className="button button--filter"
        onClick={() => setIsOpen((currentState) => !currentState)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span>Filter by Status</span>
        <span className="filter-menu__summary" aria-live="polite">
          {allSelected ? 'All' : activeFilterCount}
        </span>
      </button>

      {isOpen ? (
        <div className="filter-menu__popover" role="menu">
          <label className="filter-option">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={resetFilters}
            />
            <span>All</span>
          </label>

          {INVOICE_STATUSES.map((status) => (
            <label key={status} className="filter-option">
              <input
                type="checkbox"
                checked={filters.includes(status)}
                onChange={() => toggleFilter(status)}
              />
              <span>
                {status.charAt(0).toUpperCase()}
                {status.slice(1)}
              </span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
