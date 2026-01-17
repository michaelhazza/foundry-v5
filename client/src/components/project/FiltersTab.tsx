import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/hooks/useToast';
import { Filter, Plus, Trash2, Edit2 } from 'lucide-react';

interface QualityFilter {
  id: number;
  name: string;
  type: 'length' | 'pattern' | 'language' | 'custom';
  config: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    language?: string;
    expression?: string;
  };
  action: 'exclude' | 'flag' | 'transform';
  isEnabled: boolean;
}

interface FiltersTabProps {
  projectId: number;
}

export function FiltersTab({ projectId }: FiltersTabProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFilter, setNewFilter] = useState({
    name: '',
    type: 'length' as const,
    config: { minLength: 10, maxLength: 5000 },
    action: 'exclude' as const,
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.filters.list(projectId),
    queryFn: () => api.get<{ data: QualityFilter[] }>(`/projects/${projectId}/filters`),
  });

  const createMutation = useMutation({
    mutationFn: (filter: typeof newFilter) =>
      api.post(`/projects/${projectId}/filters`, filter),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.filters.list(projectId) });
      setShowCreateForm(false);
      setNewFilter({
        name: '',
        type: 'length',
        config: { minLength: 10, maxLength: 5000 },
        action: 'exclude',
      });
      toast({ title: 'Filter created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create filter', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (filterId: number) => api.delete(`/quality-filters/${filterId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.filters.list(projectId) });
      toast({ title: 'Filter deleted' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ filterId, isEnabled }: { filterId: number; isEnabled: boolean }) =>
      api.patch(`/quality-filters/${filterId}`, { isEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.filters.list(projectId) });
    },
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <div className="text-destructive">Failed to load filters</div>;
  }

  const filters = data?.data || [];

  const getFilterDescription = (filter: QualityFilter) => {
    switch (filter.type) {
      case 'length':
        return `${filter.config.minLength || 0} - ${filter.config.maxLength || '∞'} characters`;
      case 'pattern':
        return `Regex: ${filter.config.pattern}`;
      case 'language':
        return `Language: ${filter.config.language}`;
      case 'custom':
        return filter.config.expression || 'Custom expression';
      default:
        return 'Unknown filter type';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Quality Filters</CardTitle>
          <CardDescription>
            Filter out low-quality or unwanted records
          </CardDescription>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Filter
        </Button>
      </CardHeader>
      <CardContent>
        {showCreateForm && (
          <div className="mb-6 rounded-lg border p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={newFilter.name}
                onChange={(e) => setNewFilter({ ...newFilter, name: e.target.value })}
                placeholder="Filter name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={newFilter.type}
                  onChange={(e) =>
                    setNewFilter({
                      ...newFilter,
                      type: e.target.value as typeof newFilter.type,
                    })
                  }
                >
                  <option value="length">Length Filter</option>
                  <option value="pattern">Pattern Filter</option>
                  <option value="language">Language Filter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Action</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={newFilter.action}
                  onChange={(e) =>
                    setNewFilter({
                      ...newFilter,
                      action: e.target.value as typeof newFilter.action,
                    })
                  }
                >
                  <option value="exclude">Exclude</option>
                  <option value="flag">Flag</option>
                </select>
              </div>
            </div>
            {newFilter.type === 'length' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Length</label>
                  <input
                    type="number"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={newFilter.config.minLength || 0}
                    onChange={(e) =>
                      setNewFilter({
                        ...newFilter,
                        config: { ...newFilter.config, minLength: parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Length</label>
                  <input
                    type="number"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={newFilter.config.maxLength || 5000}
                    onChange={(e) =>
                      setNewFilter({
                        ...newFilter,
                        config: { ...newFilter.config, maxLength: parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={() => createMutation.mutate(newFilter)} disabled={!newFilter.name}>
                Create Filter
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {filters.length === 0 && !showCreateForm ? (
          <EmptyState
            title="No filters configured"
            description="Add filters to improve data quality."
            icon={Filter}
            action={
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Filter
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {filters.map((filter) => (
              <div
                key={filter.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={filter.isEnabled}
                    onChange={(e) =>
                      toggleMutation.mutate({
                        filterId: filter.id,
                        isEnabled: e.target.checked,
                      })
                    }
                    className="h-4 w-4"
                  />
                  <div>
                    <p className="font-medium">{filter.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {getFilterDescription(filter)} • {filter.action}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(filter.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
