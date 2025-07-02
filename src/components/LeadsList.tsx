
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Plus, User } from 'lucide-react';

const LeadsList = () => {
  // Mock data - this will come from Supabase
  const leads = [
    {
      id: '1',
      name: 'Sarah Johnson',
      company: 'Acme Corp',
      email: 'sarah@acme.com',
      status: 'hot',
      value: '$25,000',
      assignedTo: 'John Doe',
      lastContact: '2 hours ago'
    },
    {
      id: '2',
      name: 'Michael Chen',
      company: 'TechStart Inc',
      email: 'michael@techstart.com',
      status: 'warm',
      value: '$12,500',
      assignedTo: 'Jane Smith',
      lastContact: '1 day ago'
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      company: 'GrowthCo',
      email: 'emily@growthco.com',
      status: 'cold',
      value: '$8,000',
      assignedTo: 'Bob Wilson',
      lastContact: '3 days ago'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'warm': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'cold': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-4">
      {leads.map((lead) => (
        <div key={lead.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src="/placeholder.svg" alt={lead.name} />
                <AvatarFallback className="bg-blue-600 text-white">
                  {lead.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium text-white">{lead.name}</h4>
                <p className="text-sm text-gray-400">{lead.company}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className={getStatusColor(lead.status)}>
                {lead.status.toUpperCase()}
              </Badge>
              <span className="text-sm font-medium text-green-400">{lead.value}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-4">
              <span>Assigned to: {lead.assignedTo}</span>
              <span>Last contact: {lead.lastContact}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-600">
                <Calendar className="w-4 h-4 mr-1" />
                Follow up
              </Button>
              <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-600">
                <User className="w-4 h-4 mr-1" />
                Assign
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LeadsList;
