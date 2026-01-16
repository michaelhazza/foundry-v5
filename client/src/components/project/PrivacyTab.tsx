import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/common/LoadingState';
import { useToast } from '@/hooks/useToast';
import { Shield, Eye } from 'lucide-react';

interface PrivacyConfig {
  detectNames: boolean;
  detectEmails: boolean;
  detectPhones: boolean;
  detectAddresses: boolean;
  detectCompanies: boolean;
  detectCreditCards: boolean;
  detectSsn: boolean;
}

interface PrivacyRule {
  id: number;
  name: string;
  pattern: string;
  replacement: string;
  isEnabled: boolean;
}

interface PrivacyTabProps {
  projectId: number;
}

export function PrivacyTab({ projectId }: PrivacyTabProps) {
  const [previewText, setPreviewText] = useState('');
  const [previewResult, setPreviewResult] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: queryKeys.privacy.config(projectId),
    queryFn: () => api.get<{ data: PrivacyConfig }>(`/projects/${projectId}/privacy`),
  });

  const { data: rulesData } = useQuery({
    queryKey: queryKeys.privacy.rules(projectId),
    queryFn: () => api.get<{ data: PrivacyRule[] }>(`/projects/${projectId}/privacy/rules`),
  });

  const updateConfigMutation = useMutation({
    mutationFn: (config: Partial<PrivacyConfig>) =>
      api.put(`/projects/${projectId}/privacy`, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.privacy.config(projectId) });
      toast({ title: 'Privacy settings updated' });
    },
  });

  const previewMutation = useMutation({
    mutationFn: (sampleText: string) =>
      api.post<{ data: { original: string; deidentified: string; stats: Record<string, number> } }>(
        `/projects/${projectId}/privacy/preview`,
        { sampleText }
      ),
    onSuccess: (data) => {
      setPreviewResult(data.data.deidentified);
    },
  });

  if (configLoading) {
    return <LoadingState />;
  }

  const config = configData?.data || {
    detectNames: true,
    detectEmails: true,
    detectPhones: true,
    detectAddresses: true,
    detectCompanies: true,
    detectCreditCards: true,
    detectSsn: true,
  };

  const rules = rulesData?.data || [];

  const privacyOptions = [
    { key: 'detectNames', label: 'Names', description: 'Detect and replace person names' },
    { key: 'detectEmails', label: 'Emails', description: 'Detect and replace email addresses' },
    { key: 'detectPhones', label: 'Phone Numbers', description: 'Detect and replace phone numbers' },
    { key: 'detectAddresses', label: 'Addresses', description: 'Detect and replace physical addresses' },
    { key: 'detectCompanies', label: 'Company Names', description: 'Detect and replace company names' },
    { key: 'detectCreditCards', label: 'Credit Cards', description: 'Detect and replace credit card numbers' },
    { key: 'detectSsn', label: 'SSN', description: 'Detect and replace Social Security Numbers' },
  ] as const;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Privacy Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure which types of PII to detect and de-identify
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {privacyOptions.map((option) => (
              <label
                key={option.key}
                className="flex items-center justify-between rounded-lg border p-4 cursor-pointer hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium">{option.label}</p>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
                <input
                  type="checkbox"
                  checked={config[option.key]}
                  onChange={(e) =>
                    updateConfigMutation.mutate({ [option.key]: e.target.checked })
                  }
                  className="h-4 w-4"
                />
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            <CardTitle>Preview De-identification</CardTitle>
          </div>
          <CardDescription>
            Test your privacy settings with sample text
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-2 min-h-[100px]"
            placeholder="Enter sample text containing PII to test..."
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
          />
          <Button
            onClick={() => previewMutation.mutate(previewText)}
            disabled={!previewText.trim() || previewMutation.isPending}
          >
            Preview
          </Button>
          {previewResult && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium mb-2">Result:</p>
              <p className="text-sm">{previewResult}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {rules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Rules</CardTitle>
            <CardDescription>
              Additional pattern-based rules for de-identification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{rule.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {rule.pattern}
                    </p>
                  </div>
                  <span
                    className={`text-sm ${rule.isEnabled ? 'text-success' : 'text-muted-foreground'}`}
                  >
                    {rule.isEnabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
