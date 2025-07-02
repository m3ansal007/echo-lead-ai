
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Bell, Settings, User } from 'lucide-react';

interface HeaderProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  onToggleSidebar: () => void;
  onToggleAI: () => void;
}

const Header = ({ user, onToggleSidebar, onToggleAI }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex items-center flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search leads, contacts, or companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* AI Assistant Button */}
        <Button
          onClick={onToggleAI}
          variant="outline"
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 border-blue-600 text-white"
        >
          AI Assistant
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5 text-gray-400" />
          <Badge className="absolute -top-1 -right-1 w-2 h-2 p-0 bg-red-500" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 p-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src="/placeholder.svg" alt={user.name} />
                <AvatarFallback className="bg-blue-600 text-white">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-400 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
            <DropdownMenuLabel className="text-white">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem className="text-gray-300 hover:bg-gray-700 hover:text-white">
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-gray-300 hover:bg-gray-700 hover:text-white">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem className="text-red-400 hover:bg-red-500/10 hover:text-red-300">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
