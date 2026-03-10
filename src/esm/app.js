import { ERROR_MESSAGES, INBOUND_REASONS, OUTBOUND_REASONS, FORMSTATUS, FORM_VALIDATION_ERRORS } from './constants';
import Context from './context';
import InventoryrModel from './model/inventory';
import UIManager from './ui-manager';

export default class App {
  constructor() {
    this.inventoryModel = new InventoryrModel();
    this.uiManager = new UIManager();
    this.context = new Context();

    this.nextId = 1;
    this.products = [this.createEmptyProduct(this.nextId++)];
    this.activeTab = FORMSTATUS.INBOUND;
    this.mockInventoryData = [];
    this.staticFieldListenersBound = false;
    this.validationErrorMode = false;
    this.inboundRecordResults = [];
    this.outboundRecordResults = [];
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
    this.setDefaultDate();
    this.uiManager.showLoading();

    const options = window.__HTML_PAGE_DEV_CONFIG__ || null;

    try {
      await this.context.init(options);
      const result = await this.context.loadProducts();
      const inboundRecordResults = await this.context.loadInboundRecord();
      const outboundRecordResults = await this.context.loadOutboundRecord();
      this.inboundRecordResults = inboundRecordResults;
      this.outboundRecordResults = outboundRecordResults;
      if (!result.success) {
        this.handleLoadError(result.error, true);
        return;
      }

      this.inventoryModel.setInventories(result.rows, result.columns);
      this.mockInventoryData = this.getMockInventoryData(result).map(item => ({ ...item }));
      this.bindStaticFieldListeners();
      this.renderInventoryHints();
      this.uiManager.renderProductLists(this.products, this.activeTab, this.updateSummary.bind(this));
      this.refreshDuplicateCodeErrors();
      this.uiManager.hideLoading();
    } catch (error) {
      this.handleLoadError(error, true);
    }
  }

  createEmptyProduct(id) {
    return { id, inventory_code: '', product_name: '', specification: '', product_category: '', unit: '', current_quantity: '', quantity: '', reason: '', contract: '', };
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
    const inventoryCodeKey = getKey('inventory_code');
    const nameKey = getKey('product_name');
    const specificationKey = getKey('specification');
    const categoryKey = getKey('product_category');
    const unitKey = getKey('unit');
    const currentQuantityKey = getKey('current_quantity');

    return result.rows.map(row => ({
      _id: row._id,
      inventory_code: String(row[inventoryCodeKey] || ''),
      product_name: Array.isArray(row[nameKey]) ? row[nameKey].join('') : String(row[nameKey] || ''),
      specification: Array.isArray(row[specificationKey]) ? row[specificationKey].join(' ') : String(row[specificationKey] || ''),
      product_category: Array.isArray(row[categoryKey]) ? row[categoryKey].join('') : String(row[categoryKey] || ''),
      unit: String(row[unitKey] || ''),
      current_quantity: row[currentQuantityKey],
    }));
  }

  renderInventoryHints() {
    this.uiManager.renderInventories(this.mockInventoryData, this.inventoryModel);
  }

  isDuplicateInventoryCode(code, currentId) {
    const normalized = String(code ?? '').trim().toUpperCase();
    if (!normalized) return false;
    const matches = this.products.filter(product => {
      const candidate = String(product.inventory_code || '').trim().toUpperCase();
      return candidate && candidate === normalized;
    });
    if (matches.length <= 1) return false;
    const firstMatch = matches[0];
    return currentId !== firstMatch?.id;
  }

  refreshDuplicateCodeErrors() {
    this.products.forEach(p => {
      const fieldId = `code_${p.id}`;
      const errorId = `code_error_${p.id}`;
      if (this.isDuplicateInventoryCode(p.inventory_code, p.id)) {
        this.setFieldValidationError(fieldId, errorId, FORM_VALIDATION_ERRORS.DUPLICATE_INVENTORY_CODE);
      } else {
        this.clearFieldValidationError(fieldId, errorId);
      }
    });
  }

  setDefaultDate() {
    const dateLabel = document.querySelector('label[for="date"]') || document.querySelector('#date')?.closest('.form-group')?.querySelector('.form-label');
    if (dateLabel) dateLabel.childNodes[dateLabel.childNodes.length - 1].textContent = this.isInbound() ? ' 入库日期 ' : ' 出库日期 ';
    const dateInput = document.getElementById('date');
    if (!dateInput) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;
  }

  addProduct() {
    this.products.push(this.createEmptyProduct(this.nextId++));
    this.uiManager.renderProductLists(this.products, this.activeTab, this.updateSummary.bind(this));
    this.refreshDuplicateCodeErrors();
  }

  removeProduct(id) {
    this.products = this.products.filter(p => p.id !== id);
    if (this.products.length === 0) {
      this.products = [this.createEmptyProduct(this.nextId++)];
    }
    this.uiManager.renderProductLists(this.products, this.activeTab, this.updateSummary.bind(this));
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

    p.inventory_code = val;
    const data = this.mockInventoryData.find(item => String(item.inventory_code).toUpperCase() === val);

    if (data) {
      Object.assign(p, {
        product_name: data.product_name,
        specification: data.specification,
        product_category: data.product_category,
        unit: data.unit,
        current_quantity: data.current_quantity,
      });
    } else {
      Object.assign(p, { product_name: '', specification: '', product_category: '', unit: '', current_quantity: '' });
    }

    p.quantity = document.getElementById(`qty_${id}`)?.value || p.quantity;
    p.reason = document.getElementById(`reason_${id}`)?.value || p.reason;
    p.contract = document.getElementById(`contract_${id}`)?.value || p.contract;

    if (val && this.isDuplicateInventoryCode(val, id)) {
      this.setFieldValidationError(`code_${id}`, `code_error_${id}`, FORM_VALIDATION_ERRORS.DUPLICATE_INVENTORY_CODE);
    } else {
      this.clearFieldValidationError(`code_${id}`, `code_error_${id}`);
    }

    this.uiManager.renderProductLists(this.products, this.activeTab, this.updateSummary.bind(this));
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
      this.validateQuantityField(id);
    } else if (field === 'reason') {
      this.clearFieldValidationError(`reason_${id}`, `reason_error_${id}`);
    }

    this.updateSummary();
  }

  orderAgain() {
    this.uiManager.hideSuccess();
    this.resetForm(1);
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
    const stockLimitSource = p.current_quantity;
    const stockNumber = Number(stockLimitSource);
    const hasQuantity = String(p.quantity ?? '').trim() !== '';
    const hasStock = String(stockLimitSource ?? '').trim() !== '' && !Number.isNaN(stockNumber);
    const shouldCheckStock = !this.isInbound() && hasStock;
    const isOverStock = hasQuantity && !Number.isNaN(quantityNumber) && shouldCheckStock && quantityNumber > stockNumber;

    if (isOverStock) {
      this.setFieldValidationError(`qty_${id}`, `qty_error_${id}`, FORM_VALIDATION_ERRORS.OVER_STOCK);
    } else {
      this.clearFieldValidationError(`qty_${id}`, `qty_error_${id}`);
    }
  }

  validateSubmitFormFields() {
    let isValid = true;

    const date = document.getElementById('date')?.value;
    const applicant = document.getElementById('applicant')?.value?.trim() || '';
    const reasonLabel = this.isInbound() ? '入库原因' : '出库原因';

    if (!date) {
      isValid = false;
      this.setFieldValidationError('date', 'date_error', FORM_VALIDATION_ERRORS.DATE_REQUIRED);
    } else {
      this.clearFieldValidationError('date', 'date_error');
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
      } else if (this.isDuplicateInventoryCode(code, p.id)) {
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

      p.inventory_code = code;
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
    document.getElementById('formTitle').textContent = this.isInbound() ? '新建入库单' : '新建出库单';
    document.getElementById('submitBtnText').textContent = this.isInbound() ? '提交入库单' : '提交出库单';

    const dateLabel = document.querySelector('label[for="date"]') || document.querySelector('#date')?.closest('.form-group')?.querySelector('.form-label');
    if (dateLabel) dateLabel.childNodes[dateLabel.childNodes.length - 1].textContent = this.isInbound() ? ' 入库日期 ' : ' 出库日期 ';
    this.products = [];
    this.uiManager.renderProductLists(this.products, this.activeTab, this.updateSummary.bind(this));
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
    const filled = this.products.filter(p => p.inventory_code && String(p.quantity).trim() && p.reason).length;
    const types = this.products.filter(p => String(p.inventory_code || '').trim()).length;

    if (sumTypesEl) sumTypesEl.textContent = String(types);
    if (sumQtyEl) sumQtyEl.textContent = String(sumQty);
    if (sumFilledEl) sumFilledEl.textContent = String(filled);
    if (sumTotalEl) sumTotalEl.textContent = `/${total}`;
  }

  resetForm(count) {
    const targetCount = (typeof count === 'number' ? count : this.products.length) || 1;
    this.products = Array.from({ length: targetCount }, () => this.createEmptyProduct(this.nextId++));

    const applicantEl = document.getElementById('applicant');
    const remarksEl = document.getElementById('remarks');
    if (applicantEl) applicantEl.value = '';
    if (remarksEl) remarksEl.value = '';
    this.setDefaultDate();
    this.renderInventoryHints();

    this.uiManager.renderProductLists(this.products, this.activeTab, this.updateSummary.bind(this));
    this.refreshDuplicateCodeErrors();
    this.clearFieldValidationError('date', 'date_error');
    this.clearFieldValidationError('applicant', 'applicant_error');
  }

  getFormData() {
    return {
      date: document.getElementById('date')?.value || '',
      applicant: document.getElementById('applicant')?.value?.trim() || '',
      remark: document.getElementById('remarks')?.value?.trim() || '',
      sumQty: this.products.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0),
    };
  }

  async submitForm() {
    const errorTitle = '输入无效';
    if (!this.validateSubmitFormFields()) {
      return this.handleLoadError(null, false, errorTitle, FORM_VALIDATION_ERRORS.FORM_INVALID);
    }

    this.products.forEach(p => {
      p.quantity = document.getElementById(`qty_${p.id}`)?.value || '';
      p.reason = document.getElementById(`reason_${p.id}`)?.value || '';
      p.contract = document.getElementById(`contract_${p.id}`)?.value || '';
    });

    const reasonLabel = this.isInbound() ? '入库原因' : '出库原因';
    const invalid = this.products.filter(p => !p.inventory_code || !p.quantity || !p.reason);
    if (invalid.length) {
      return this.handleLoadError(null, false, errorTitle, FORM_VALIDATION_ERRORS.REQUIRED_FIELDS(reasonLabel));
    }

    const badCodes = this.products.filter(p => p.inventory_code && !p.product_name);
    if (badCodes.length) {
      return this.handleLoadError(null, false, errorTitle, FORM_VALIDATION_ERRORS.INVALID_INVENTORY_CODE);
    }

    const reasons = this.isInbound() ? INBOUND_REASONS : OUTBOUND_REASONS;
    const formData = this.getFormData();
    const documentNumberPrefix = this.isInbound() ? 'RK' : 'CK';
    const rows = this.isInbound() ? this.inboundRecordResults.rows : this.outboundRecordResults.rows;
    const columns = this.isInbound() ? this.inboundRecordResults.columns : this.outboundRecordResults.columns;

    const documentNumberKey = columns.find(col => col.name === 'document_number')?.key;
    const lastDocumentNumber = rows.length > 0 ? rows[rows.length - 1][documentNumberKey] : null;
    let nextNumber = 1;
    let numLength = 4;
    if (lastDocumentNumber) {
      const match = lastDocumentNumber.match(/-(\d+)$/);
      if (match) {
        const numStr = match[1];
        nextNumber = parseInt(numStr, 10) + 1;
        numLength = numStr.length;
      }
    }
    const newDocumentNumber = `${documentNumberPrefix}-${String(nextNumber).padStart(numLength, '0')}`;
    const orderItemsData = this.products.map(product => {
      const matchedInventory = this.mockInventoryData.find(inv => inv.inventory_code === product.inventory_code);
      const productCopy = {
        contract: product.contract,
        date: formData.date,
        applicant: formData.applicant,
        remark: formData.remark,
        inventory_code: matchedInventory?._id ? [matchedInventory._id] : [],
        quantity: Number(product.quantity) || 0,
        document_number: newDocumentNumber,
      };
      if (this.isInbound()) {
        productCopy.inbound_reason = reasons.find(r => r.id === product.reason)?.name || '';
      } else {
        productCopy.outbound_reason = reasons.find(r => r.id === product.reason)?.name || '';
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
