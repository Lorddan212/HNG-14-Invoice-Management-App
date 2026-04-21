import { seedInvoices } from '../data/seedInvoices';
import {
  deleteInvoiceStore,
  getAllInvoicesStore,
  putInvoiceStore,
  replaceInvoicesStore,
} from './idb';

export const INVOICE_STATUSES = ['draft', 'pending', 'paid'];

export const PAYMENT_TERMS_OPTIONS = [
  { value: 7, label: 'Net 7 Days' },
  { value: 14, label: 'Net 14 Days' },
  { value: 21, label: 'Net 21 Days' },
  { value: 30, label: 'Net 30 Days' },
];
const SEED_CATALOG_VERSION = '3';
const SEED_CATALOG_STORAGE_KEY = 'invoice-seed-catalog-version';
const BACKFILL_SEED_IDS = new Set([
  'LK7291',
  'VR3158',
  'GB0042',
  'SA4401',
  'NP5602',
  'CJ1184',
  'DK7719',
  'MT2305',
  'XB9916',
  'PW6048',
]);

const blankAddress = {
  street: '',
  city: '',
  postCode: '',
  country: '',
};

const currencyFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function readSeedCatalogVersion() {
  if (typeof window === 'undefined') {
    return SEED_CATALOG_VERSION;
  }

  try {
    return window.localStorage.getItem(SEED_CATALOG_STORAGE_KEY) ?? '1';
  } catch {
    return '1';
  }
}

function writeSeedCatalogVersion() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      SEED_CATALOG_STORAGE_KEY,
      SEED_CATALOG_VERSION,
    );
  } catch {
  }
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function createItemId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `item-${Math.random().toString(36).slice(2, 11)}`;
}

export function generateInvoiceId() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const left = Array.from({ length: 2 }, () => {
    const index = Math.floor(Math.random() * letters.length);
    return letters[index];
  }).join('');
  const right = Math.floor(1000 + Math.random() * 9000);

  return `${left}${right}`;
}

export function addDays(dateString, days) {
  const baseDate = new Date(`${dateString || todayIso()}T00:00:00`);
  baseDate.setDate(baseDate.getDate() + toNumber(days));
  return baseDate.toISOString().slice(0, 10);
}

export function normalizeItems(items = []) {
  return items.map((item, index) => {
    const quantity = toNumber(item.quantity);
    const price = toNumber(item.price);

    return {
      id: item.id || `item-${index}-${Date.now()}`,
      name: item.name ?? '',
      quantity,
      price,
      total: quantity * price,
    };
  });
}

export function hydrateInvoice(invoice) {
  const createdAt = invoice.createdAt || todayIso();
  const paymentTerms = toNumber(invoice.paymentTerms) || 30;
  const items = normalizeItems(invoice.items ?? []);
  const total = items.reduce((sum, item) => sum + item.total, 0);

  return {
    id: invoice.id || generateInvoiceId(),
    createdAt,
    paymentTerms,
    paymentDue: invoice.paymentDue || addDays(createdAt, paymentTerms),
    description: invoice.description ?? '',
    clientName: invoice.clientName ?? '',
    clientEmail: invoice.clientEmail ?? '',
    status: INVOICE_STATUSES.includes(invoice.status)
      ? invoice.status
      : 'draft',
    senderAddress: {
      ...blankAddress,
      ...invoice.senderAddress,
    },
    clientAddress: {
      ...blankAddress,
      ...invoice.clientAddress,
    },
    items,
    total,
  };
}

export function sortInvoices(invoices) {
  return [...invoices]
    .map(hydrateInvoice)
    .sort((left, right) => {
      const leftDate = new Date(`${left.createdAt}T00:00:00`).getTime();
      const rightDate = new Date(`${right.createdAt}T00:00:00`).getTime();
      return rightDate - leftDate;
    });
}

export function createEmptyItem() {
  return {
    id: createItemId(),
    name: '',
    quantity: '',
    price: '',
  };
}

export function createEmptyInvoice() {
  const createdAt = todayIso();

  return {
    createdAt,
    paymentTerms: '30',
    description: '',
    clientName: '',
    clientEmail: '',
    senderAddress: {
      ...blankAddress,
    },
    clientAddress: {
      ...blankAddress,
    },
    items: [createEmptyItem()],
  };
}

export function formatInvoiceDate(dateString) {
  if (!dateString) {
    return 'TBD';
  }

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return 'TBD';
  }

  return dateFormatter.format(date);
}

export function formatCurrency(amount) {
  return currencyFormatter.format(toNumber(amount));
}

export function formatInvoiceCount(count) {
  return count === 1 ? '1 invoice' : `${count} invoices`;
}

function sanitizeDraftItems(items = []) {
  return items.filter((item) =>
    [item.name, item.quantity, item.price].some((value) =>
      String(value ?? '').trim(),
    ),
  );
}

export function createInvoicePayload(formValues, nextStatus, currentInvoice) {
  const createdAt = formValues.createdAt || currentInvoice?.createdAt || todayIso();
  const paymentTerms = toNumber(formValues.paymentTerms) || 30;
  const items = sanitizeDraftItems(formValues.items);

  return hydrateInvoice({
    ...currentInvoice,
    ...formValues,
    id: currentInvoice?.id || generateInvoiceId(),
    createdAt,
    paymentTerms,
    paymentDue: addDays(createdAt, paymentTerms),
    status: nextStatus,
    items,
  });
}

export function invoiceToFormValues(invoice) {
  if (!invoice) {
    return createEmptyInvoice();
  }

  const hydrated = hydrateInvoice(invoice);

  return {
    createdAt: hydrated.createdAt,
    paymentTerms: String(hydrated.paymentTerms),
    description: hydrated.description,
    clientName: hydrated.clientName,
    clientEmail: hydrated.clientEmail,
    senderAddress: {
      ...hydrated.senderAddress,
    },
    clientAddress: {
      ...hydrated.clientAddress,
    },
    items: hydrated.items.length
      ? hydrated.items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: String(item.quantity),
          price: item.price ? String(item.price) : '',
        }))
      : [createEmptyItem()],
  };
}

export async function initializeInvoiceCollection() {
  const storedInvoices = sortInvoices(await getAllInvoicesStore());
  const seededInvoices = sortInvoices(seedInvoices);

  if (!storedInvoices.length) {
    await replaceInvoicesStore(seededInvoices);
    writeSeedCatalogVersion();
    return seededInvoices;
  }

  if (readSeedCatalogVersion() !== SEED_CATALOG_VERSION) {
    const storedIds = new Set(storedInvoices.map((invoice) => invoice.id));
    const missingCatalogInvoices = seededInvoices.filter((invoice) => {
      return BACKFILL_SEED_IDS.has(invoice.id) && !storedIds.has(invoice.id);
    });

    if (missingCatalogInvoices.length) {
      const mergedInvoices = sortInvoices([
        ...storedInvoices,
        ...missingCatalogInvoices,
      ]);
      await replaceInvoicesStore(mergedInvoices);
      writeSeedCatalogVersion();
      return mergedInvoices;
    }

    writeSeedCatalogVersion();
  }

  return storedInvoices;
}

export async function persistInvoice(invoice) {
  const hydratedInvoice = hydrateInvoice(invoice);
  await putInvoiceStore(hydratedInvoice);
  return hydratedInvoice;
}

export async function removeInvoice(invoiceId) {
  await deleteInvoiceStore(invoiceId);
  return invoiceId;
}
