import { getColumnByName } from '../utils';

export default class InventoryrModel {
  constructor() {
    this.inventories = [];
    this.nameColumn = null;
  }

  setInventories(inventories, columns) {
    this.inventories = inventories;
    this.nameColumn = getColumnByName('productName', columns);
    this.skuColumn = getColumnByName('inventoryCode', columns);
    this.currentStock = getColumnByName('currentStock', columns);
    this.unit = getColumnByName('unit', columns);
  }

  getInventories() {
    return this.inventories;
  }

  getInventoryById(id) {
    return this.inventories.find(p => p._id === id);
  }

  getInventoryName(inventory) {
    return inventory?.[this.nameColumn?.key] || '';
  }

  getInventorySKU(inventory) {
    return inventory?.[this.skuColumn?.key] || '';
  }

  getCurrentStock(inventory) {
    return inventory?.[this.currentStock?.key] || '';
  }

  getInventoryUnit(inventory) {
    return inventory?.[this.unit?.key] || '';
  }

}
