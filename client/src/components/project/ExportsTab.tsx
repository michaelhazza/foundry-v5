import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { Download, FileJson, FileText, Package } from 'lucide-react';

interface Export {
  id: number;
  format: 'json' | 'jsonl' | 'csv';
  status: 'pending' | 'generating' | 'ready' | 'error';
  recordCount: number;
  sizeBytes: number | null;
  createdAt: string;
  run: {
    id: number;
    completedAt: string;
  };
}

interface ExportsTabProps {
  projectId: number;
}

export function ExportsTab({ projectId }: ExportsTabProps) {
  const { data: historyData, isLoading } = useQuery({
    queryKey: queryKeys.processing.history(projectId),
    queryFn: () => api.get<{ data: { id: number }[] }>(`/projects/${projectId}/runs`),
  });

  // Get exports for the latest completed run
  const latestRunId = historyData?.data?.[0]?.id;

  const { data: exportsData, isLoading: exportsLoading } = useQuery({
    queryKey: queryKeys.exports.list(latestRunId || 0),
    queryFn: () => api.get<{ data: Export[] }>(`/runs/${latestRunId}/exports`),
    enabled: !!latestRunId,
  });

  const handleDownload = async (exportId: number) => {
    try {
      const response = await fetch(`/api/exports/${exportId}/download`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `export-${exportId}.json`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFormatIcon = (format: Export['format']) => {
    switch (format) {
      case 'json':
        return <FileJson className="h-8 w-8 text-primary" />;
      case 'jsonl':
        return <FileText className="h-8 w-8 text-info" />;
      case 'csv':
        return <FileText className="h-8 w-8 text-success" />;
      default:
        return <Package className="h-8 w-8" />;
    }
  };

  if (isLoading || exportsLoading) {
    return <LoadingState />;
  }

  const exports = exportsData?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exports</CardTitle>
        <CardDescription>
          Download your processed data in various formats
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!latestRunId ? (
          <EmptyState
            title="No exports available"
            description="Process your data first to generate exports."
            icon={Download}
          />
        ) : exports.length === 0 ? (
          <EmptyState
            title="No exports generated"
            description="Exports are generated after processing completes."
            icon={Download}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {exports.map((exp) => (
              <div
                key={exp.id}
                className="rounded-lg border p-4 flex flex-col items-center text-center"
              >
                {getFormatIcon(exp.format)}
                <p className="font-medium mt-3 uppercase">{exp.format}</p>
                <p className="text-sm text-muted-foreground">
                  {exp.recordCount.toLocaleString()} records
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatBytes(exp.sizeBytes)}
                </p>
                <Button
                  className="mt-4 w-full"
                  size="sm"
                  disabled={exp.status !== 'ready'}
                  onClick={() => handleDownload(exp.id)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {exp.status === 'ready' ? 'Download' : exp.status}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
