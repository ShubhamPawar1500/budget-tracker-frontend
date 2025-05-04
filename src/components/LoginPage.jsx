import { useState } from 'react';
import { Lock, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { loginProxy } from '../proxy/TransactionProxy';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async(e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Validate form
    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    let data = await loginProxy({username:email, password})

    if (data.access) {
        setSuccessMessage('Login successful! Redirecting...');
        if (onLogin) {
            onLogin(data);
            return;
        }
    }else if(data.detail){
        setError(data.detail);
    }else{
        setError('Failed to login');
    }

    setIsLoading(false);
  };

  // The authenticated view is now managed by App.js

  // Login form
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Login to Your Account</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700">
            <AlertCircle size={20} className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center text-green-700">
            <CheckCircle size={20} className="mr-2 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        
        <div className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="you@example.com"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                }}
              />
            </div>
          </div>
          
          <div>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Logging in...' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}