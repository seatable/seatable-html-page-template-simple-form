import { ERROR_MESSAGES } from './constants';
import Context from './context';
import OrderModel from './model/order';
import ProductModel from './model/product';
import UIManager from './ui-manager';

export default class App {
  constructor() {
    this.productModel = new ProductModel();
    this.orderModel = new OrderModel();
    this.uiManager = new UIManager();
    this.context = new Context();

    this.handlers = {
      onToggleProduct: this.toggleProduct.bind(this),
      onQuantityChange: this.changeQuantity.bind(this),
      onQuantityUpdate: this.updateQuantity.bind(this),
    };

    this.bindGlobalEvents();
  }

  bindGlobalEvents() {
    // Global functions for HTML onclick handlers
    window.retryLoading = () => this.init();
    window.closeError = () => this.uiManager.hideError();
    window.orderAgain = () => this.orderAgain();
    window.clearOrder = () => this.clearOrder();
    window.submitOrder = () => this.submitOrder();
  }

  async init() {
    this.uiManager.showLoading();

    const options = window.__HTML_PAGE_DEV_CONFIG__ || null;
    if (options) {
      console.log('Local settings:', options);
    }

    try {
      await this.context.init(options);
      const result = await this.context.loadProducts();

      if (!result.success) {
        this.handleLoadError(result.error);
        return;
      }

      this.productModel.setProducts(result.rows, result.columns);

      if (!this.productModel.hasRequiredColumns()) {
        this.uiManager.showError(null, ERROR_MESSAGES.MISSING_FIELDS);
        return;
      }

      this.uiManager.renderProducts(
        this.productModel.getProducts(),
        this.productModel,
        this.orderModel,
        this.handlers
      );

      this.updateUI();
      this.uiManager.hideLoading();
    } catch (error) {
      this.handleLoadError(error);
    }
  }

  handleLoadError(error) {
    if (error?.response?.status === 403) {
      this.uiManager.showError(null, ERROR_MESSAGES.NO_PERMISSION);
    } else {
      this.uiManager.showError(null, ERROR_MESSAGES.LOAD_FAILED);
    }
  }

  toggleProduct(productId) {
    const currentQty = this.orderModel.getQuantity(productId);

    if (currentQty > 0) {
      this.orderModel.removeItem(productId);
    } else {
      this.orderModel.addItem(productId, 1);
    }

    this.updateUI();
    this.uiManager.updateProductCard(productId, this.orderModel.getQuantity(productId));
  }

  changeQuantity(productId, delta) {
    const currentQty = this.orderModel.getQuantity(productId);
    const newQty = Math.max(0, currentQty + delta);

    this.orderModel.updateQuantity(productId, newQty);
    this.updateUI();
    this.uiManager.updateProductCard(productId, newQty);
  }

  updateQuantity(productId, value) {
    const qty = parseInt(value) || 0;
    this.orderModel.updateQuantity(productId, qty);
    this.updateUI();
    this.uiManager.updateProductCard(productId, qty);
  }

  updateUI() {
    this.uiManager.updateOrderSummary(this.orderModel, this.productModel);
  }

  clearOrder() {
    this.orderModel.clear();

    this.productModel.getProducts().forEach(product => {
      this.uiManager.updateProductCard(product._id, 0);
    });

    this.updateUI();
  }

  orderAgain() {
    this.uiManager.hideSuccess();
    this.clearOrder();
  }

  async submitOrder() {
    if (!this.orderModel.hasItems()) {
      this.uiManager.showEmptyOrderToast();
      return;
    }

    const orderItems = Object.keys(this.orderModel.getItems());
    const orderItemsData = orderItems.map(productId => ({
      quantity: this.orderModel.getQuantity(productId),
      product: [productId],
    }));

    const linkedProductsData = orderItems.map(productId => ({
      link_column_name: 'product',
      other_rows_ids: [productId],
    }));

    const result = await this.context.submitOrder(orderItemsData, linkedProductsData);

    if (result.success) {
      this.uiManager.showSuccess();
    } else {
      const errorTitle = 'Submit order failed';
      const errorMsg = result.error?.response?.status === 403
        ? ERROR_MESSAGES.NO_PERMISSION
        : ERROR_MESSAGES.SUBMIT_FAILED;
      this.uiManager.showError(errorTitle, errorMsg);
    }
  }
}
