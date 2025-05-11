import type { LinkItem } from '@/types';
import { LinkCard } from './LinkCard';

interface LinkListProps {
  links: LinkItem[];
}

export function LinkList({ links }: LinkListProps) {
  if (links.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <p className="text-xl">No links found.</p>
        <p>Try adjusting your filters or suggesting new links!</p>
      </div>
    );
  }

  return (
    <div id="link-list-container" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {links.map((link) => (
        <LinkCard key={link.id} link={link} />
      ))}
    </div>
  );
}
