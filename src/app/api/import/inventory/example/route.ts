import { NextResponse } from "next/server";

const EXAMPLE_CSV = `name,sku,price,stock_qty,description,is_active
Wireless Mouse,MOUSE-001,29.99,50,Ergonomic wireless mouse,true
USB-C Cable,CABLE-USB-C-001,12.99,100,High-speed USB-C cable,true
Monitor Stand,,49.99,25,Adjustable monitor stand,true
`;

export async function GET() {
  return new NextResponse(EXAMPLE_CSV, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="inventory-import-example.csv"',
    },
  });
}
