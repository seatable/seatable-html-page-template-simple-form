export const TABLE_NAME_MAP = {
  PRODUCTS: 'Products',
  ORDER_ITEMS: 'OrderItems',
  ORDERS: 'Orders',
  INBOUND_ENTRY: 'InboundEntry',
  OUTBOUND_ENTRY: 'OutboundEntry',
};

export const FORMSTATUS = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound',
};

export const ERROR_MESSAGES = {
  NO_PERMISSION: 'Permission denied',
  MISSING_FIELDS: 'Missing required fields',
  LOAD_FAILED: 'Load Products failed. Please check your connection and try again.',
  SUBMIT_FAILED: 'Please check your data source and connection, then try again.',
};

export const INBOUND_REASONS = [
  {
    name: 'Purchase',
    color: '#F4667C',
    textColor: '#FFFFFF',
    borderColor: '#DC556A',
    id: '472982',
  },
  {
    name: 'Purchase Return',
    color: '#9860E5',
    textColor: '#FFFFFF',
    borderColor: '#844BD2',
    id: '730324',
  },
  {
    name: 'Production',
    color: '#C2C2C2',
    textColor: '#FFFFFF',
    borderColor: '#ADADAD',
    id: '269096',
  },
  {
    name: 'Others',
    color: '#59CB74',
    textColor: '#FFFFFF',
    borderColor: '#4EB867',
    id: '795038',
  }
];
export const OUTBOUND_REASONS = [
  {
    name: 'Material Requisition',
    color: '#ADDF84',
    textColor: '#FFFFFF',
    borderColor: '#9CCF72',
    id: '979532',
  },
  {
    name: 'Sales',
    color: '#EAA775',
    textColor: '#FFFFFF',
    borderColor: '#D59361',
    id: '232005',
  },
  {
    name: 'Purchase Return',
    color: '#59CB74',
    textColor: '#FFFFFF',
    borderColor: '#4EB867',
    id: '112912',
  },
  {
    name: 'Others',
    color: '#F4667C',
    textColor: '#FFFFFF',
    borderColor: '#DC556A',
    id: '162373',
  }
];
