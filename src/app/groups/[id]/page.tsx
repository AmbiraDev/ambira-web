interface GroupDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const { id } = await params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Group Details</h1>
        <p className="text-muted-foreground">
          Group ID: {id}
        </p>
      </div>
      
      <div className="bg-card-background p-8 rounded-lg shadow-sm border border-border">
        <p className="text-center text-muted">
          Group detail view will be implemented here
        </p>
      </div>
    </div>
  );
}
