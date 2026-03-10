import { isInbound, getColumnByName } from './utils';
import dayjs from 'dayjs';

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

  renderOrders(orders, inboundRecordResults, outboundRecordResults) {
    const container = document.getElementById('orders-list');
    const emptyState = document.getElementById('empty-state');
    if (!container || !emptyState) return;

    if (orders.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    container.innerHTML = orders.map(order => {
      const documentNumber = order.document_number;
      const products = order.products;
      const firstProduct = products[0];
      const isIn = isInbound(firstProduct._id, inboundRecordResults);
      const { columns } = isIn ? inboundRecordResults : outboundRecordResults;
      const typeLabel = isIn ? '入库' : '出库';
      const typeClass = isIn ? 'type-in' : 'type-out';
      const dateLabel = isIn ? '入库日期' : '出库日期';
      const quantityLabel = isIn ? '入库数量' : '出库数量';
      const reasonLabel = isIn ? '入库原因' : '出库原因';
      const contractLabel = '合同信息';
      const dateColumn = getColumnByName('date', columns);
      const orderApplicantColumn = getColumnByName('applicant', columns);
      const inventoryCode = getColumnByName('inventory_code', columns);
      const productName = getColumnByName('product_name', columns);
      const specification = getColumnByName('specification', columns);
      const category = getColumnByName('product_category', columns);
      const unit = getColumnByName('unit', columns);
      const currentQuantity = getColumnByName('current_quantity', columns);
      const quantity = getColumnByName('quantity', columns);
      const reason = getColumnByName(isIn ? 'inbound_reason' : 'outbound_reason', columns);
      const contract = getColumnByName('contract', columns);
      const orderCreatTime = getColumnByName('creat_time', columns);
      const remark = getColumnByName('remark', columns);

      const productsHtml = products.map((product, index) => `
        <div class="product-card">
          <div class="product-num">${index + 1}</div>
          <div class="product-body">
            <div class="product-grid">
              <div class="product-field">
                <div class="pf-label">库存编码</div>
                <div class="pf-value mono">${product[inventoryCode.key]?.[0]?.display_value || ''}</div>
              </div>
              <div class="product-field">
                <div class="pf-label">货品名称</div>
                <div class="pf-value bold">${Array.isArray(product[productName.key]) ? product[productName.key].join('') : product[productName.key] || ''}</div>
              </div>
              <div class="product-field">
                <div class="pf-label">规格型号</div>
                <div class="pf-value">${Array.isArray(product[specification.key]) ? product[specification.key].join('') : product[specification.key] || ''}</div>
              </div>
              <div class="product-field">
                <div class="pf-label">货品类别</div>
                <div class="pf-value">${Array.isArray(product[category.key]) ? product[category.key].join('') : product[category.key] || ''}</div>
              </div>
              <div class="product-field">
                <div class="pf-label">单位</div>
                <div class="pf-value">${Array.isArray(product[unit.key]) ? product[unit.key].join('') : product[unit.key] || ''}</div>
              </div>
              <div class="product-field">
                <div class="pf-label">当前库存</div>
                <div class="pf-value bold">${Array.isArray(product[currentQuantity.key]) ? product[currentQuantity.key].join('') : product[currentQuantity.key] || ''} ${Array.isArray(product[unit.key]) ? product[unit.key].join('') : product[unit.key] || ''}</div>
              </div>
            </div>
            <div class="highlight-row">
              <div>
                <div class="hl-label">${quantityLabel}</div>
                <div class="hl-value big">${product[quantity.key] || ''} ${Array.isArray(product[unit.key]) ? product[unit.key].join('') : product[unit.key] || ''}</div>
              </div>
              <div>
                <div class="hl-label">${reasonLabel}</div>
                <div class="hl-value">${product[reason.key] || ''}</div>
              </div>
              <div>
                <div class="hl-label">${contractLabel}</div>
                <div class="hl-value">${product[contract.key] || '—'}</div>
              </div>
            </div>
          </div>
        </div>
      `).join('');

      return `
        <div class="order-card" id="card-${documentNumber}" key="${documentNumber}">
          <div class="card-head" onclick="toggleCard('${documentNumber}')">
            <div class="card-head-row">
              <div class="card-left">
                <span class="type-badge ${typeClass}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="${isIn ? 'M8 12l4 4 4-4M12 8v8' : 'M16 12l-4-4-4 4M12 16V8'}" />
                  </svg>${typeLabel}
                </span>
                <div>
                  # <span class="order-id">${documentNumber}</span>
                  <div class="submit-time">提交时间：${dayjs(firstProduct[orderCreatTime.key]).format('YYYY-MM-DD HH:mm:ss')}</div>
                </div>
                <div class="divider-v"></div>
              </div>
              <div class="card-far-right">
                ${order.pending ? `<span class="status-badge" style="border-left-color:#f59e0b;background:#fef3c7;color:#d97706">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>待审批
                </span>` : !order.isRejected ? `<span class="status-badge" style="border-left-color:#22c55e;background:#dcfce7;color:#16a34a">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>审批通过
                </span>` : `<span class="status-badge" style="border-left-color:#ef4444;background:#fef2f2;color:#dc2626">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>审批未通过
                </span>`}
                <button class="expand-btn" id="btn-${documentNumber}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="meta-row">
              <span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>${firstProduct[dateColumn.key] || '—'}</span>
              <span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>申请人：${firstProduct[orderApplicantColumn.key] || '—'}</span>
              <span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>共 ${products.length || 0} 种商品</span>
              ${firstProduct[remark.key] ? `<span class="remark-tag">备注：${firstProduct[remark.key]}</span>` : ''}
            </div>
          </div>
          <div class="card-detail" id="detail-${documentNumber}">
            <div class="section-title">单据信息</div>
            <div class="info-grid">
              <div>
                <div class="info-label">${dateLabel}</div>
                <div class="info-value">${firstProduct[dateColumn.key] || '—'}</div>
              </div>
              <div>
                <div class="info-label">申请人</div>
                <div class="info-value">${firstProduct[orderApplicantColumn.key] || '—'}</div>
              </div>
              <div>
                <div class="info-label">单据备注</div>
                <div class="info-value">${firstProduct[remark.key] || '—'}</div>
              </div>  
            </div>
            <div class="section-title">商品明细</div>
            <div class="products">
            ${productsHtml}
            </div>
            ${(order.pending || order.isRejected) ? `<div class="approval-box">
              ${!order.isRejected ? `<div class="section-title">审批操作</div><textarea id="remark-${documentNumber}" rows="3" placeholder="填写审批意见（驳回时必填）"></textarea>` : `<div class="section-title">驳回意见:</div><span style="color: red;">${remark ? (firstProduct[getColumnByName('review_comment', columns).key] || '—') : '—'}</span>`}
              ${!order.isRejected ? `<div class="approval-actions">
                <button class="btn btn-reject" onclick="reject('${documentNumber}')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>审批驳回
                </button>
                <button class="btn btn-approve" onclick="approve('${documentNumber}')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>审批通过
                </button>
              </div>` : ''}
            </div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  renderInventories(inventories, productModel) {
    const grid = this.elements.inventoryGrid;
    if (!grid) return;

    if (inventories.length === 0) {
      grid.innerHTML = '<div class="empty-message">No inventory</div>';
      return;
    }

    grid.innerHTML = inventories.map(inventory => {
      const inventoryCode = inventory.inventoryCode ?? productModel.getInventoryCode(inventory);
      const productname = inventory.name ?? productModel.getInventoryName(inventory);
      const currentQuantity = inventory.currentQuantity ?? productModel.getCurrentQuantity(inventory);
      const unit = inventory.unit ?? productModel.getInventoryUnit(inventory);
      return `
          <div class="hint-chip" id="card-${inventory._id}">
            <span class="code">${inventoryCode}</span>
            <span class="name">${productname}</span>
            <span class="stock">${currentQuantity}</span>
            <span class="stock">${unit}</span>
          </div>
      `;
    }).join('');
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
