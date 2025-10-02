interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Project Details</h1>
        <p className="text-muted-foreground">
          Project ID: {id}
        </p>
      </div>
      
      <div className="bg-card-background p-8 rounded-lg shadow-sm border border-border">
        <p className="text-center text-muted">
          Project detail view will be implemented here
        </p>
      </div>
    </div>
  );
}
