import { ERROR_MESSAGES, INBOUND_REASONS, OUTBOUND_REASONS, FORMSTATUS } from './constants';
import Context from './context';
import InventoryrModel from './model/inventory';
import UIManager from './ui-manager';
import { FORM_VALIDATION_ERRORS } from './error';

export default class App {
  constructor() {
    this.inventoryModel = new InventoryrModel();
    this.uiManager = new UIManager();
    this.context = new Context();

    this.nextId = 1;
    this.products = [this.createEmptyProduct(this.nextId++)];
    this.activeTab = FORMSTATUS.INBOUND;
    this.baseInventoryData = [];
    this.mockInventoryData = [];
    this.staticFieldListenersBound = false;
    this.validationErrorMode = false;

    this.bindGlobalEvents();
  }

  bindGlobalEvents() {
    // Global functions for HTML onclick handlers
    window.retryLoading = () => this.retryLoading();
    window.closeError = () => this.closeError();
    window.orderAgain = () => this.orderAgain();
    window.addProduct = () => this.addProduct();
    window.resetForm = () => this.resetForm();
    window.submitForm = () => this.submitForm();
    window.removeProduct = (id) => this.removeProduct(id);
    window.switchTab = (tab) => this.switchTab(tab);
    window.onFieldInput = (id, field, value) => this.onFieldInput(id, field, value);
    window.onCodeInput = (id, value) => this.onCodeInput(id, value);
  }

  async init() {
    this.setDefaultOrderDate();
    this.uiManager.showLoading();

    const options = window.__HTML_PAGE_DEV_CONFIG__ || null;
    if (options) {
      console.log('Local settings:', options);
    }

    try {
      await this.context.init(options);
      const result = await this.context.loadProducts();
      if (!result.success) {
        this.handleLoadError(result.error, true);
        return;
      }

      this.inventoryModel.setInventories(result.rows, result.columns);
      this.baseInventoryData = this.getMockInventoryData(result);
      this.recalculateInventoryAvailability();
      this.bindStaticFieldListeners();
      this.renderInventoryHints();
      this.uiManager.renderProductLists(this.products, this.activeTab, this.updateSummary.bind(this));
      this.refreshProductStocksInDom();
      this.refreshDuplicateCodeErrors();
      this.uiManager.hideLoading();
    } catch (error) {
      this.handleLoadError(error, true);
    }
  }

  createEmptyProduct(id) {
    return { id, inventoryCode: '', name: '', specification: '', category: '', unit: '', currentStock: '', baseStock: '', quantity: '', reason: '', contract: '', };
  }

  retryLoading(){
    if (this.validationErrorMode) {
      this.validationErrorMode = false;
      this.uiManager.hideError();
      return;
    }
    this.uiManager.hideError();
    this.init();
  }

  closeError() {
    this.validationErrorMode = false;
    this.uiManager.hideError();
  }

  bindStaticFieldListeners() {
    if (this.staticFieldListenersBound) return;

    const applicantInput = document.getElementById('applicant');
    if (applicantInput) {
      applicantInput.addEventListener('input', (e) => {
        const value = String(e.target?.value || '').trim();
        if (value) {
          this.clearFieldValidationError('applicant', 'applicant_error');
        }
      });
    }

    this.staticFieldListenersBound = true;
  }

  handleLoadError(error, isApiError = true, errorTitle = null, errorMessage = null) {
    this.validationErrorMode = !isApiError;
    if (isApiError && error?.response?.status === 403) {
      this.uiManager.showError(null, ERROR_MESSAGES.NO_PERMISSION);
    } else if (isApiError) {
      this.uiManager.showError(null, ERROR_MESSAGES.LOAD_FAILED);
    } else {
      this.uiManager.showError(errorTitle, errorMessage);
    }
  }

  getMockInventoryData(result) {
    const getKey = (name) => result.columns.find(col => col.name === name)?.key;
    const inventoryCodeKey = getKey('inventoryCode');
    const nameKey = getKey('productName');
    const specificationKey = getKey('specification');
    const categoryKey = getKey('category');
    const unitKey = getKey('unit');
    const currentStockKey = getKey('currentStock');

    return result.rows.map(row => ({
      _id: row._id,
      inventoryCode: String(row[inventoryCodeKey] || ''),
      name: Array.isArray(row[nameKey]) ? row[nameKey].join('') : String(row[nameKey] || ''),
      specification: Array.isArray(row[specificationKey]) ? row[specificationKey].join(' ') : String(row[specificationKey] || ''),
      category: Array.isArray(row[categoryKey]) ? row[categoryKey].join('') : String(row[categoryKey] || ''),
      unit: String(row[unitKey] || ''),
      currentStock: row[currentStockKey],
    }));
  }

  recalculateInventoryAvailability() {
    const remainingByCode = new Map();
    this.baseInventoryData.forEach(item => {
      const code = String(item.inventoryCode || '').trim().toUpperCase();
      const stock = Number(item.currentStock);
      if (!code) return;
      remainingByCode.set(code, Number.isNaN(stock) ? 0 : stock);
    });

    this.products.forEach((p) => {
      const code = String(p.inventoryCode || '').trim().toUpperCase();
      if (!code || !remainingByCode.has(code)) {
        p.currentStock = '';
        return;
      }

      const availableBefore = remainingByCode.get(code);
      const qty = Number(p.quantity);
      const used = Number.isNaN(qty) ? 0 : Math.max(qty, 0);
      const remainingAfter = Math.max(availableBefore - used, 0);
      p.currentStock = remainingAfter;
      remainingByCode.set(code, remainingAfter);
    });

    this.mockInventoryData = this.baseInventoryData.map(item => {
      const code = String(item.inventoryCode || '').trim().toUpperCase();
      if (!remainingByCode.has(code)) {
        return { ...item };
      }
      return {
        ...item,
        currentStock: remainingByCode.get(code),
      };
    });
  }

  renderInventoryHints() {
    this.uiManager.renderInventories(this.mockInventoryData, this.inventoryModel);
  }

  refreshProductStocksInDom() {
    this.products.forEach(p => {
      const stockEl = document.getElementById(`stock_${p.id}`);
      if (!stockEl) return;
      const parts = [];
      if (p.currentStock !== '' && p.currentStock !== undefined && p.currentStock !== null) {
        parts.push(p.currentStock);
      }
      if (p.unit) {
        parts.push(p.unit);
      }
      stockEl.textContent = parts.join(' ').trim();
    });
  }

  hasDuplicateInventoryCode(code, ignoreId = null) {
    const normalized = String(code ?? '').trim().toUpperCase();
    if (!normalized) return false;
    return this.products.some(product => {
      if (product.id === ignoreId) return false;
      const candidate = String(product.inventoryCode || '').trim().toUpperCase();
      return candidate && candidate === normalized;
    });
  }

  refreshDuplicateCodeErrors() {
    this.products.forEach(p => {
      const fieldId = `code_${p.id}`;
      const errorId = `code_error_${p.id}`;
      if (this.hasDuplicateInventoryCode(p.inventoryCode, p.id)) {
        this.setFieldValidationError(fieldId, errorId, FORM_VALIDATION_ERRORS.DUPLICATE_INVENTORY_CODE);
      } else {
        this.clearFieldValidationError(fieldId, errorId);
      }
    });
  }

  setDefaultOrderDate() {
    const dateLabel = document.querySelector('label[for="orderDate"]') || document.querySelector('#orderDate')?.closest('.form-group')?.querySelector('.form-label');
    if (dateLabel) dateLabel.childNodes[dateLabel.childNodes.length - 1].textContent = this.isInbound() ? ' Inbound Date ' : ' Outbound Date ';
    const orderDateInput = document.getElementById('orderDate');
    if (!orderDateInput) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    orderDateInput.value = `${year}-${month}-${day}`;
  }

  addProduct() {
    this.products.push(this.createEmptyProduct(this.nextId++));
    this.recalculateInventoryAvailability();
    this.renderInventoryHints();
    this.uiManager.renderProductLists(this.products, this.activeTab, this.updateSummary.bind(this));
    this.refreshProductStocksInDom();
    this.refreshDuplicateCodeErrors();
  }

  removeProduct(id) {
    this.products = this.products.filter(p => p.id !== id);
    if (this.products.length === 0) {
      this.products = [this.createEmptyProduct(this.nextId++)];
    }
    this.recalculateInventoryAvailability();
    this.renderInventoryHints();
    this.uiManager.renderProductLists(this.products, this.activeTab, this.updateSummary.bind(this));
    this.refreshProductStocksInDom();
    this.refreshDuplicateCodeErrors();
  }

  isInbound() {
    return this.activeTab === FORMSTATUS.INBOUND;
  }

  onCodeInput(id, value) {
    if (id == null) return;
    const val = String(value ?? '').trim().toUpperCase();
    const p = this.products.find(x => x.id === id);
    if (!p) return;

    p.inventoryCode = val;
    const data = this.mockInventoryData.find(item => String(item.inventoryCode).toUpperCase() === val);

    if (data) {
      Object.assign(p, {
        name: data.name,
        specification: data.specification,
        category: data.category,
        unit: data.unit,
        currentStock: data.currentStock,
        baseStock: data.currentStock,
      });
    } else {
      Object.assign(p, { name: '', specification: '', category: '', unit: '', currentStock: '' });
      p.baseStock = '';
    }

    p.quantity = document.getElementById(`qty_${id}`)?.value || p.quantity;
    p.reason = document.getElementById(`reason_${id}`)?.value || p.reason;
    p.contract = document.getElementById(`contract_${id}`)?.value || p.contract;

    this.recalculateInventoryAvailability();
    this.renderInventoryHints();
    this.uiManager.renderProductLists(this.products, this.activeTab, this.updateSummary.bind(this));
    this.refreshProductStocksInDom();
    this.clearFieldValidationError(`code_${id}`, `code_error_${id}`);
    this.refreshDuplicateCodeErrors();
    this.validateQuantityField(id);

    setTimeout(() => {
      const input = document.getElementById(`code_${id}`);
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }, 0);
  }

  onFieldInput(id, field, value) {
    const p = this.products.find(x => x.id === id);
    if (!p) return;

    p[field] = value;
    if (field === 'quantity') {
      this.recalculateInventoryAvailability();
      this.renderInventoryHints();
      this.refreshProductStocksInDom();
      this.validateQuantityField(id);
    } else if (field === 'reason') {
      this.clearFieldValidationError(`reason_${id}`, `reason_error_${id}`);
    }

    this.updateSummary();
  }

  orderAgain() {
    this.uiManager.hideSuccess();
    this.resetForm();
    this.products = [];
  }

  setFieldValidationError(fieldId, errorId, message) {
    const fieldEl = document.getElementById(fieldId);
    if (!fieldEl) return;

    fieldEl.classList.add('input-error');

    let errorEl = document.getElementById(errorId);
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.id = errorId;
      errorEl.className = 'field-error';
      const formGroup = fieldEl.closest('.form-group') || fieldEl.parentElement;
      formGroup?.appendChild(errorEl);
    }
    errorEl.textContent = message;
    errorEl.style.display = '';
  }

  clearFieldValidationError(fieldId, errorId) {
    const fieldEl = document.getElementById(fieldId);
    fieldEl?.classList.remove('input-error');

    const errorEl = document.getElementById(errorId);
    if (errorEl) {
      errorEl.style.display = 'none';
      errorEl.textContent = '';
    }
  }

  validateQuantityField(id) {
    const p = this.products.find(x => x.id === id);
    if (!p) return;

    const quantityNumber = Number(p.quantity);
    const stockLimitSource = p.baseStock ?? p.currentStock;
    const stockNumber = Number(stockLimitSource);
    const hasQuantity = String(p.quantity ?? '').trim() !== '';
    const hasStock = String(stockLimitSource ?? '').trim() !== '' && !Number.isNaN(stockNumber);
    const isOverStock = hasQuantity && !Number.isNaN(quantityNumber) && hasStock && quantityNumber > stockNumber;

    if (isOverStock) {
      this.setFieldValidationError(`qty_${id}`, `qty_error_${id}`, FORM_VALIDATION_ERRORS.OVER_STOCK);
    } else {
      this.clearFieldValidationError(`qty_${id}`, `qty_error_${id}`);
    }
  }

  validateSubmitFormFields() {
    let isValid = true;

    const orderDate = document.getElementById('orderDate')?.value;
    const applicant = document.getElementById('applicant')?.value?.trim() || '';
    const reasonLabel = this.isInbound() ? 'Inbound reason' : 'Outbound reason';

    if (!orderDate) {
      isValid = false;
      this.setFieldValidationError('orderDate', 'orderDate_error', FORM_VALIDATION_ERRORS.DATE_REQUIRED);
    } else {
      this.clearFieldValidationError('orderDate', 'orderDate_error');
    }

    if (!applicant) {
      isValid = false;
      this.setFieldValidationError('applicant', 'applicant_error', FORM_VALIDATION_ERRORS.APPLICANT_REQUIRED);
    } else {
      this.clearFieldValidationError('applicant', 'applicant_error');
    }

    this.products.forEach(p => {
      const code = String(document.getElementById(`code_${p.id}`)?.value || '').trim();
      const qty = String(document.getElementById(`qty_${p.id}`)?.value || '').trim();
      const qtyNumber = Number(qty);
      const reason = String(document.getElementById(`reason_${p.id}`)?.value || '').trim();

      if (!code) {
        isValid = false;
        this.setFieldValidationError(`code_${p.id}`, `code_error_${p.id}`, FORM_VALIDATION_ERRORS.INVENTORY_CODE_REQUIRED);
      } else if (this.hasDuplicateInventoryCode(code, p.id)) {
        isValid = false;
        this.setFieldValidationError(`code_${p.id}`, `code_error_${p.id}`, FORM_VALIDATION_ERRORS.DUPLICATE_INVENTORY_CODE);
      } else {
        this.clearFieldValidationError(`code_${p.id}`, `code_error_${p.id}`);
      }

      const qtyBasicValid = qty && !Number.isNaN(qtyNumber) && qtyNumber > 0;
      if (!qty) {
        isValid = false;
        this.setFieldValidationError(`qty_${p.id}`, `qty_error_${p.id}`, FORM_VALIDATION_ERRORS.QUANTITY_REQUIRED);
      } else if (Number.isNaN(qtyNumber) || qtyNumber <= 0) {
        isValid = false;
        this.setFieldValidationError(`qty_${p.id}`, `qty_error_${p.id}`, FORM_VALIDATION_ERRORS.QUANTITY_INVALID);
      } else {
        this.clearFieldValidationError(`qty_${p.id}`, `qty_error_${p.id}`);
      }

      if (!reason) {
        isValid = false;
        this.setFieldValidationError(`reason_${p.id}`, `reason_error_${p.id}`, FORM_VALIDATION_ERRORS.REASON_REQUIRED(reasonLabel));
      } else {
        this.clearFieldValidationError(`reason_${p.id}`, `reason_error_${p.id}`);
      }

      p.inventoryCode = code;
      p.quantity = qty;
      p.reason = reason;

      if (qtyBasicValid) {
        this.validateQuantityField(p.id);
        const qtyErrorText = document.getElementById(`qty_error_${p.id}`)?.textContent?.trim();
        const qtyErrorShown = document.getElementById(`qty_error_${p.id}`)?.style.display !== 'none';
        if (qtyErrorShown && qtyErrorText) {
          isValid = false;
        }
      }
    });

    return isValid;
  }

  switchTab(tab) {
    this.activeTab = tab;
    document.getElementById('tabInbound')?.classList.toggle('active', this.isInbound());
    document.getElementById('tabOutbound')?.classList.toggle('active', !this.isInbound());
    document.getElementById('formTitle').textContent = this.isInbound() ? 'New Inbound Order' : 'New Outbound Order';
    document.getElementById('submitBtnText').textContent = this.isInbound() ? 'Submit Inbound' : 'Submit Outbound';

    const dateLabel = document.querySelector('label[for="orderDate"]') || document.querySelector('#orderDate')?.closest('.form-group')?.querySelector('.form-label');
    if (dateLabel) dateLabel.childNodes[dateLabel.childNodes.length - 1].textContent = this.isInbound() ? ' Inbound Date ' : ' Outbound Date ';
    this.products = [];
    this.uiManager.renderProductLists(this.products, this.activeTab, this.updateSummary.bind(this));
    this.refreshProductStocksInDom();
    this.refreshDuplicateCodeErrors();
    this.resetForm();
  }

  updateSummary() {
    const sumTypesEl = document.getElementById('sumTypes');
    const sumQtyEl = document.getElementById('sumQty');
    const sumFilledEl = document.getElementById('sumFilled');
    const sumTotalEl = document.getElementById('sumTotal');

    const total = this.products.length;
    const sumQty = this.products.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);
    const filled = this.products.filter(p => p.inventoryCode && String(p.quantity).trim() && p.reason).length;
    const types = this.products.filter(p => String(p.inventoryCode || '').trim()).length;

    if (sumTypesEl) sumTypesEl.textContent = String(types);
    if (sumQtyEl) sumQtyEl.textContent = String(sumQty);
    if (sumFilledEl) sumFilledEl.textContent = String(filled);
    if (sumTotalEl) sumTotalEl.textContent = `/${total}`;
  }

  resetForm() {
    const count = this.products.length || 1;
    this.products = Array.from({ length: count }, () => this.createEmptyProduct(this.nextId++));

    const applicantEl = document.getElementById('applicant');
    const remarksEl = document.getElementById('remarks');
    if (applicantEl) applicantEl.value = '';
    if (remarksEl) remarksEl.value = '';
    this.setDefaultOrderDate();
    this.recalculateInventoryAvailability();
    this.renderInventoryHints();

    this.uiManager.renderProductLists(this.products, this.activeTab, this.updateSummary.bind(this));
    this.refreshProductStocksInDom();
    this.refreshDuplicateCodeErrors();
    this.clearFieldValidationError('orderDate', 'orderDate_error');
    this.clearFieldValidationError('applicant', 'applicant_error');
  }

  getFormData() {
    return {
      orderDate: document.getElementById('orderDate')?.value || '',
      applicant: document.getElementById('applicant')?.value?.trim() || '',
      remarks: document.getElementById('remarks')?.value?.trim() || '',
      sumQty: this.products.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0),
    };
  }

  async submitForm() {
    const errorTitle = 'Invalid input';
    if (!this.validateSubmitFormFields()) {
      return this.handleLoadError(null, false, errorTitle, FORM_VALIDATION_ERRORS.FORM_INVALID);
    }

    this.products.forEach(p => {
      p.quantity = document.getElementById(`qty_${p.id}`)?.value || '';
      p.reason = document.getElementById(`reason_${p.id}`)?.value || '';
      p.contract = document.getElementById(`contract_${p.id}`)?.value || '';
    });

    const reasonLabel = this.isInbound() ? 'Inbound reason' : 'Outbound reason';
    const invalid = this.products.filter(p => !p.inventoryCode || !p.quantity || !p.reason);
    if (invalid.length) {
      return this.handleLoadError(null, false, errorTitle, FORM_VALIDATION_ERRORS.REQUIRED_FIELDS(reasonLabel));
    }

    const badCodes = this.products.filter(p => p.inventoryCode && !p.name);
    if (badCodes.length) {
      return this.handleLoadError(null, false, errorTitle, FORM_VALIDATION_ERRORS.INVALID_INVENTORY_CODE);
    }

    const reasons = this.isInbound() ? INBOUND_REASONS : OUTBOUND_REASONS;
    const formData = this.getFormData();
    console.log('this.products', this.products);
    const orderItemsData = this.products.map(product => {
      const matchedInventory = this.mockInventoryData.find(inv => inv.inventoryCode === product.inventoryCode);
      const productCopy = {
        contract: product.contract,
        orderDate: formData.orderDate,
        applicant: formData.applicant,
        remarks: formData.remarks,
        inventoryCode: matchedInventory?._id ? [matchedInventory._id] : [],
        quantity: Number(product.quantity) || 0,
      };
      if (this.isInbound()) {
        productCopy.inboundReason = reasons.find(r => r.id === product.reason)?.name || '';
      } else {
        productCopy.outboundReason = reasons.find(r => r.id === product.reason)?.name || '';
      }
      return productCopy;
    });

    const result = await this.context.submitOrder(orderItemsData, this.activeTab);

    if (result.success) {
      this.uiManager.showSuccess();
      this.resetForm();
    } else {
      const errorTitle = 'Submit order failed';
      const errorMsg = result.error?.response?.status === 403
        ? ERROR_MESSAGES.NO_PERMISSION
        : ERROR_MESSAGES.SUBMIT_FAILED;
      this.uiManager.showError(errorTitle, errorMsg);
    }
  }
}
