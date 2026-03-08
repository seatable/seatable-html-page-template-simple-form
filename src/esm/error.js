export const FORM_VALIDATION_ERRORS = {
  DATE_REQUIRED: 'Please select a date.',
  APPLICANT_REQUIRED: 'Please enter the applicant.',
  INVENTORY_CODE_REQUIRED: 'Please enter the inventory code.',
  QUANTITY_REQUIRED: 'Please enter the quantity.',
  QUANTITY_INVALID: 'Quantity must be greater than 0.',
  OVER_STOCK: 'Exceeds the current stock of the associated product.',
  FORM_INVALID: 'Please correct the errors in the form first.',
  INVALID_INVENTORY_CODE: 'There are invalid inventory codes, please check and re-enter!',
  DUPLICATE_INVENTORY_CODE: 'This product is already in the list, please do not add it again.',
  REASON_REQUIRED: (reasonLabel) => `Please select ${reasonLabel}`,
  REQUIRED_FIELDS: (reasonLabel) => `Please complete all required fields for all products (Inventory Code, Quantity, ${reasonLabel})!`,
};
