import { ERROR_MESSAGES, INBOUND_STATUS, APPROVALSTATUS, TABLE_NAME_MAP } from './constants';
import Context from './context';
import UIManager from './ui-manager';
import { getPendingOrders, getOrders, getColumnByName } from './utils';

export default class App {
  constructor() {
    this.uiManager = new UIManager();
    this.context = new Context();

    this.currentTab = INBOUND_STATUS.PENDING;
    this.validationErrorMode = false;
    this.allOrders = [];
    this.inboundOrderProducts = [];
    this.outboundOrdersProducts = [];
    this.inboundOrderProducts = [];
    this.outboundOrdersProducts = [];
    this.bindGlobalEvents();
  }

  bindGlobalEvents() {
    // Global functions for HTML onclick handlers
    window.retryLoading = () => this.retryLoading();
    window.closeError = () => this.closeError();
    window.toggleCard = (id) => this.toggleCard(id);
    window.approve = (id) => this.approve(id);
    window.reject = (id) => this.reject(id);
    window.switchTab = (tab) => this.switchTab(tab);
    window.orderAgain = () => this.orderAgain();
  }

  async init() {
    this.uiManager.showLoading();
    const options = window.__HTML_PAGE_DEV_CONFIG__ || null;

    try {
      await this.context.init(options);
      const inboundRecordResults = await this.context.loadInboundRecord();
      const outboundRecordResults = await this.context.loadOutboundRecord();
      const result = await this.context.loadInventoryTransaction();
      const { inboundOrderProducts, outboundOrdersProducts } = getOrders(inboundRecordResults, outboundRecordResults);
      const { pendingOrders } = getPendingOrders(inboundOrderProducts, outboundOrdersProducts, inboundRecordResults, outboundRecordResults);
      this.inboundOrderProducts = inboundOrderProducts;
      this.outboundOrdersProducts = outboundOrdersProducts;
      this.inboundRecordResults = inboundRecordResults;
      this.outboundRecordResults = outboundRecordResults;
      this.pendingOrders = pendingOrders;
      // Update stats in UI
      this.updateOrdersTotal();
      this.renderFilteredOrders();
      if (!result.success) {
        this.handleLoadError(result.error, true);
        return;
      }
      this.uiManager.hideLoading();
    } catch (error) {
      this.handleLoadError(error, true);
    }
  }

  updateOrdersTotal() {
    document.getElementById('stat-pending').textContent = this.pendingOrders.length;
    document.getElementById('stat-in').textContent = this.inboundOrderProducts.length;
    document.getElementById('stat-out').textContent = this.outboundOrdersProducts.length;
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

  getFormData() {
    return {
      date: document.getElementById('date')?.value || '',
      applicant: document.getElementById('applicant')?.value?.trim() || '',
      remarks: document.getElementById('remarks')?.value?.trim() || '',
      sumQty: this.products.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0),
    };
  }

  toggleCard(id) {
    const detail = document.getElementById(`detail-${id}`);
    const btn = document.getElementById(`btn-${id}`);
    if (detail && btn) {
      const isExpanded = detail.style.display !== 'none';
      detail.style.display = isExpanded ? 'none' : 'block';
      btn.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
    }
  }

  reject(orderId) {
    const prefix = orderId.substring(0, 2);
    const isInbound = prefix === 'RK'; // RK for inbound, CK for outbound
    const { rows, columns } = isInbound ? this.inboundRecordResults : this.outboundRecordResults;
    const relatedRows = rows.filter(row => row[getColumnByName('document_number', columns).key] === orderId);
    const commentValue = document.getElementById(`remark-${orderId}`)?.value?.trim() || '';
    if (!commentValue) {
      this.uiManager.showError('拒绝原因缺失', '请填写驳回意见后再提交');
      return;
    }
    const approvalKey = isInbound ? 'inbound_approval_result' : 'outbound_approval_result';
    const rowsData = relatedRows.map(row => ({
      row_id: row._id,
      row: {
        [approvalKey]: APPROVALSTATUS.REJECTED,
        review_comment: commentValue,
      }
    }));
    this.context.sdk.batchUpdateRows({
      tableName: isInbound ? TABLE_NAME_MAP.INBOUND_RECORD : TABLE_NAME_MAP.OUTBOUND_RECORD,
      rowsData
    }).then(success => {
      if (success) {
        this.uiManager.showSuccess();
      }
    }).catch(error => {
      const errorTitle = '拒绝订单失败';
      const errorMsg = error?.response?.status === 403
        ? ERROR_MESSAGES.NO_PERMISSION
        : ERROR_MESSAGES.SUBMIT_FAILED;
      this.uiManager.showError(errorTitle, errorMsg);
    });
  }

  async approve(orderId) {
    const prefix = orderId.substring(0, 2);
    const isInbound = prefix === 'RK'; // RK for inbound, CK for outbound
    const { rows, columns } = isInbound ? this.inboundRecordResults : this.outboundRecordResults;
    const relatedRows = rows.filter(row => row[getColumnByName('document_number', columns).key] === orderId);
    const inventoryCodeColumn = getColumnByName('inventory_code', columns);
    const quantityColumn = getColumnByName('quantity', columns);
    const currentQuantityColumn = getColumnByName('current_quantity', columns);
    const orderItemsData = relatedRows.map(row => {
      const tracsaction = {
        operation_type: isInbound ? '入库' : '出库',
        inventory_record: row[inventoryCodeColumn.key].map(record => record.row_id),
        related_inventory_form_no: orderId,
        old_quantity: Number(row[currentQuantityColumn.key].join('')),
        quantity: row[quantityColumn.key],
        new_quantity: isInbound ? Number(row[currentQuantityColumn.key].join('')) + row[quantityColumn.key] : Number(row[currentQuantityColumn.key].join('')) - row[quantityColumn.key],
      };
      isInbound ? tracsaction.inbound_record = [row._id] : tracsaction.outbound_record = [row._id];
      return tracsaction;
    });

    const result = await this.context.submitOrder(orderItemsData, relatedRows, columns, isInbound, true);
    if (result.success) {
      this.uiManager.showSuccess();
    } else {
      const errorTitle = '提交订单失败';
      const errorMsg = result.error?.response?.status === 403
        ? ERROR_MESSAGES.NO_PERMISSION
        : ERROR_MESSAGES.SUBMIT_FAILED;
      this.uiManager.showError(errorTitle, errorMsg);
    }
  }

  orderAgain() {
    this.uiManager.hideSuccess();
    this.init();
  }

  switchTab(tab) {
    this.currentTab = tab;
    this.renderFilteredOrders();
  }

  renderFilteredOrders() {
    const orders = this.currentTab === INBOUND_STATUS.PENDING ? this.pendingOrders
      : this.currentTab === INBOUND_STATUS.IN
        ? this.inboundOrderProducts
        : this.outboundOrdersProducts;
    this.uiManager.renderOrders(orders, this.inboundRecordResults, this.outboundRecordResults);
  }
}
