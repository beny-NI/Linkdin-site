import { StoryForm } from "@/components/admin/story-form";

export default async function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StoryForm id={id} />;
}
