import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && event === 'SIGNED_IN') {
        // Ensure profile exists and is valid
        await ensureProfileExists(session.user.id);
        
        // Check if user has a valid profile
        const { data: profile, error } = await (supabase as any)
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile && !error) {
          navigate('/');
        } else {
          setMessage('Profile setup incomplete. Please contact your administrator.');
          await supabase.auth.signOut();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const ensureProfileExists = async (userId: string) => {
    try {
      // Call the database function to ensure profile exists
      const { error } = await (supabase as any).rpc('ensure_profile_exists', {
        user_id: userId
      });
      
      if (error) {
        console.error('Error ensuring profile exists:', error);
      }
    } catch (error) {
      console.error('Error in ensureProfileExists:', error);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        if (data.user) {
          // Ensure profile exists
          await ensureProfileExists(data.user.id);
          
          // Verify user has a valid profile
          const { data: profile, error: profileError } = await (supabase as any)
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          if (profileError || !profile) {
            setMessage('Profile not found. Please contact your administrator.');
            await supabase.auth.signOut();
            return;
          }
          
          // Success - navigation will be handled by the auth state change listener
        }
      } else {
        // For signup, create user with metadata
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: 'sales_associate' // Default role for self-registration
            },
          },
        });
        
        if (error) throw error;
        
        if (data.user) {
          // Ensure profile is created
          await ensureProfileExists(data.user.id);
          
          if (data.user.email_confirmed_at) {
            // User is immediately confirmed, proceed to login
            setMessage('Account created successfully! You can now sign in.');
            setIsLogin(true);
          } else {
            setMessage('Account created! Please check your email for verification, then you can sign in.');
            setIsLogin(true);
          }
        }
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white">LeadCRM</CardTitle>
          <CardDescription className="text-gray-400">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-300">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  required={!isLogin}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>
          
          {message && (
            <Alert className="mt-4 bg-gray-800 border-gray-700">
              <AlertDescription className="text-gray-300">{message}</AlertDescription>
            </Alert>
          )}
          
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
