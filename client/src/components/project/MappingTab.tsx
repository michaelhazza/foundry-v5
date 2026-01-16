import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/hooks/useToast';
import { ArrowRight, Wand2, Map } from 'lucide-react';

interface FieldMapping {
  id: number;
  sourceField: string;
  targetField: string;
  isRequired: boolean;
  transform: string | null;
}

interface MappingTabProps {
  projectId: number;
}

const TARGET_FIELDS = [
  { value: 'ticket_id', label: 'Ticket ID', required: true },
  { value: 'customer_message', label: 'Customer Message', required: true },
  { value: 'agent_response', label: 'Agent Response', required: true },
  { value: 'timestamp', label: 'Timestamp', required: false },
  { value: 'category', label: 'Category', required: false },
  { value: 'priority', label: 'Priority', required: false },
  { value: 'resolution', label: 'Resolution', required: false },
  { value: 'sentiment', label: 'Sentiment', required: false },
];

export function MappingTab({ projectId }: MappingTabProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.mapping.list(projectId),
    queryFn: () => api.get<{ data: { mappings: FieldMapping[]; sourceFields: string[] } }>(
      `/projects/${projectId}/mapping`
    ),
  });

  const autoDetectMutation = useMutation({
    mutationFn: () => api.post(`/projects/${projectId}/mapping/auto-detect`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mapping.list(projectId) });
      toast({ title: 'Auto-detection complete' });
    },
    onError: () => {
      toast({ title: 'Auto-detection failed', variant: 'destructive' });
    },
  });

  const updateMappingMutation = useMutation({
    mutationFn: ({ mappingId, data }: { mappingId: number; data: Partial<FieldMapping> }) =>
      api.patch(`/field-mappings/${mappingId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mapping.list(projectId) });
    },
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <div className="text-destructive">Failed to load mappings</div>;
  }

  const mappings = data?.data.mappings || [];
  const sourceFields = data?.data.sourceFields || [];

  const getMappingForTarget = (targetField: string) =>
    mappings.find((m) => m.targetField === targetField);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Field Mapping</CardTitle>
          <CardDescription>
            Map source fields to standard conversation fields
          </CardDescription>
        </div>
        <Button
          variant="outline"
          onClick={() => autoDetectMutation.mutate()}
          disabled={autoDetectMutation.isPending || sourceFields.length === 0}
        >
          <Wand2 className="mr-2 h-4 w-4" />
          Auto-Detect
        </Button>
      </CardHeader>
      <CardContent>
        {sourceFields.length === 0 ? (
          <EmptyState
            title="No source fields found"
            description="Upload a data source first to configure field mappings."
            icon={Map}
          />
        ) : (
          <div className="space-y-4">
            {TARGET_FIELDS.map((target) => {
              const mapping = getMappingForTarget(target.value);
              return (
                <div
                  key={target.value}
                  className="flex items-center gap-4 rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      value={mapping?.sourceField || ''}
                      onChange={(e) => {
                        if (mapping) {
                          updateMappingMutation.mutate({
                            mappingId: mapping.id,
                            data: { sourceField: e.target.value },
                          });
                        }
                      }}
                    >
                      <option value="">-- Select source field --</option>
                      {sourceFields.map((field) => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      ))}
                    </select>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{target.label}</span>
                      {target.required && (
                        <span className="text-xs text-destructive">Required</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
