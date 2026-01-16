import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/hooks/useToast';
import { Play, Square, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ProcessingRun {
  id: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  totalRecords: number;
  processedRecords: number;
  filteredRecords: number;
  outputRecords: number;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
}

interface ProcessingStatus {
  hasActiveSources: boolean;
  hasMappings: boolean;
  currentRun: ProcessingRun | null;
  lastRun: ProcessingRun | null;
}

interface ProcessingTabProps {
  projectId: number;
}

export function ProcessingTab({ projectId }: ProcessingTabProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: queryKeys.processing.status(projectId),
    queryFn: () => api.get<{ data: ProcessingStatus }>(`/projects/${projectId}/processing`),
    refetchInterval: (query) => {
      const data = query.state.data?.data;
      return data?.currentRun?.status === 'running' ? 2000 : false;
    },
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: queryKeys.processing.history(projectId),
    queryFn: () => api.get<{ data: ProcessingRun[] }>(`/projects/${projectId}/runs`),
  });

  const startMutation = useMutation({
    mutationFn: () => api.post(`/projects/${projectId}/process`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.processing.status(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.processing.history(projectId) });
      toast({ title: 'Processing started' });
    },
    onError: () => {
      toast({ title: 'Failed to start processing', variant: 'destructive' });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.post(`/projects/${projectId}/processing/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.processing.status(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.processing.history(projectId) });
      toast({ title: 'Processing cancelled' });
    },
  });

  if (statusLoading || historyLoading) {
    return <LoadingState />;
  }

  const status = statusData?.data;
  const history = historyData?.data || [];
  const currentRun = status?.currentRun;
  const isRunning = currentRun?.status === 'running' || currentRun?.status === 'pending';

  const getStatusIcon = (runStatus: ProcessingRun['status']) => {
    switch (runStatus) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'running':
        return <RefreshCw className="h-5 w-5 text-info animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start) return '-';
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const seconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const canStartProcessing = status?.hasActiveSources && status?.hasMappings;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Processing Control</CardTitle>
          <CardDescription>
            Process your data through the configured pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!canStartProcessing ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-warning mb-4" />
              <p className="font-medium">Configuration Required</p>
              <p className="text-sm text-muted-foreground mt-2">
                {!status?.hasActiveSources && 'Add at least one data source. '}
                {!status?.hasMappings && 'Configure field mappings.'}
              </p>
            </div>
          ) : isRunning ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 text-info animate-spin" />
                  <span className="font-medium">Processing in progress...</span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                >
                  <Square className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
              {currentRun && (
                <div className="bg-muted rounded-lg p-4">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{currentRun.totalRecords}</p>
                      <p className="text-sm text-muted-foreground">Total</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{currentRun.processedRecords}</p>
                      <p className="text-sm text-muted-foreground">Processed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{currentRun.filteredRecords}</p>
                      <p className="text-sm text-muted-foreground">Filtered</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{currentRun.outputRecords}</p>
                      <p className="text-sm text-muted-foreground">Output</p>
                    </div>
                  </div>
                  {currentRun.totalRecords > 0 && (
                    <div className="mt-4">
                      <div className="h-2 rounded-full bg-muted-foreground/20 overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{
                            width: `${(currentRun.processedRecords / currentRun.totalRecords) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Play className="h-12 w-12 mx-auto text-primary mb-4" />
              <p className="font-medium">Ready to Process</p>
              <p className="text-sm text-muted-foreground mt-2 mb-4">
                Your data will be filtered, mapped, and de-identified.
              </p>
              <Button
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
              >
                <Play className="mr-2 h-4 w-4" />
                Start Processing
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Processing History</CardTitle>
          <CardDescription>Previous processing runs for this project</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <EmptyState
              title="No processing history"
              description="Run your first processing job to see history here."
              icon={Clock}
            />
          ) : (
            <div className="space-y-3">
              {history.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(run.status)}
                    <div>
                      <p className="font-medium capitalize">{run.status}</p>
                      <p className="text-sm text-muted-foreground">
                        {run.startedAt
                          ? new Date(run.startedAt).toLocaleString()
                          : 'Not started'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{run.outputRecords.toLocaleString()} records</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDuration(run.startedAt, run.completedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
