import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getTaskForClient } from "@/lib/notion/data";
import { OrderReview } from "./order-review";

export default async function OrderReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const task = await getTaskForClient(id, session.clientId);
  if (!task) notFound();

  return <OrderReview task={task} />;
}
