import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/common/PageHeader';
import { DataCard } from '@/components/common/DataCard';
import { LoadingState } from '@/components/common/LoadingState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderKanban, Database, Cpu, Plus } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: () => api.get<{ data: any[]; meta: any }>('/projects'),
  });

  if (projectsLoading) {
    return <LoadingState />;
  }

  const projectList = projects?.data || [];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0]}`}
        description="Here's what's happening with your data preparation projects."
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <DataCard
          title="Total Projects"
          value={projectList.length}
          icon={FolderKanban}
        />
        <DataCard
          title="Total Sources"
          value={projectList.reduce((acc: number, p: any) => acc + (p.sourceCount || 0), 0)}
          icon={Database}
        />
        <DataCard
          title="Processing Runs"
          value={0}
          icon={Cpu}
        />
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Projects</CardTitle>
          <Button onClick={() => navigate('/projects')} variant="outline" size="sm">
            View all
          </Button>
        </CardHeader>
        <CardContent>
          {projectList.length === 0 ? (
            <div className="text-center py-8">
              <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first project to start preparing training data.
              </p>
              <Button onClick={() => navigate('/projects')} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {projectList.slice(0, 5).map((project: any) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div>
                    <h4 className="font-medium">{project.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {project.sourceCount || 0} sources
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    Open
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
