export const getColumnByName = (columnName, columns) => {
  if (!Array.isArray(columns) || !columnName) return null;
  return columns.find(column => column.name === columnName);
};

export const getNumberDisplayString = (number, formats) => {
  const type = Object.prototype.toString.call(number);
  if (type !== '[object Number]') {
    if (type === '[object String]' && number.startsWith('#')) {
      return number;
    }
    return '';
  }

  if (isNaN(number) || number === Infinity || number === -Infinity) {
    return String(number);
  }

  const { precision = 2, enable_precision = false } = formats || {};
  const sNum = number.toFixed(enable_precision ? precision : 8);
  const { format = 'number' } = formats || {};

  switch (format) {
    case 'yuan':
      return `￥${sNum}`;
    case 'dollar':
      return `$${sNum}`;
    case 'euro':
      return `€${sNum}`;
    case 'custom_currency':
      if (formats.currency_symbol_position === 'after') {
        return `${sNum}${formats.currency_symbol || ''}`;
      }
      return `${formats.currency_symbol || ''}${sNum}`;
    default:
      return sNum;
  }
};
