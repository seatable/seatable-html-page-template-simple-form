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

## Development

1. Install dependencies

2. Add `/src/setting.local.js` (optional)

```js
export default {
  server: "",
  appUuid: "",
  accessToken: "",
  pageId: "", // create an html page in universal app first
};
```

3. Run the following command to start the development server

```bash
npm run dev
```

## Build page

1. Update the version in `package.json`

2. Run the following command to build the page

```bash
node node scripts/build-page.js
```

3. The page is built in `page-zip` directory
