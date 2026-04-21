const DB_NAME = 'Daniel J Invoice';
const DB_VERSION = 1;
const STORE_NAME = 'Invoices';
const FALLBACK_STORAGE_KEY = 'invoice-fallback-store';
const LEGACY_DB_NAME = 'daniel-j-invoices-db';

let databasePromise;
let legacyDatabasePromise;

function hasIndexedDb() {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function readFallbackStore() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(FALLBACK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeFallbackStore(invoices) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(invoices));
}

async function openDatabase() {
  if (!hasIndexedDb()) {
    return null;
  }

  if (!databasePromise) {
    databasePromise = openDatabaseByName(DB_NAME);
  }

  return databasePromise;
}

function openDatabaseByName(databaseName) {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(databaseName, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function databaseExists(databaseName) {
  if (
    !hasIndexedDb() ||
    typeof window.indexedDB.databases !== 'function'
  ) {
    return true;
  }

  try {
    const databases = await window.indexedDB.databases();
    return databases.some((database) => database.name === databaseName);
  } catch {
    return true;
  }
}

async function readInvoicesFromDatabase(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).getAll();

    request.onsuccess = () => resolve(request.result ?? []);
    request.onerror = () => reject(request.error);
  });
}

async function getLegacyInvoicesStore() {
  if (
    !hasIndexedDb() ||
    DB_NAME === LEGACY_DB_NAME ||
    !(await databaseExists(LEGACY_DB_NAME))
  ) {
    return [];
  }

  try {
    if (!legacyDatabasePromise) {
      legacyDatabasePromise = openDatabaseByName(LEGACY_DB_NAME);
    }

    const legacyDb = await legacyDatabasePromise;
    return await readInvoicesFromDatabase(legacyDb);
  } catch {
    return readFallbackStore();
  }
}

export async function getAllInvoicesStore() {
  if (!hasIndexedDb()) {
    return readFallbackStore();
  }

  try {
    const db = await openDatabase();
    const invoices = await readInvoicesFromDatabase(db);

    if (invoices.length) {
      writeFallbackStore(invoices);
      return invoices;
    }

    const legacyInvoices = await getLegacyInvoicesStore();

    if (legacyInvoices.length) {
      await replaceInvoicesStore(legacyInvoices);
      writeFallbackStore(legacyInvoices);
      return legacyInvoices;
    }

    writeFallbackStore(invoices);
    return invoices;
  } catch {
    return readFallbackStore();
  }
}

export async function replaceInvoicesStore(invoices) {
  if (!hasIndexedDb()) {
    writeFallbackStore(invoices);
    return invoices;
  }

  try {
    const db = await openDatabase();

    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      store.clear();
      invoices.forEach((invoice) => store.put(invoice));

      transaction.oncomplete = () => resolve(invoices);
      transaction.onerror = () => reject(transaction.error);
    });

    writeFallbackStore(invoices);
    return invoices;
  } catch {
    writeFallbackStore(invoices);
    return invoices;
  }
}

export async function putInvoiceStore(invoice) {
  if (!hasIndexedDb()) {
    const currentInvoices = readFallbackStore().filter(
      (entry) => entry.id !== invoice.id,
    );
    const nextInvoices = [...currentInvoices, invoice];
    writeFallbackStore(nextInvoices);
    return invoice;
  }

  try {
    const db = await openDatabase();

    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(invoice);

      transaction.oncomplete = () => resolve(invoice);
      transaction.onerror = () => reject(transaction.error);
    });

    const refreshedInvoices = await getAllInvoicesStore();
    writeFallbackStore(refreshedInvoices);
    return invoice;
  } catch {
    const currentInvoices = readFallbackStore().filter(
      (entry) => entry.id !== invoice.id,
    );
    const nextInvoices = [...currentInvoices, invoice];
    writeFallbackStore(nextInvoices);
    return invoice;
  }
}

export async function deleteInvoiceStore(invoiceId) {
  if (!hasIndexedDb()) {
    const nextInvoices = readFallbackStore().filter(
      (entry) => entry.id !== invoiceId,
    );
    writeFallbackStore(nextInvoices);
    return invoiceId;
  }

  try {
    const db = await openDatabase();

    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(invoiceId);

      transaction.oncomplete = () => resolve(invoiceId);
      transaction.onerror = () => reject(transaction.error);
    });

    const refreshedInvoices = await getAllInvoicesStore();
    writeFallbackStore(refreshedInvoices);
    return invoiceId;
  } catch {
    const nextInvoices = readFallbackStore().filter(
      (entry) => entry.id !== invoiceId,
    );
    writeFallbackStore(nextInvoices);
    return invoiceId;
  }
}
