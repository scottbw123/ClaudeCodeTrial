"use client";

import Link from "next/link";
import type { Task } from "@/lib/notion/types";
import { OrderReviewBody } from "../_components/order-review-body";

export function OrderReview({ task }: { task: Task }) {
  return (
    <div>
      <Link href="/dashboard/orders" className="text-sm text-gray-500 hover:text-ink transition-colors">
        ← Back to orders
      </Link>
      <h1 className="font-display text-3xl text-ink mt-3 mb-1">Order Review</h1>
      <hr className="border-gray-200 mb-6" />
      <OrderReviewBody task={task} />
    </div>
  );
}
