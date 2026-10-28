import { getColumnByName, getNumberDisplayString } from '../utils';

export default class ProductModel {
  constructor() {
    this.products = [];
    this.nameColumn = null;
    this.priceColumn = null;
  }

  setProducts(products, columns) {
    this.products = products;
    this.nameColumn = getColumnByName('ProductName', columns);
    this.priceColumn = getColumnByName('UnitPrice', columns);
  }

  getProducts() {
    return this.products;
  }

  getProductById(id) {
    return this.products.find(p => p._id === id);
  }

  getProductName(product) {
    return product?.[this.nameColumn?.key] || '';
  }

  getProductPrice(product) {
    return product?.[this.priceColumn?.key] || 0;
  }

  formatPrice(price) {
    return getNumberDisplayString(price, this.priceColumn?.data);
  }

  hasRequiredColumns() {
    return !!this.nameColumn && !!this.priceColumn;
  }
}
