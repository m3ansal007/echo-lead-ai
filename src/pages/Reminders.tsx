
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Plus, Clock, CheckCircle, AlertTriangle, Filter } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';

interface Reminder {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  lead_id: string;
  created_at: string;
  leads?: {
    name: string;
    company: string;
  };
}

const Reminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filteredReminders, setFilteredReminders] = useState<Reminder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  const currentUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@company.com',
    role: 'admin' as const
  };

  useEffect(() => {
    checkUser();
    fetchReminders();
  }, []);

  useEffect(() => {
    filterReminders();
  }, [reminders, priorityFilter, statusFilter]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    setUser(session.user);
  };

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select(`
          *,
          leads (
            name,
            company
          )
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReminders = () => {
    let filtered = reminders;

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(reminder => reminder.priority === priorityFilter);
    }

    if (statusFilter === 'completed') {
      filtered = filtered.filter(reminder => reminder.completed);
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(reminder => !reminder.completed);
    }

    setFilteredReminders(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('reminders')
        .insert([
          {
            ...formData,
            assigned_to: session.user.id,
            created_by: session.user.id
          }
        ]);

      if (error) throw error;

      setMessage('Reminder created successfully!');
      setFormData({
        title: '',
        description: '',
        due_date: '',
        priority: 'medium'
      });
      setShowForm(false);
      await fetchReminders();
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const toggleComplete = async (reminderId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ completed: !completed })
        .eq('id', reminderId);

      if (error) throw error;
      await fetchReminders();
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'low': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (dueDate: string, completed: boolean) => {
    return !completed && new Date(dueDate) < new Date();
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
                <h1 className="text-3xl font-bold text-white mb-2">Reminders</h1>
                <p className="text-gray-400">Manage your tasks and follow-ups</p>
              </div>
              <Button 
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Reminder
              </Button>
            </div>

            {/* Add Reminder Form */}
            {showForm && (
              <Card className="bg-gray-900 border-gray-800 mb-6">
                <CardHeader>
                  <CardTitle className="text-white">Create New Reminder</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-gray-300">Title *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          className="bg-gray-800 border-gray-700 text-white"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="due_date" className="text-gray-300">Due Date *</Label>
                        <Input
                          id="due_date"
                          type="datetime-local"
                          value={formData.due_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                          className="bg-gray-800 border-gray-700 text-white"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-gray-300">Priority</Label>
                      <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setFormData(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-gray-300">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-gray-800 border-gray-700 text-white"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-4">
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                        Create Reminder
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Filters */}
            <Card className="bg-gray-900 border-gray-800 mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {message && (
              <Alert className="mb-6 bg-gray-800 border-gray-700">
                <AlertDescription className="text-gray-300">{message}</AlertDescription>
              </Alert>
            )}

            {/* Reminders List */}
            <div className="space-y-4">
              {filteredReminders.length === 0 ? (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-8 text-center">
                    <div className="text-gray-400">No reminders found</div>
                  </CardContent>
                </Card>
              ) : (
                filteredReminders.map((reminder) => (
                  <Card 
                    key={reminder.id} 
                    className={`bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors ${
                      reminder.completed ? 'opacity-60' : ''
                    } ${
                      isOverdue(reminder.due_date, reminder.completed) ? 'border-red-500/30' : ''
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <button
                            onClick={() => toggleComplete(reminder.id, reminder.completed)}
                            className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              reminder.completed 
                                ? 'bg-green-600 border-green-600' 
                                : 'border-gray-600 hover:border-green-600'
                            }`}
                          >
                            {reminder.completed && <CheckCircle className="w-3 h-3 text-white" />}
                          </button>
                          <div className="flex-1">
                            <h3 className={`font-semibold text-lg ${reminder.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                              {reminder.title}
                            </h3>
                            {reminder.description && (
                              <p className="text-gray-400 mt-1">{reminder.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-3 text-sm">
                              <div className="flex items-center gap-1 text-gray-400">
                                <Calendar className="w-4 h-4" />
                                {formatDateTime(reminder.due_date)}
                                {isOverdue(reminder.due_date, reminder.completed) && (
                                  <span className="text-red-400 ml-2">(Overdue)</span>
                                )}
                              </div>
                              {reminder.leads && (
                                <div className="text-gray-400">
                                  Related to: {reminder.leads.name} ({reminder.leads.company})
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className={getPriorityColor(reminder.priority)}>
                          <div className="flex items-center gap-1">
                            {getPriorityIcon(reminder.priority)}
                            {reminder.priority.toUpperCase()}
                          </div>
                        </Badge>
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

export default Reminders;
