const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hasText(value) {
  return Boolean(String(value ?? '').trim());
}

export function validateInvoice(formValues, options = {}) {
  const mode = options.mode ?? 'submit';

  if (mode === 'draft') {
    return {};
  }

  const errors = {};

  if (!hasText(formValues.description)) {
    errors.description = 'Project description is required.';
  }

  if (!hasText(formValues.createdAt)) {
    errors.createdAt = 'Invoice date is required.';
  }

  if (!hasText(formValues.clientName)) {
    errors.clientName = 'Client name is required.';
  }

  if (!hasText(formValues.clientEmail)) {
    errors.clientEmail = 'Client email is required.';
  } else if (!EMAIL_PATTERN.test(formValues.clientEmail)) {
    errors.clientEmail = 'Enter a valid email address.';
  }

  ['street', 'city', 'postCode', 'country'].forEach((field) => {
    if (!hasText(formValues.senderAddress[field])) {
      errors[`senderAddress.${field}`] = 'Required field.';
    }

    if (!hasText(formValues.clientAddress[field])) {
      errors[`clientAddress.${field}`] = 'Required field.';
    }
  });

  if (!formValues.items.length) {
    errors.items = 'Add at least one invoice item.';
    return errors;
  }

  formValues.items.forEach((item, index) => {
    if (!hasText(item.name)) {
      errors[`items.${index}.name`] = 'Item name is required.';
    }

    if (!(Number(item.quantity) > 0)) {
      errors[`items.${index}.quantity`] = 'Quantity must be greater than 0.';
    }

    if (!(Number(item.price) > 0)) {
      errors[`items.${index}.price`] = 'Price must be greater than 0.';
    }
  });

  return errors;
}
