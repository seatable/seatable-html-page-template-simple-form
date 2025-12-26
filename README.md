# seatable-html-page-template-simple-form

Select products and quantities to calculate your total.

## Required tables

### Products

Table name: Products

Required fields:

| Name         | Type   | Description        |
| ------------ | ------ | ------------------ |
| Product_name | text   | product name       |
| Unit_price   | number | product unit price |

### Order_items

Table name: Order_items

Required fields:

| Name     | Type   | Description             |
| -------- | ------ | ----------------------- |
| Product  | link   | link to Products        |
| Quantity | number | the quantity of product |

### Orders

Table name: Orders

Required fields:

| Name        | Type | Description         |
| ----------- | ---- | ------------------- |
| Order_items | link | link to Order_items |

## Build page

1. Update the version in `info.json`

2. Run the following command to build the page

```bash
node node scripts/build-page.js
```
