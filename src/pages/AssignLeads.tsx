
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserCheck, Users } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';

interface Lead {
  id: string;
  name: string;
  company: string;
  status: string;
  value: number;
  assigned_to: string;
  profiles: {
    full_name: string;
  } | null;
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

const AssignLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  const currentUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@company.com',
    role: 'admin' as const
  };

  useEffect(() => {
    checkUser();
    fetchData();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    setUser(session.user);
  };

  const fetchData = async () => {
    try {
      const [leadsResponse, profilesResponse] = await Promise.all([
        supabase
          .from('leads')
          .select(`
            id,
            name,
            company,
            status,
            value,
            assigned_to,
            profiles:assigned_to (
              full_name
            )
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('id, full_name, role')
          .order('full_name')
      ]);

      if (leadsResponse.error) throw leadsResponse.error;
      if (profilesResponse.error) throw profilesResponse.error;

      setLeads(leadsResponse.data || []);
      setProfiles(profilesResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleBulkAssign = async () => {
    if (!selectedAssignee || selectedLeads.length === 0) return;

    setUpdating(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('leads')
        .update({ assigned_to: selectedAssignee })
        .in('id', selectedLeads);

      if (error) throw error;

      setMessage(`Successfully assigned ${selectedLeads.length} leads!`);
      setSelectedLeads([]);
      setSelectedAssignee('');
      await fetchData();
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'warm': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'cold': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'converted': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'lost': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} userRole={currentUser.role} />
        
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <Header 
            user={currentUser} 
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onToggleAI={() => {}}
          />
          
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Assign Leads</h1>
              <p className="text-gray-400">Assign leads to team members</p>
            </div>

            {/* Bulk Assignment Controls */}
            <Card className="bg-gray-900 border-gray-800 mb-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <UserCheck className="w-5 h-5 mr-2" />
                  Bulk Assignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Assign to Team Member
                    </label>
                    <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.full_name} ({profile.role.replace('_', ' ')})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleBulkAssign}
                    disabled={!selectedAssignee || selectedLeads.length === 0 || updating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {updating ? 'Assigning...' : `Assign ${selectedLeads.length} Lead${selectedLeads.length !== 1 ? 's' : ''}`}
                  </Button>
                </div>
                {selectedLeads.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-400">
                      {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {message && (
              <Alert className="mb-6 bg-gray-800 border-gray-700">
                <AlertDescription className="text-gray-300">{message}</AlertDescription>
              </Alert>
            )}

            {/* Leads List */}
            <div className="space-y-4">
              {leads.length === 0 ? (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-8 text-center">
                    <div className="text-gray-400">No leads found</div>
                  </CardContent>
                </Card>
              ) : (
                leads.map((lead) => (
                  <Card 
                    key={lead.id} 
                    className={`bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors cursor-pointer ${
                      selectedLeads.includes(lead.id) ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => handleLeadSelection(lead.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            checked={selectedLeads.includes(lead.id)}
                            onChange={() => handleLeadSelection(lead.id)}
                            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
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
                        <div className="flex items-center space-x-4">
                          <Badge variant="outline" className={getStatusColor(lead.status)}>
                            {lead.status.toUpperCase()}
                          </Badge>
                          {lead.value && (
                            <span className="text-sm font-medium text-green-400">
                              {formatValue(lead.value)}
                            </span>
                          )}
                          <div className="text-sm text-gray-400">
                            {lead.profiles ? (
                              <span>Assigned to: {lead.profiles.full_name}</span>
                            ) : (
                              <span className="text-yellow-400">Unassigned</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AssignLeads;
