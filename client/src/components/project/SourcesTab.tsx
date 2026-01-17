import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { useToast } from '@/hooks/useToast';
import { Upload, File, Trash2, RefreshCw } from 'lucide-react';

interface Source {
  id: number;
  type: 'file' | 'api';
  name: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  recordCount: number;
  createdAt: string;
  fileSource?: {
    filename: string;
    mimeType: string;
    sizeBytes: number;
  };
}

interface SourcesTabProps {
  projectId: number;
}

export function SourcesTab({ projectId }: SourcesTabProps) {
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.sources.list(projectId),
    queryFn: () => api.get<{ data: Source[] }>(`/projects/${projectId}/sources`),
  });

  const deleteMutation = useMutation({
    mutationFn: (sourceId: number) => api.delete(`/sources/${sourceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sources.list(projectId) });
      toast({ title: 'Source deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete source', variant: 'destructive' });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('name', files[0].name);

    try {
      await api.upload(`/projects/${projectId}/sources/file`, formData);
      queryClient.invalidateQueries({ queryKey: queryKeys.sources.list(projectId) });
      toast({ title: 'File uploaded successfully' });
    } catch {
      toast({ title: 'Failed to upload file', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: Source['status']) => {
    switch (status) {
      case 'ready':
        return 'text-success';
      case 'processing':
        return 'text-info';
      case 'error':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <div className="text-destructive">Failed to load sources</div>;
  }

  const sources = data?.data || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Data Sources</CardTitle>
        <div>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".csv,.xlsx,.xls,.json"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <label htmlFor="file-upload">
            <Button asChild disabled={isUploading}>
              <span>
                {isUploading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Upload File
              </span>
            </Button>
          </label>
        </div>
      </CardHeader>
      <CardContent>
        {sources.length === 0 ? (
          <EmptyState
            title="No sources yet"
            description="Upload a CSV, Excel, or JSON file to get started."
            icon={File}
          />
        ) : (
          <div className="space-y-4">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <File className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{source.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {source.fileSource && (
                        <>
                          <span>{formatBytes(source.fileSource.sizeBytes)}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{source.recordCount.toLocaleString()} records</span>
                      <span>•</span>
                      <span className={getStatusColor(source.status)}>
                        {source.status}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(source.id)}
                  disabled={deleteMutation.isPending}
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
