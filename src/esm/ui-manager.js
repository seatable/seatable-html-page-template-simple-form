import { INBOUND_REASONS, OUTBOUND_REASONS } from './constants';
export default class UIManager {
  constructor() {
    this.elements = {
      loadingOverlay: document.getElementById('loadingOverlay'),
      errorOverlay: document.getElementById('errorOverlay'),
      errorTitle: document.getElementById('errorTitle'),
      errorMessage: document.getElementById('errorMessage'),
      successOverlay: document.getElementById('successOverlay'),
      emptyOrderToast: document.getElementById('emptyOrderToast'),
      mainContainer: document.getElementById('mainContainer'),
      inventoryGrid: document.getElementById('inventoryGrid'),
    };
  }

  showLoading() {
    this.elements.loadingOverlay?.classList.remove('hidden');
  }

  hideLoading() {
    this.elements.loadingOverlay?.classList.add('hidden');
    this.elements.mainContainer?.classList.add('loaded');
  }

  showError(title, message) {
    if (title) this.elements.errorTitle.textContent = title;
    if (message) this.elements.errorMessage.textContent = message;
    this.elements.errorOverlay?.classList.add('show');
  }

  hideError() {
    this.elements.errorOverlay?.classList.remove('show');
  }

  showSuccess() {
    this.elements.successOverlay?.classList.add('show');
  }

  hideSuccess() {
    this.elements.successOverlay?.classList.remove('show');
  }

  showEmptyOrderToast() {
    const toast = this.elements.emptyOrderToast;
    toast?.classList.add('show');
    setTimeout(() => toast?.classList.remove('show'), 2500);
  }

  renderInventories(inventories, productModel) {
    const grid = this.elements.inventoryGrid;
    if (!grid) return;

    if (inventories.length === 0) {
      grid.innerHTML = '<div class="empty-message">No inventory</div>';
      return;
    }

    grid.innerHTML = inventories.map(inventory => {
      const inventoryId = inventory._id;
      const code = inventory.inventoryCode ?? productModel.getInventorySKU(inventory);
      const name = inventory.name ?? productModel.getInventoryName(inventory);
      const stock = inventory.currentStock ?? productModel.getCurrentStock(inventory);
      const unit = inventory.unit ?? productModel.getInventoryUnit(inventory);
      return `
          <div class="hint-chip" id="card-${inventoryId}">
            <span class="code">${code}</span>
            <span class="name">${name}</span>
            <span class="stock">${stock}</span>
            <span class="stock">${unit}</span>
          </div>
      `;
    }).join('');
  }

  renderProductLists(products, activeTab, updateSummary) {
    const container = document.getElementById('productList');
    container.innerHTML = '';
    products.forEach((p, idx) => {
      const reasons = activeTab === 'inbound' ? INBOUND_REASONS : OUTBOUND_REASONS;
      const typeLabel = activeTab === 'inbound' ? 'Inbound' : 'Outbound';
      const quantityValue = p.quantity ?? '';
      const quantityNumber = Number(p.quantity);
      const stockLimitSource = p.baseStock ?? p.currentStock;
      const stockNumber = Number(stockLimitSource);
      const hasQuantity = String(p.quantity ?? '').trim() !== '';
      const hasStock = String(stockLimitSource ?? '').trim() !== '' && !Number.isNaN(stockNumber);
      const isOverStock = hasQuantity && !Number.isNaN(quantityNumber) && hasStock && quantityNumber > stockNumber;

      const reasonOptions = '<option value="">请选择原因</option>' + reasons.map(r => `<option value="${r.id}"${r.id === p.reason ? ' selected' : ''}>${r.name}</option>`).join('');
      const removeBtn = products.length > 1
        ? `<button class="btn-remove" onclick="removeProduct(${p.id})" title="删除">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>` : '';

      const assocPanel = p.name ? `
      <div class="assoc-panel">
        <h4>✓ Associated product information</h4>
        <div class="assoc-grid">
          <div class="assoc-item"><label>Product Name</label><div class="val">${p.name}</div></div>
          <div class="assoc-item"><label>Specification</label><div class="val">${p.specification}</div></div>
          <div class="assoc-item"><label>Category</label><div class="val">${p.category}</div></div>
            <div class="assoc-item"><label>Unit</label><div class="val">${p.unit}</div></div>
            <div class="assoc-item"><label>Current Stock</label><div class="val stock" id="stock_${p.id}">${p.currentStock !== '' && p.currentStock !== undefined && p.currentStock !== null ? `${p.currentStock}${p.unit ? ' ' + p.unit : ''}` : ''}</div></div>
        </div>
      </div>` : '';
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
      <div class="product-card-header">
        <span class="product-num">${idx + 1}</span>
        ${removeBtn}
      </div>
      <div class="form-group">
        <label class="form-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
          Inventory Code <span class="req">*</span>
          <span class="hint">(Automatically associate product information after entering the code)</span>
        </label>
        <div class="code-row">
          <input type="text" class="form-input mono" id="code_${p.id}" value="${p.inventoryCode}"
            placeholder="Enter or scan inventory code, e.g., INV001"
            oninput="onCodeInput(${p.id}, this.value)">
          <button class="btn-search" onclick="onCodeInput(${p.id}, document.getElementById('code_${p.id}').value)" title="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
        </div>
      </div>
      ${assocPanel}
      <div class="grid-3">
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label" id="qtyLabel_${p.id}">${typeLabel} Quantity <span class="req">*</span></label>
          <input type="number" class="form-input${isOverStock ? ' input-error' : ''}" id="qty_${p.id}" value="${quantityValue}"
            placeholder="Enter quantity" min="1" oninput="onFieldInput(${p.id},'quantity',this.value)">
          <div class="field-error" id="qty_error_${p.id}" style="${isOverStock ? '' : 'display:none;'}">Exceeded current stock of associated product information</div>
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label" id="reasonLabel_${p.id}">${typeLabel} Reason <span class="req">*</span></label>
          <div class="reason-select-wrap">
            <select class="form-select reason-select" id="reason_${p.id}" onchange="onFieldInput(${p.id},'reason',this.value)">
              ${reasonOptions}
            </select>
          </div>
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Contract Information</label>
          <input type="text" class="form-input" id="contract_${p.id}" value="${p.contract}"
            placeholder="Enter contract number or name (optional)" oninput="onFieldInput(${p.id},'contract',this.value)">
        </div>
      </div>
    `;
      container.appendChild(card);
    });
    updateSummary();
  }

  updateProductCard(productId, quantity) {
    const card = document.getElementById(`card-${productId}`);
    const input = document.getElementById(`qty-${productId}`);

    if (card && input) {
      if (quantity > 0) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
      input.value = quantity;
    }
  }
}
