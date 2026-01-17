import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Settings } from 'lucide-react';
import {
  SourcesTab,
  MappingTab,
  PrivacyTab,
  FiltersTab,
  ProcessingTab,
  ExportsTab,
} from '@/components/project';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = parseInt(id!);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => api.get<{ data: any }>(`/projects/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !data) {
    return <ErrorState message="Failed to load project" onRetry={refetch} />;
  }

  const project = data.data;

  return (
    <div>
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>

      <PageHeader
        title={project.name}
        description={project.description}
        action={
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        }
      />

      <Tabs defaultValue="sources" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="mapping">Mapping</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="filters">Filters</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="exports">Exports</TabsTrigger>
        </TabsList>

        <TabsContent value="sources">
          <SourcesTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="mapping">
          <MappingTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="privacy">
          <PrivacyTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="filters">
          <FiltersTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="processing">
          <ProcessingTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="exports">
          <ExportsTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
