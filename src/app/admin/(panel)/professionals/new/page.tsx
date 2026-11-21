import { ProfessionalForm } from "@/components/admin/professional-form";

export default async function NewProfessionalPage({
  searchParams,
}: {
  searchParams: Promise<{ fromApplication?: string }>;
}) {
  const { fromApplication } = await searchParams;
  return <ProfessionalForm fromApplication={fromApplication} />;
}
