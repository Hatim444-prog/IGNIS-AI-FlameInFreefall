import { Detail } from "@/research/Catalog";
export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  return <Detail code={(await params).code} />;
}
