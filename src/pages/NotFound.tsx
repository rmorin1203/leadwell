import { Compass } from 'lucide-react';
import { EmptyState, LinkButton } from '../components/ui';

export default function NotFound({ message }: { message?: string }) {
  return (
    <EmptyState icon={Compass} title="Page not found" headingLevel={1} action={<LinkButton to="/">Go to dashboard</LinkButton>}>
      {message ?? "The page you're looking for doesn't exist or has moved."}
    </EmptyState>
  );
}
