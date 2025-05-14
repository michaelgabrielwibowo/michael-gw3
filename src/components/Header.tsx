
import { Library } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Library className="h-8 w-8 mr-3" />
          <h1 className="text-2xl font-bold tracking-tight">Usefuls</h1>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          {/* LanguageSwitcher removed */}
        </div>
      </div>
    </header>
  );
}
