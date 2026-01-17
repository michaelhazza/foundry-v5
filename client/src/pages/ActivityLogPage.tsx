import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ActivityLogPage() {
  return (
    <div>
      <PageHeader
        title="Activity Log"
        description="View all activity in your organisation"
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Activity log interface will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
