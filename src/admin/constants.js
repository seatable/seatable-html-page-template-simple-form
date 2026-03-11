export const TABLE_NAME_MAP = {
  PRODUCTS: 'Products',
  INVENTORY: 'Inventory',
  INVENTORYTRANSACTION: 'InventoryTransaction',
  INBOUND_RECORD: 'InboundRecord',
  OUTBOUND_RECORD: 'OutboundRecord',
};

export const APPROVALSTATUS = {
  REJECTED: '审批未通过',
  APPROVED: '审批通过',
};

export const INBOUND_STATUS = {
  PENDING: 'pending',
  IN: 'in',
  OUT: 'out',
};

export const ERROR_MESSAGES = {
  NO_PERMISSION: '权限错误',
  MISSING_FIELDS: '缺少必填字段',
  LOAD_FAILED: '加载产品失败。请检查您的连接并重试。',
  SUBMIT_FAILED: '请检查您的数据源和连接，然后重试。',
};

export const INBOUND_REASONS = [
  {
    name: '采购',
    color: '#F4667C',
    textColor: '#FFFFFF',
    borderColor: '#DC556A',
    id: '472982',
  },
  {
    name: '退料',
    color: '#9860E5',
    textColor: '#FFFFFF',
    borderColor: '#844BD2',
    id: '730324',
  },
  {
    name: '生产',
    color: '#C2C2C2',
    textColor: '#FFFFFF',
    borderColor: '#ADADAD',
    id: '269096',
  },
  {
    name: '其他',
    color: '#59CB74',
    textColor: '#FFFFFF',
    borderColor: '#4EB867',
    id: '795038',
  }
];

export const OUTBOUND_REASONS = [
  {
    name: '领料',
    color: '#ADDF84',
    textColor: '#FFFFFF',
    borderColor: '#9CCF72',
    id: '979532',
  },
  {
    name: '销售',
    color: '#EAA775',
    textColor: '#FFFFFF',
    borderColor: '#D59361',
    id: '232005',
  },
  {
    name: '采购退货',
    color: '#59CB74',
    textColor: '#FFFFFF',
    borderColor: '#4EB867',
    id: '112912',
  },
  {
    name: '其他',
    color: '#F4667C',
    textColor: '#FFFFFF',
    borderColor: '#DC556A',
    id: '162373',
  }
];
