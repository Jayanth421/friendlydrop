"use client";

import { Order } from "@/types";
import { columns } from "./columns";
import { DataTable } from "./data-table";

export function OrdersDataTable({ data }: { data: Order[] }) {
  return <DataTable columns={columns} data={data} />;
}
