/**
 * Login Page
 * Handles user authentication with route preservation
 */

import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { validateLogin } from '../utils/auth';
import { Input } from '../components/shared/Input';
import { Button } from '../components/shared/Button';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { state: authState, dispatch } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended route from location state, or default to dashboard
  const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';

  // Redirect if already authenticated
  if (authState.isAuthenticated && !authState.isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      const authResponse = await validateLogin({ email, password });

      if (authResponse) {
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: { user: authResponse.user, token: authResponse.token } 
        });
        toast.success(`Welcome back, ${authResponse.user.name}!`);
        navigate(from, { replace: true });
      } else {
        toast.error('Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                OnboardEase
              </h1>
              <p className="text-gray-600">
                Customer Onboarding Platform
              </p>
            </motion.div>
          </div>

          {/* Login Form */}
          <motion.form
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div>
              <Input
                label="Email"
                type="email"
                placeholder="john@wobot.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {/* Helper Text */}
            {/* <div className="text-sm text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="font-medium text-blue-900 mb-1">Demo Credentials:</p>
              <p className="text-blue-700">Email: john@wobot.ai</p>
              <p className="text-blue-700">Password: password123</p>
            </div> */}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </motion.form>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-6 text-center text-sm text-gray-500"
          >
            <p>Powered by Wobot AI</p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
