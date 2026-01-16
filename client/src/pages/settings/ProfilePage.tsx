import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title="Profile"
        description="Manage your account settings"
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={user?.name || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input value={user?.role || ''} disabled className="capitalize" />
          </div>
          <div className="space-y-2">
            <Label>Organisation</Label>
            <Input value={user?.organisation?.name || ''} disabled />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
