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
      productGrid: document.getElementById('productGrid'),
      orderItems: document.getElementById('orderItems'),
      totalAmount: document.getElementById('totalAmount'),
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

  renderProducts(products, productModel, orderModel, handlers) {
    const grid = this.elements.productGrid;
    if (!grid) return;

    if (products.length === 0) {
      grid.innerHTML = '<div class="empty-message">No products</div>';
      return;
    }

    grid.innerHTML = products.map(product => {
      const productId = product._id;
      const quantity = orderModel.getQuantity(productId);
      const isSelected = quantity > 0;

      return `
        <div class="product-card ${isSelected ? 'selected' : ''}"
             id="card-${productId}"
             data-product-id="${productId}">
          <div class="product-name">${productModel.getProductName(product)}</div>
          <div class="product-price">${productModel.formatPrice(productModel.getProductPrice(product))}</div>
          <div class="quantity-control">
            <button class="qty-btn" data-action="decrease" data-product-id="${productId}">−</button>
            <input type="number"
                   class="qty-input"
                   id="qty-${productId}"
                   value="${quantity}"
                   min="0"
                   data-product-id="${productId}">
            <button class="qty-btn" data-action="increase" data-product-id="${productId}">+</button>
          </div>
        </div>
      `;
    }).join('');

    // Attach event listeners
    this.attachProductEventListeners(handlers);
  }

  attachProductEventListeners(handlers) {
    // Card click events
    document.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.quantity-control')) {
          const productId = card.dataset.productId;
          handlers.onToggleProduct(productId);
        }
      });
    });

    // Quantity button events
    document.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const productId = btn.dataset.productId;
        handlers.onQuantityChange(productId, action === 'increase' ? 1 : -1);
      });
    });

    // Quantity input events
    document.querySelectorAll('.qty-input').forEach(input => {
      input.addEventListener('click', (e) => e.stopPropagation());
      input.addEventListener('change', (e) => {
        const productId = input.dataset.productId;
        const value = parseInt(e.target.value) || 0;
        handlers.onQuantityUpdate(productId, value);
      });
    });
  }

  updateOrderSummary(orderModel, productModel) {
    const orderItemsDiv = this.elements.orderItems;
    const totalAmountSpan = this.elements.totalAmount;

    if (!orderModel.hasItems()) {
      orderItemsDiv.innerHTML = '<div class="empty-message">No products selected yet</div>';
      totalAmountSpan.textContent = productModel.formatPrice(0);
      return;
    }

    const items = Object.keys(orderModel.getItems()).map(productId => {
      const product = productModel.getProductById(productId);
      const quantity = orderModel.getQuantity(productId);
      const subtotal = productModel.getProductPrice(product) * quantity;
      return { product, quantity, subtotal };
    });

    orderItemsDiv.innerHTML = items.map(item => `
      <div class="order-item">
        <div class="item-details">
          <span class="item-qty">${item.quantity}x</span>
          <span class="item-name">${productModel.getProductName(item.product)}</span>
        </div>
        <span class="item-price">${productModel.formatPrice(item.subtotal)}</span>
      </div>
    `).join('');

    const total = orderModel.calculateTotal(productModel);
    totalAmountSpan.textContent = productModel.formatPrice(total);
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
