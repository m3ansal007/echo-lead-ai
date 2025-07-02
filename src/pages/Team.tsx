import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Mail, Calendar, TrendingUp, Search, Plus, X } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'manager' | 'sales_rep' | 'user';
  created_at: string;
  leads_count?: number;
  converted_count?: number;
}

const Team = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    full_name: '',
    role: 'user' as 'admin' | 'manager' | 'sales_rep' | 'user'
  });
  const navigate = useNavigate();

  const currentUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@company.com',
    role: 'admin' as const
  };

  useEffect(() => {
    checkUser();
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [teamMembers, searchTerm, roleFilter]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    setUser(session.user);
  };

  const fetchTeamMembers = async () => {
    try {
      // Fetch profiles with lead counts
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch lead counts for each member
      const membersWithStats = await Promise.all(
        (profiles || []).map(async (member: any) => {
          const [leadsResponse, convertedResponse] = await Promise.all([
            supabase
              .from('leads')
              .select('id')
              .eq('assigned_to', member.id),
            supabase
              .from('leads')
              .select('id')
              .eq('assigned_to', member.id)
              .eq('status', 'converted')
          ]);

          return {
            ...member,
            leads_count: leadsResponse.data?.length || 0,
            converted_count: convertedResponse.data?.length || 0
          };
        })
      );

      setTeamMembers(membersWithStats);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setMessage('Error loading team members');
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = teamMembers;

    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(member => member.role === roleFilter);
    }

    setFilteredMembers(filtered);
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setMessage('');

    try {
      // First, create a user account using Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: inviteForm.email,
        password: 'TempPassword123!', // In production, you'd generate a secure temporary password
        options: {
          data: {
            full_name: inviteForm.full_name,
            role: inviteForm.role
          }
        }
      });

      if (authError) {
        // If user already exists, we'll create a profile entry with a mock ID for demo purposes
        if (authError.message.includes('already registered')) {
          // For demo purposes, create a profile with a generated UUID
          // In production, you'd handle existing users differently
          const mockUserId = crypto.randomUUID();
          
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: mockUserId,
                full_name: inviteForm.full_name,
                role: inviteForm.role
              }
            ]);

          if (profileError) throw profileError;
          
          setMessage(`Demo invitation created for ${inviteForm.email}! (User already exists in system)`);
        } else {
          throw authError;
        }
      } else {
        // If user was created successfully, the profile should be created automatically via trigger
        setMessage(`Invitation sent to ${inviteForm.email} successfully! They will receive an email to confirm their account.`);
      }

      setInviteForm({ email: '', full_name: '', role: 'user' });
      setShowInviteDialog(false);
      await fetchTeamMembers();
    } catch (error: any) {
      console.error('Invitation error:', error);
      setMessage(`Error sending invitation: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setInviteLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'manager': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'sales_rep': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'user': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const formatRoleName = (role: string) => {
    switch (role) {
      case 'sales_rep': return 'Sales Rep';
      default: return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
                <h1 className="text-3xl font-bold text-white mb-2">Team</h1>
                <p className="text-gray-400">Manage your sales team and view performance</p>
              </div>
              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-800 text-white">
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Send an invitation to join your team. They will receive an email to set up their account.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleInviteMember} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-300">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-gray-800 border-gray-700 text-white"
                        placeholder="colleague@company.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-gray-300">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={inviteForm.full_name}
                        onChange={(e) => setInviteForm(prev => ({ ...prev, full_name: e.target.value }))}
                        className="bg-gray-800 border-gray-700 text-white"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-gray-300">Role</Label>
                      <Select value={inviteForm.role} onValueChange={(value: 'admin' | 'manager' | 'sales_rep' | 'user') => setInviteForm(prev => ({ ...prev, role: value }))}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="sales_rep">Sales Rep</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowInviteDialog(false)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={inviteLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {inviteLoading ? 'Sending...' : 'Send Invitation'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Total Members</p>
                      <p className="text-2xl font-bold text-white">{teamMembers.length}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Admins</p>
                      <p className="text-2xl font-bold text-white">
                        {teamMembers.filter(m => m.role === 'admin').length}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Managers</p>
                      <p className="text-2xl font-bold text-white">
                        {teamMembers.filter(m => m.role === 'manager').length}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Sales Reps</p>
                      <p className="text-2xl font-bold text-white">
                        {teamMembers.filter(m => m.role === 'sales_rep').length}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="bg-gray-900 border-gray-800 mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search team members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="sales_rep">Sales Rep</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {message && (
              <Alert className="mb-6 bg-gray-800 border-gray-700">
                <AlertDescription className="text-gray-300">{message}</AlertDescription>
              </Alert>
            )}

            {/* Team Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.length === 0 ? (
                <div className="col-span-full">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardContent className="p-8 text-center">
                      <div className="text-gray-400">
                        {searchTerm || roleFilter !== 'all' 
                          ? 'No team members match your filters' 
                          : 'No team members found'
                        }
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                filteredMembers.map((member) => (
                  <Card key={member.id} className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src="/placeholder.svg" alt={member.full_name} />
                          <AvatarFallback className="bg-blue-600 text-white">
                            {member.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{member.full_name || 'Unnamed User'}</h3>
                          <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                            <Mail className="w-3 h-3" />
                            {member.email || 'No email'}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Role</span>
                          <Badge variant="outline" className={getRoleBadgeColor(member.role)}>
                            {formatRoleName(member.role)}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Assigned Leads</span>
                          <span className="text-sm font-medium text-white">{member.leads_count || 0}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Converted</span>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-green-400" />
                            <span className="text-sm font-medium text-green-400">{member.converted_count || 0}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Joined</span>
                          <div className="flex items-center gap-1 text-sm text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {formatDate(member.created_at)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <Button size="sm" variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700">
                          View Details
                        </Button>
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

export default Team;