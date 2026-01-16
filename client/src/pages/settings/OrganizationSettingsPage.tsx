import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { useToast } from '@/hooks/useToast';
import { Building2 } from 'lucide-react';

interface Organisation {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export default function OrganizationSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['organisation', user?.organisationId],
    queryFn: () =>
      api.get<{ data: Organisation }>(`/organisations/${user?.organisationId}`),
    enabled: !!user?.organisationId,
  });

  useEffect(() => {
    if (data?.data.name) {
      setName(data.data.name);
    }
  }, [data?.data.name]);

  const updateMutation = useMutation({
    mutationFn: (newName: string) =>
      api.patch(`/organisations/${user?.organisationId}`, { name: newName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisation'] });
      toast({ title: 'Organisation updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update organisation', variant: 'destructive' });
    },
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !data) {
    return <ErrorState message="Failed to load organisation" onRetry={refetch} />;
  }

  const org = data.data;
  const hasChanges = name !== org.name;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Settings"
        description="Manage your organization details and preferences"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>General Information</CardTitle>
          </div>
          <CardDescription>
            Basic information about your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="org-name" className="text-sm font-medium">
              Organization Name
            </label>
            <input
              id="org-name"
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter organization name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="org-slug" className="text-sm font-medium">
              Organization Slug
            </label>
            <input
              id="org-slug"
              type="text"
              className="w-full rounded-md border border-input bg-muted px-3 py-2"
              value={org.slug}
              disabled
            />
            <p className="text-xs text-muted-foreground">
              The slug is used in URLs and cannot be changed
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Created</label>
            <p className="text-sm text-muted-foreground">
              {new Date(org.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={() => updateMutation.mutate(name)}
              disabled={!hasChanges || updateMutation.isPending || !name.trim()}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
