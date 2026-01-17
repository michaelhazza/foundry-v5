import { UserMenu } from './UserMenu';

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div>
        {/* Breadcrumbs or page title can go here */}
      </div>
      <UserMenu />
    </header>
  );
}
