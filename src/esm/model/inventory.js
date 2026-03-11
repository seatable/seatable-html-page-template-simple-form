import { getColumnByName } from '../utils';

export default class InventoryrModel {
  constructor() {
    this.inventories = [];
    this.nameColumn = null;
  }

  setInventories(inventories, columns) {
    this.inventories = inventories;
    this.nameColumn = getColumnByName('product_name', columns);
    this.inventoryCodeColumn = getColumnByName('inventory_code', columns);
    this.currentQuantity = getColumnByName('current_quantity', columns);
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

  getInventoryCode(inventory) {
    return inventory?.[this.inventoryCodeColumn?.key] || '';
  }

  getCurrentQuantity(inventory) {
    return inventory?.[this.currentQuantity?.key] || '';
  }

  getInventoryUnit(inventory) {
    return inventory?.[this.unit?.key] || '';
  }

}
