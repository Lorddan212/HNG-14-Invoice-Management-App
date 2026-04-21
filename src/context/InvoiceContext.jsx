import {
  createContext,
  startTransition,
  useContext,
  useDeferredValue,
  useEffect,
  useState,
} from 'react';
import {
  createInvoicePayload,
  initializeInvoiceCollection,
  INVOICE_STATUSES,
  persistInvoice,
  removeInvoice,
  sortInvoices,
} from '../lib/invoices';

const FILTER_STORAGE_KEY = 'invoice-active-filters';
const InvoiceContext = createContext(null);

function sanitizeFilters(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.filter((status, index) => {
    return INVOICE_STATUSES.includes(status) && input.indexOf(status) === index;
  });
}

function readStoredFilters() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawFilters = window.localStorage.getItem(FILTER_STORAGE_KEY);
    return rawFilters ? sanitizeFilters(JSON.parse(rawFilters)) : [];
  } catch {
    return [];
  }
}

function applyFilters(invoices, filters) {
  if (!filters.length || filters.length === INVOICE_STATUSES.length) {
    return invoices;
  }

  return invoices.filter((invoice) => filters.includes(invoice.status));
}

export function InvoiceProvider({ children }) {
  const [invoices, setInvoices] = useState([]);
  const [filters, setFiltersState] = useState(readStoredFilters);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    initializeInvoiceCollection()
      .then((loadedInvoices) => {
        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setInvoices(loadedInvoices);
          setLoading(false);
        });
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const filteredInvoices = useDeferredValue(applyFilters(invoices, filters));

  const setFilters = (nextFilters) => {
    startTransition(() => {
      setFiltersState((currentFilters) => {
        const resolvedFilters =
          typeof nextFilters === 'function'
            ? nextFilters(currentFilters)
            : nextFilters;

        return sanitizeFilters(resolvedFilters);
      });
    });
  };

  const toggleFilter = (status) => {
    setFilters((currentFilters) =>
      currentFilters.includes(status)
        ? currentFilters.filter((entry) => entry !== status)
        : [...currentFilters, status],
    );
  };

  const resetFilters = () => {
    setFilters([]);
  };

  const getInvoiceById = (invoiceId) =>
    invoices.find((invoice) => invoice.id === invoiceId);

  const createInvoice = async (formValues, nextStatus) => {
    const invoice = createInvoicePayload(formValues, nextStatus);
    await persistInvoice(invoice);

    startTransition(() => {
      setInvoices((currentInvoices) =>
        sortInvoices([...currentInvoices, invoice]),
      );
    });

    return invoice;
  };

  const updateInvoice = async (invoiceId, formValues, nextStatus) => {
    const currentInvoice = getInvoiceById(invoiceId);

    if (!currentInvoice) {
      throw new Error('Invoice not found.');
    }

    const invoice = createInvoicePayload(formValues, nextStatus, currentInvoice);
    await persistInvoice(invoice);

    startTransition(() => {
      setInvoices((currentInvoices) =>
        sortInvoices(
          currentInvoices.map((entry) =>
            entry.id === invoiceId ? invoice : entry,
          ),
        ),
      );
    });

    return invoice;
  };

  const deleteInvoice = async (invoiceId) => {
    await removeInvoice(invoiceId);

    startTransition(() => {
      setInvoices((currentInvoices) =>
        currentInvoices.filter((invoice) => invoice.id !== invoiceId),
      );
    });
  };

  const markInvoiceAsPaid = async (invoiceId) => {
    const currentInvoice = getInvoiceById(invoiceId);

    if (!currentInvoice || currentInvoice.status !== 'pending') {
      return currentInvoice;
    }

    const updatedInvoice = {
      ...currentInvoice,
      status: 'paid',
    };

    await persistInvoice(updatedInvoice);

    startTransition(() => {
      setInvoices((currentInvoices) =>
        sortInvoices(
          currentInvoices.map((invoice) =>
            invoice.id === invoiceId ? updatedInvoice : invoice,
          ),
        ),
      );
    });

    return updatedInvoice;
  };

  return (
    <InvoiceContext.Provider
      value={{
        invoices,
        filteredInvoices,
        filters,
        loading,
        totalInvoices: invoices.length,
        activeFilterCount: filters.length,
        setFilters,
        toggleFilter,
        resetFilters,
        getInvoiceById,
        createInvoice,
        updateInvoice,
        deleteInvoice,
        markInvoiceAsPaid,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoices() {
  const context = useContext(InvoiceContext);

  if (!context) {
    throw new Error('useInvoices must be used within InvoiceProvider.');
  }

  return context;
}
