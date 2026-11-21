import { ProfessionalForm } from "@/components/admin/professional-form";

export default async function EditProfessionalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProfessionalForm id={id} />;
}
