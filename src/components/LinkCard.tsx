'use client';

import type { LinkItem } from '@/types';
import { CATEGORIES_INFO } from '@/data/staticLinks';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Lightbulb } from 'lucide-react';

interface LinkCardProps {
  link: LinkItem;
}

export function LinkCard({ link }: LinkCardProps) {
  const categoryInfo = CATEGORIES_INFO[link.category] || { icon: ExternalLink, color: 'text-gray-500', name: link.category };
  const IconComponent = categoryInfo.icon;

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <IconComponent className={`h-6 w-6 ${categoryInfo.color}`} />
          {link.source === 'ai' && (
            <Badge variant="outline" className="flex items-center gap-1 border-accent text-accent">
              <Lightbulb className="h-3 w-3" /> AI
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg font-semibold">{link.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardDescription className="text-sm text-muted-foreground">{link.description}</CardDescription>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" asChild className="w-full hover:bg-accent hover:text-accent-foreground">
          <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
            Visit Link <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
