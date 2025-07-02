
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Calendar, Settings, Bell, Search } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import LeadsList from '@/components/LeadsList';
import AIAssistant from '@/components/AIAssistant';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Mock stats data
  const stats = [
    { title: 'Total Leads', value: '2,547', change: '+12%', icon: Users, trend: 'up' as const },
    { title: 'Hot Leads', value: '284', change: '+8%', icon: Plus, trend: 'up' as const },
    { title: 'Converted', value: '156', change: '+23%', icon: Calendar, trend: 'up' as const },
    { title: 'Revenue', value: '$45,890', change: '+15%', icon: Settings, trend: 'up' as const },
  ];

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      
      setUser(session.user);
      
      // Fetch user profile to get role
      const { data: profile, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        await supabase.auth.signOut();
        navigate('/auth');
        return;
      }
      
      setUserProfile(profile);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
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
      {!user ? (
        // Landing page for non-authenticated users
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md bg-gray-900 border-gray-800 text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl text-white">Welcome to LeadCRM</CardTitle>
              <CardDescription className="text-gray-400">
                Manage your sales leads efficiently
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => navigate('/auth')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Sign In / Sign Up
              </Button>
              <p className="text-sm text-gray-500">
                Start managing your leads today
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Main dashboard for authenticated users
        <div className="flex">
          <Sidebar 
            isOpen={sidebarOpen} 
            onToggle={() => setSidebarOpen(!sidebarOpen)} 
            userRole={userProfile?.role || 'sales_associate'} 
          />
          
          <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
            <Header 
              user={{
                id: user.id,
                name: userProfile?.full_name || user.email,
                email: user.email,
                role: userProfile?.role || 'sales_associate'
              }} 
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              onToggleAI={() => setAiAssistantOpen(!aiAssistantOpen)}
            />
            
            <div className="p-8 space-y-8">
              {/* Welcome Section */}
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Welcome back, {userProfile?.full_name || user.email}
                </h1>
                <p className="text-gray-400">
                  Here's what's happening with your leads today.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <StatsCard key={index} {...stat} />
                ))}
              </div>

              {/* Recent Activity & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-white">Recent Leads</CardTitle>
                        <CardDescription className="text-gray-400">
                          Latest leads requiring attention
                        </CardDescription>
                      </div>
                      {(userProfile?.role === 'admin' || userProfile?.role === 'sales_manager' || userProfile?.role === 'sales_associate') && (
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => navigate('/add-lead')}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Lead
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent>
                      <LeadsList />
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  {/* Quick Actions */}
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(userProfile?.role === 'admin' || userProfile?.role === 'sales_manager' || userProfile?.role === 'sales_associate') && (
                        <Button 
                          className="w-full justify-start bg-gray-800 hover:bg-gray-700 text-white"
                          onClick={() => navigate('/add-lead')}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create New Lead
                        </Button>
                      )}
                      <Button 
                        className="w-full justify-start bg-gray-800 hover:bg-gray-700 text-white"
                        onClick={() => navigate('/reminders')}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Follow-up
                      </Button>
                      {(userProfile?.role === 'admin' || userProfile?.role === 'sales_manager') && (
                        <Button 
                          className="w-full justify-start bg-gray-800 hover:bg-gray-700 text-white"
                          onClick={() => navigate('/assign-leads')}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Assign Leads
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Today's Reminders */}
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Bell className="w-5 h-5 mr-2" />
                        Today's Reminders
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-white">Follow up with Acme Corp</p>
                            <p className="text-xs text-gray-400">2:00 PM</p>
                          </div>
                          <Badge variant="outline" className="border-blue-500 text-blue-400">
                            High
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-white">Team meeting</p>
                            <p className="text-xs text-gray-400">4:30 PM</p>
                          </div>
                          <Badge variant="outline" className="border-gray-500 text-gray-400">
                            Medium
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>

          {/* AI Assistant Sidebar */}
          <AIAssistant isOpen={aiAssistantOpen} onToggle={() => setAiAssistantOpen(!aiAssistantOpen)} />
        </div>
      )}
    </div>
  );
};

export default Index;
