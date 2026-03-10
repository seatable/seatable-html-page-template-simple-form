export const getColumnByName = (columnName, columns) => {
  if (!Array.isArray(columns) || !columnName) return null;
  return columns.find(column => column.name === columnName);
};
