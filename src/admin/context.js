import { HTMLPageSDK } from 'seatable-html-page-sdk';
import { TABLE_NAME_MAP, APPROVALSTATUS } from './constants';
import { getColumnByName } from './utils';

export default class Context {
  constructor() {
    this.sdk = null;
  }

  async init(options) {
    this.sdk = new HTMLPageSDK(options);
    await this.sdk.init();
  }

  async loadInboundRecord() {
    try {
      const res = await this.sdk.listRows({
        tableName: TABLE_NAME_MAP.INBOUND_RECORD
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

  async loadOutboundRecord() {
    try {
      const res = await this.sdk.listRows({
        tableName: TABLE_NAME_MAP.OUTBOUND_RECORD
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


  async loadInventory() {
    try {
      const res = await this.sdk.listRows({
        tableName: TABLE_NAME_MAP.INVENTORY
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

  async loadInventoryTransaction() {
    try {
      const res = await this.sdk.listRows({
        tableName: TABLE_NAME_MAP.INVENTORYTRANSACTION
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

  async submitOrder(orderItemsData, relatedRows, columns, isInbound, isApproved) {
    try {
      const itemsRes = await this.sdk.batchAddRows({
        tableName: TABLE_NAME_MAP.INVENTORYTRANSACTION,
        rowsData: orderItemsData,
      });

      const rows = itemsRes?.data?.rows;
      const orderItemsIds = Array.isArray(rows) ? rows.map(row => row._id).filter(Boolean) : [];

      if (orderItemsIds.length > 0) {
        const approvalKey = isInbound ? 'inbound_approval_result' : 'outbound_approval_result';
        if (isApproved) {
          const rowsData = relatedRows.map(row => ({
            row_id: row._id,
            row: { [approvalKey]: APPROVALSTATUS.APPROVED },
          }));
          const success = await this.sdk.batchUpdateRows({
            tableName: isInbound ? TABLE_NAME_MAP.INBOUND_RECORD : TABLE_NAME_MAP.OUTBOUND_RECORD,
            rowsData
          });

          if (success){
            const { success, columns: invemtoryColumns, rows: invemtoryRows, } = await this.loadInventory();
            if (success){
              const updateInventory = relatedRows.map(row => {
                const inventoryCode = row[getColumnByName('inventory_code', columns)?.key];
                const quantity = row[getColumnByName('quantity', columns)?.key];

                const inventoryRow = invemtoryRows.find(r => r[getColumnByName('inventory_code', invemtoryColumns)?.key] === inventoryCode[0].display_value);
                const currentQuantity = inventoryRow[getColumnByName('current_quantity', invemtoryColumns)?.key];
                if (inventoryRow) {
                  return {
                    row_id: inventoryRow._id,
                    row: { current_quantity: isInbound ? Number(currentQuantity) + Number(quantity) : Number(currentQuantity) - Number(quantity) },
                  };
                }
                return null;
              }).filter(item => item !== null);
              await this.sdk.batchUpdateRows({
                tableName: TABLE_NAME_MAP.INVENTORY,
                rowsData: updateInventory
              });
            }
          }
        }
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      return { success: false, error };
    }
  }
}
