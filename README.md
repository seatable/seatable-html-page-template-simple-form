# SeaTable HTML page template for building forms

SeaTable HTML page enable you to upload a custom HTML file and display as a page in SeaTable app.

This repository serves as an example of how to create an HTML page featuring a complex form. Traditional forms created through web interfaces are limited in their ability to incorporate complex logic. By building a form from the ground up using HTML and JavaScript, you can achieve greater flexibility.

This example shows a form that let users select products and quantities and calculate a total price before submit.

## Required tables

### Products

Table name: Products

Required fields:

| Name         | Type   | Description        |
| ------------ | ------ | ------------------ |
| ProductName | text   | product name       |
| UnitPrice   | number | product unit price |

### OrderItems

Table name: OrderItems

Required fields:

| Name     | Type   | Description             |
| -------- | ------ | ----------------------- |
| Product  | link   | link to Products        |
| Quantity | number | the quantity of product |

### Orders

Table name: Orders

Required fields:

| Name       | Type | Description        |
| ---------- | ---- | ------------------ |
| OrderItems | link | link to OrderItems |

## Development

1. Install dependencies

2. Add `/src/setting.js` (optional)

```js
export default {
  server: `http://localhost:${process.env.VITE_DEV_PORT}${(process.env.PROXY_PATH || "").replace(/\/+$/, "")}/`,
  appUuid: "",
  accountToken: "",
  pageId: "", // create an html page in universal app first
};
```

3. Add `.env.local` (optional)

4. Run the following command to start the development server

```bash
npm run dev
```

## Build page

1. Update the version in `package.json`

2. Run the following command to build the page

```bash
npm run build-page
```

3. The page is built in `page-zip` directory
