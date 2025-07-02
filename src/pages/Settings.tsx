
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, User, Lock, Palette, Bell, Save, LogOut } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    role: '',
    avatar_url: ''
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
    fetchProfile();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    setUser(session.user);
  };

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || session.user.email || '',
          role: data.role || '',
          avatar_url: data.avatar_url || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    setMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          full_name: profile.full_name,
          avatar_url: profile.avatar_url
        })
        .eq('id', session.user.id);

      if (error) throw error;
      setMessage('Profile updated successfully!');
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/auth');
    } catch (error: any) {
      setMessage(`Error signing out: ${error.message}`);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ];

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
              <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
              <p className="text-gray-400">Manage your account settings and preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Settings Navigation */}
              <div className="lg:col-span-1">
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-4">
                    <nav className="space-y-2">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                            activeTab === tab.id
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-300 hover:bg-gray-800'
                          }`}
                        >
                          <tab.icon className="w-4 h-4" />
                          {tab.label}
                        </button>
                      ))}
                      <Separator className="my-4 bg-gray-700" />
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </nav>
                  </CardContent>
                </Card>
              </div>

              {/* Settings Content */}
              <div className="lg:col-span-3">
                {message && (
                  <Alert className="mb-6 bg-gray-800 border-gray-700">
                    <AlertDescription className="text-gray-300">{message}</AlertDescription>
                  </Alert>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        Profile Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center gap-6">
                        <Avatar className="w-20 h-20">
                          <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt="Profile" />
                          <AvatarFallback className="bg-blue-600 text-white text-lg">
                            {profile.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                            Upload Photo
                          </Button>
                          <p className="text-sm text-gray-400 mt-2">JPG, PNG or GIF. Max size 2MB.</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="full_name" className="text-gray-300">Full Name</Label>
                          <Input
                            id="full_name"
                            value={profile.full_name}
                            onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                            className="bg-gray-800 border-gray-700 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-gray-300">Email</Label>
                          <Input
                            id="email"
                            value={profile.email}
                            disabled
                            className="bg-gray-800 border-gray-700 text-gray-400"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role" className="text-gray-300">Role</Label>
                        <Input
                          id="role"
                          value={profile.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          disabled
                          className="bg-gray-800 border-gray-700 text-gray-400"
                        />
                      </div>

                      <Button onClick={handleUpdateProfile} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Lock className="w-5 h-5 mr-2" />
                        Security Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-white">Password</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="current_password" className="text-gray-300">Current Password</Label>
                            <Input
                              id="current_password"
                              type="password"
                              className="bg-gray-800 border-gray-700 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new_password" className="text-gray-300">New Password</Label>
                            <Input
                              id="new_password"
                              type="password"
                              className="bg-gray-800 border-gray-700 text-white"
                            />
                          </div>
                        </div>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          Update Password
                        </Button>
                      </div>

                      <Separator className="bg-gray-700" />

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-white">Two-Factor Authentication</h3>
                        <p className="text-gray-400">Add an extra layer of security to your account</p>
                        <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                          Enable 2FA
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Bell className="w-5 h-5 mr-2" />
                        Notification Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-medium">Email Notifications</h4>
                            <p className="text-gray-400 text-sm">Receive notifications via email</p>
                          </div>
                          <Button variant="outline" className="border-gray-600 text-gray-300">
                            Configure
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-medium">Push Notifications</h4>
                            <p className="text-gray-400 text-sm">Receive browser notifications</p>
                          </div>
                          <Button variant="outline" className="border-gray-600 text-gray-300">
                            Configure
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-medium">Lead Updates</h4>
                            <p className="text-gray-400 text-sm">Get notified when leads are updated</p>
                          </div>
                          <Button variant="outline" className="border-gray-600 text-gray-300">
                            Configure
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Appearance Tab */}
                {activeTab === 'appearance' && (
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Palette className="w-5 h-5 mr-2" />
                        Appearance Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-gray-300">Theme</Label>
                          <Select defaultValue="dark">
                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              <SelectItem value="dark">Dark</SelectItem>
                              <SelectItem value="light">Light</SelectItem>
                              <SelectItem value="system">System</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-gray-300">Language</Label>
                          <Select defaultValue="en">
                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="es">Spanish</SelectItem>
                              <SelectItem value="fr">French</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
