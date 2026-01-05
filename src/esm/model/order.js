export default class OrderModel {
  constructor() {
    this.items = {}; // { productId: quantity }
  }

  addItem(productId, quantity = 1) {
    this.items[productId] = quantity;
  }

  removeItem(productId) {
    delete this.items[productId];
  }

  updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      this.removeItem(productId);
    } else {
      this.items[productId] = quantity;
    }
  }

  getQuantity(productId) {
    return this.items[productId] || 0;
  }

  getItems() {
    return this.items;
  }

  hasItems() {
    return Object.keys(this.items).length > 0;
  }

  clear() {
    this.items = {};
  }

  calculateTotal(productModel) {
    return Object.keys(this.items).reduce((sum, productId) => {
      const product = productModel.getProductById(productId);
      const quantity = this.items[productId];
      return sum + (productModel.getProductPrice(product) * quantity);
    }, 0);
  }
}
