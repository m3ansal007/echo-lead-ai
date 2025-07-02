import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Plus, Filter, Calendar, User, Mail, Phone, Building2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'hot' | 'warm' | 'cold' | 'converted' | 'lost';
  value: number;
  created_at: string;
  assigned_to: string;
  profiles: {
    full_name: string;
  } | null;
}

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
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
    fetchLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    setUser(session.user);
  };

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    setFilteredLeads(filtered);
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Leads</h1>
                <p className="text-gray-400">Manage and track your sales leads</p>
              </div>
              <Button 
                onClick={() => navigate('/add-lead')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Lead
              </Button>
            </div>

            {/* Filters */}
            <Card className="bg-gray-900 border-gray-800 mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search leads..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {['all', 'hot', 'warm', 'cold', 'converted', 'lost'].map((status) => (
                      <Button
                        key={status}
                        variant={statusFilter === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter(status)}
                        className={statusFilter === status 
                          ? "bg-blue-600 hover:bg-blue-700" 
                          : "border-gray-600 text-gray-300 hover:bg-gray-700"
                        }
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leads List */}
            <div className="space-y-4">
              {filteredLeads.length === 0 ? (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-8 text-center">
                    <div className="text-gray-400">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'No leads match your filters' 
                        : 'No leads found. Create your first lead!'
                      }
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredLeads.map((lead) => (
                  <Card key={lead.id} className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src="/placeholder.svg" alt={lead.name} />
                            <AvatarFallback className="bg-blue-600 text-white">
                              {lead.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white text-lg">{lead.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                              {lead.company && (
                                <div className="flex items-center gap-1">
                                  <Building2 className="w-4 h-4" />
                                  {lead.company}
                                </div>
                              )}
                              {lead.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="w-4 h-4" />
                                  {lead.email}
                                </div>
                              )}
                              {lead.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="w-4 h-4" />
                                  {lead.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge variant="outline" className={getStatusColor(lead.status)}>
                            {lead.status.toUpperCase()}
                          </Badge>
                          {lead.value && (
                            <span className="text-lg font-semibold text-green-400">
                              {formatValue(lead.value)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-400">
                          {lead.profiles && (
                            <span>Assigned to: {lead.profiles.full_name}</span>
                          )}
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

export default Leads;