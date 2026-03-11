import { APPROVALSTATUS } from './constants';

export const getColumnByName = (columnName, columns) => {
  if (!Array.isArray(columns) || !columnName) return null;
  return columns.find(column => column.name === columnName);
};

export const getPendingOrders = (inboundOrderProducts, outboundOrdersProducts, inboundRecordResults, outboundRecordResults) => {
  const { columns: inboundColumns } = inboundRecordResults;
  const { columns: outboundColumns } = outboundRecordResults;
  const inboundApprovalResultColumn = getColumnByName('inbound_approval_result', inboundColumns);
  const outboundApprovalResultColumn = getColumnByName('outbound_approval_result', outboundColumns);

  const pendingOrders = [];

  inboundOrderProducts.forEach(order => {
    order.products.forEach(product => {
      if (product[inboundApprovalResultColumn?.key] === null) {
        if (!pendingOrders.includes(order)) {
          order['pending'] = true;
          delete order.isRejected; // Remove isRejected flag for pending orders
          pendingOrders.push(order);
        }
      }
    });
  });

  outboundOrdersProducts.forEach(order => {
    order.products.forEach(product => {
      if (product[outboundApprovalResultColumn?.key] === null) {
        if (!pendingOrders.includes(order)) {
          order['pending'] = true;
          delete order.isRejected; // Remove isRejected flag for pending orders
          pendingOrders.push(order);
        }
      }
    });
  });

  return { pendingOrders };
};

export const getQuality = (documentColumn, rows) => {
  const approvedRowsQuality = rows.filter(row => row[documentColumn?.key] === APPROVALSTATUS.APPROVED).length;
  const rejectedRowsQuality = rows.filter(row => row[documentColumn?.key] === APPROVALSTATUS.REJECTED).length;

  const pendingRowsQuality = rows.filter(row => !row[documentColumn?.key]).length;
  return { approvedRowsQuality, rejectedRowsQuality, pendingRowsQuality };
};

export const isInbound = (id, inboundRecordResults) => {
  return inboundRecordResults.rows.map(item => item._id).indexOf(id) !== -1;
};

export const getOrders = (inboundRecordResults, outboundRecordResults) => {
  const { columns: inboundColumns, rows: inboundRows } = inboundRecordResults;
  const { columns: outboundColumns, rows: outboundRows } = outboundRecordResults;
  const inboundDocumentNumberColumn = getColumnByName('document_number', inboundColumns);
  const outboundDocumentNumberColumn = getColumnByName('document_number', outboundColumns);

  const inboundApprovalResultColumn = getColumnByName('inbound_approval_result', inboundColumns);
  const outboundApprovalResultColumn = getColumnByName('outbound_approval_result', outboundColumns);


  if (!inboundDocumentNumberColumn || !outboundDocumentNumberColumn) {
    return { inboundOrderProducts: [], outboundOrdersProducts: [] };
  }

  const groupByDocumentNumber = (rows, documentNumberColumn, isInbound) => {
    const groups = {};
    rows.forEach(row => {
      const docNum = row[documentNumberColumn.key];
      if (!groups[docNum]) {
        groups[docNum] = [];
      }
      groups[docNum].push(row);
    });
    return Object.values(groups).map(products => ({
      document_number: products[0][documentNumberColumn.key],
      isRejected: products.find(product => product[isInbound ? inboundApprovalResultColumn?.key : outboundApprovalResultColumn?.key] === APPROVALSTATUS.REJECTED) ? true : false,
      products
    }));
  };

  const inboundOrderProducts = groupByDocumentNumber(inboundRows, inboundDocumentNumberColumn, true);
  const outboundOrdersProducts = groupByDocumentNumber(outboundRows, outboundDocumentNumberColumn, false);

  return { inboundOrderProducts, outboundOrdersProducts };
};
