import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoices } from '../context/InvoiceContext';
import { useDialogLayer } from '../hooks/useDialogLayer';
import {
  createEmptyItem,
  invoiceToFormValues,
  PAYMENT_TERMS_OPTIONS,
} from '../lib/invoices';
import { validateInvoice } from '../lib/validators';

function updateErrorMap(currentErrors, prefix) {
  return Object.fromEntries(
    Object.entries(currentErrors).filter(([key]) => key !== prefix),
  );
}

function getFieldError(errors, fieldName) {
  return errors[fieldName];
}

export function InvoiceFormDrawer({ formState, onClose }) {
  const navigate = useNavigate();
  const { createInvoice, getInvoiceById, updateInvoice } = useInvoices();
  const drawerRef = useRef(null);
  const [formValues, setFormValues] = useState(invoiceToFormValues());
  const [errors, setErrors] = useState({});
  const [isBusy, setIsBusy] = useState(false);
  const isEditMode = formState.mode === 'edit';
  const activeInvoice = isEditMode
    ? getInvoiceById(formState.invoiceId)
    : undefined;

  useDialogLayer(drawerRef, formState.isOpen, onClose);

  useEffect(() => {
    if (!formState.isOpen) {
      return;
    }

    setFormValues(invoiceToFormValues(activeInvoice));
    setErrors({});
    setIsBusy(false);
  }, [activeInvoice, formState.isOpen]);

  useEffect(() => {
    if (formState.isOpen && isEditMode && !activeInvoice) {
      onClose();
    }
  }, [activeInvoice, formState.isOpen, isEditMode, onClose]);

  if (!formState.isOpen) {
    return null;
  }

  const clearFieldError = (fieldName) => {
    setErrors((currentErrors) => updateErrorMap(currentErrors, fieldName));
  };

  const updateTopLevelField = (fieldName, value) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }));
    clearFieldError(fieldName);
  };

  const updateAddressField = (section, fieldName, value) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [section]: {
        ...currentValues[section],
        [fieldName]: value,
      },
    }));
    clearFieldError(`${section}.${fieldName}`);
  };

  const updateItemField = (itemIndex, fieldName, value) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      items: currentValues.items.map((item, index) =>
        index === itemIndex
          ? {
              ...item,
              [fieldName]: value,
            }
          : item,
      ),
    }));
    clearFieldError(`items.${itemIndex}.${fieldName}`);
    clearFieldError('items');
  };

  const addNewItem = () => {
    setFormValues((currentValues) => ({
      ...currentValues,
      items: [...currentValues.items, createEmptyItem()],
    }));
    clearFieldError('items');
  };

  const removeItem = (itemId) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      items: currentValues.items.filter((item) => item.id !== itemId),
    }));
  };

  const saveInvoice = async (intent) => {
    const currentStatus = activeInvoice?.status ?? 'pending';
    const nextStatus =
      intent === 'draft'
        ? 'draft'
        : intent === 'send'
          ? 'pending'
          : currentStatus;
    const validationMode =
      nextStatus === 'draft' && intent !== 'send' ? 'draft' : 'submit';
    const nextErrors = validateInvoice(formValues, {
      mode: validationMode,
    });

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setIsBusy(true);

    try {
      const savedInvoice = isEditMode
        ? await updateInvoice(formState.invoiceId, formValues, nextStatus)
        : await createInvoice(formValues, nextStatus);

      onClose();
      navigate(`/invoice/${savedInvoice.id}`);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="drawer-layer" role="presentation" onMouseDown={onClose}>
      <aside
        className="invoice-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-form-title"
        ref={drawerRef}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="invoice-drawer__header">
          {isEditMode ? (
            <p className="invoice-drawer__eyebrow">
              Editing <span className="hash-mark">#</span>{activeInvoice?.id}
            </p>
          ) : null}
          <div>
            <h2 id="invoice-form-title">
              {isEditMode ? 'Edit invoice' : 'Create invoice'}
            </h2>
            <p className="invoice-drawer__copy">
              Capture billing details, line items, and invoice terms in one
              place.
            </p>
          </div>
        </div>

        <div className="invoice-drawer__body">
          <section className="form-section">
            <div className="form-section__head">
              <h3>Bill From</h3>
            </div>
            <div className="form-grid">
              <label
                className={`field field--wide ${
                  getFieldError(errors, 'senderAddress.street')
                    ? 'field--error'
                    : ''
                }`}
              >
                <span>Street Address</span>
                <input
                  value={formValues.senderAddress.street}
                  onChange={(event) =>
                    updateAddressField(
                      'senderAddress',
                      'street',
                      event.target.value,
                    )
                  }
                />
                <small>{getFieldError(errors, 'senderAddress.street')}</small>
              </label>

              {['city', 'postCode', 'country'].map((fieldName) => (
                <label
                  key={fieldName}
                  className={`field ${
                    getFieldError(errors, `senderAddress.${fieldName}`)
                      ? 'field--error'
                      : ''
                  }`}
                >
                  <span>
                    {fieldName === 'postCode'
                      ? 'Post Code'
                      : fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}
                  </span>
                  <input
                    value={formValues.senderAddress[fieldName]}
                    onChange={(event) =>
                      updateAddressField(
                        'senderAddress',
                        fieldName,
                        event.target.value,
                      )
                    }
                  />
                  <small>
                    {getFieldError(errors, `senderAddress.${fieldName}`)}
                  </small>
                </label>
              ))}
            </div>
          </section>

          <section className="form-section">
            <div className="form-section__head">
              <h3>Bill To</h3>
            </div>
            <div className="form-grid">
              <label
                className={`field ${
                  getFieldError(errors, 'clientName') ? 'field--error' : ''
                }`}
              >
                <span>Client Name</span>
                <input
                  value={formValues.clientName}
                  onChange={(event) =>
                    updateTopLevelField('clientName', event.target.value)
                  }
                />
                <small>{getFieldError(errors, 'clientName')}</small>
              </label>

              <label
                className={`field field--wide ${
                  getFieldError(errors, 'clientEmail') ? 'field--error' : ''
                }`}
              >
                <span>Client Email</span>
                <input
                  type="email"
                  value={formValues.clientEmail}
                  onChange={(event) =>
                    updateTopLevelField('clientEmail', event.target.value)
                  }
                />
                <small>{getFieldError(errors, 'clientEmail')}</small>
              </label>

              <label
                className={`field field--wide ${
                  getFieldError(errors, 'clientAddress.street')
                    ? 'field--error'
                    : ''
                }`}
              >
                <span>Street Address</span>
                <input
                  value={formValues.clientAddress.street}
                  onChange={(event) =>
                    updateAddressField(
                      'clientAddress',
                      'street',
                      event.target.value,
                    )
                  }
                />
                <small>{getFieldError(errors, 'clientAddress.street')}</small>
              </label>

              {['city', 'postCode', 'country'].map((fieldName) => (
                <label
                  key={fieldName}
                  className={`field ${
                    getFieldError(errors, `clientAddress.${fieldName}`)
                      ? 'field--error'
                      : ''
                  }`}
                >
                  <span>
                    {fieldName === 'postCode'
                      ? 'Post Code'
                      : fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}
                  </span>
                  <input
                    value={formValues.clientAddress[fieldName]}
                    onChange={(event) =>
                      updateAddressField(
                        'clientAddress',
                        fieldName,
                        event.target.value,
                      )
                    }
                  />
                  <small>
                    {getFieldError(errors, `clientAddress.${fieldName}`)}
                  </small>
                </label>
              ))}

              <label
                className={`field ${
                  getFieldError(errors, 'createdAt') ? 'field--error' : ''
                }`}
              >
                <span>Invoice Date</span>
                <input
                  type="date"
                  value={formValues.createdAt}
                  onChange={(event) =>
                    updateTopLevelField('createdAt', event.target.value)
                  }
                />
                <small>{getFieldError(errors, 'createdAt')}</small>
              </label>

              <label className="field">
                <span>Payment Terms</span>
                <select
                  value={formValues.paymentTerms}
                  onChange={(event) =>
                    updateTopLevelField('paymentTerms', event.target.value)
                  }
                >
                  {PAYMENT_TERMS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <small>&nbsp;</small>
              </label>

              <label
                className={`field field--wide ${
                  getFieldError(errors, 'description') ? 'field--error' : ''
                }`}
              >
                <span>Project Description</span>
                <input
                  value={formValues.description}
                  onChange={(event) =>
                    updateTopLevelField('description', event.target.value)
                  }
                />
                <small>{getFieldError(errors, 'description')}</small>
              </label>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section__head">
              <h3>Line Items</h3>
              <p>Add the services, products, or hours being billed.</p>
            </div>

            <div className="item-stack">
              {formValues.items.map((item, index) => (
                <article key={item.id} className="item-editor">
                  <label
                    className={`field field--wide ${
                      getFieldError(errors, `items.${index}.name`)
                        ? 'field--error'
                        : ''
                    }`}
                  >
                    <span>Item Name</span>
                    <input
                      value={item.name}
                      onChange={(event) =>
                        updateItemField(index, 'name', event.target.value)
                      }
                    />
                    <small>{getFieldError(errors, `items.${index}.name`)}</small>
                  </label>

                  <div className="item-editor__grid">
                    <label
                      className={`field ${
                        getFieldError(errors, `items.${index}.quantity`)
                          ? 'field--error'
                          : ''
                      }`}
                    >
                      <span>Qty.</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItemField(index, 'quantity', event.target.value)
                        }
                      />
                      <small>
                        {getFieldError(errors, `items.${index}.quantity`)}
                      </small>
                    </label>

                    <label
                      className={`field ${
                        getFieldError(errors, `items.${index}.price`)
                          ? 'field--error'
                          : ''
                      }`}
                    >
                      <span>Price</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(event) =>
                          updateItemField(index, 'price', event.target.value)
                        }
                      />
                      <small>
                        {getFieldError(errors, `items.${index}.price`)}
                      </small>
                    </label>

                    <button
                      type="button"
                      className="button button--icon"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {getFieldError(errors, 'items') ? (
              <p className="form-feedback form-feedback--error">
                {getFieldError(errors, 'items')}
              </p>
            ) : null}

            <button
              type="button"
              className="button button--secondary button--full"
              onClick={addNewItem}
            >
              + Add New Item
            </button>
          </section>
        </div>

        <footer className="invoice-drawer__footer">
          <div className="invoice-drawer__actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={onClose}
            >
              {isEditMode ? 'Cancel' : 'Discard'}
            </button>

            {!isEditMode || activeInvoice?.status === 'draft' ? (
              <button
                type="button"
                className="button button--ghost"
                onClick={() => saveInvoice('draft')}
                disabled={isBusy}
              >
                Save as Draft
              </button>
            ) : null}

            {isEditMode && activeInvoice?.status === 'draft' ? (
              <button
                type="button"
                className="button button--primary"
                onClick={() => saveInvoice('send')}
                disabled={isBusy}
              >
                {isBusy ? 'Saving...' : 'Save & Send'}
              </button>
            ) : (
              <button
                type="button"
                className="button button--primary"
                onClick={() => saveInvoice(isEditMode ? 'save' : 'send')}
                disabled={isBusy}
              >
                {isBusy
                  ? 'Saving...'
                  : isEditMode
                    ? 'Save Changes'
                    : 'Save & Send'}
              </button>
            )}
          </div>
        </footer>
      </aside>
    </div>
  );
}
