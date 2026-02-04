import { HTMLPageSDK } from 'seatable-html-page-sdk';
import { TABLE_NAME_MAP } from './constants';

export default class Context {
  constructor() {
    this.sdk = null;
  }

  async init(options) {
    this.sdk = new HTMLPageSDK(options);
    await this.sdk.init();
  }

  async loadProducts() {
    try {
      const res = await this.sdk.listRows({
        tableName: TABLE_NAME_MAP.PRODUCTS
      });
      return {
        success: true,
        columns: res.data?.metadata || [],
        rows: res.data?.results || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error,
      };
    }
  }

  async submitOrder(orderItemsData) {
    try {
      // Add order items
      const itemsRes = await this.sdk.batchAddRows({
        tableName: TABLE_NAME_MAP.ORDER_ITEMS,
        rowsData: orderItemsData,
      });

      const rows = itemsRes?.data?.rows;
      const orderItemsIds = Array.isArray(rows)
        ? rows.map(row => row._id).filter(Boolean)
        : [];

      if (orderItemsIds.length > 0) {
        // Add order
        await this.sdk.addRow({
          tableName: TABLE_NAME_MAP.ORDERS,
          rowData: {
            order_items: orderItemsIds,
          },
        });
        return { success: true };
      }

      return { success: false };
    } catch (error) {
      return { success: false, error };
    }
  }
}
