import { createContext, useEffect, useState } from 'react'
import BudgetTracker from './components/BudgetTracker'
import './App.css'
import LoginPage from './components/LoginPage';

export const AuthContext = createContext();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      // const storedUser = localStorage.getItem('user');
      
      if (token) {
        setIsAuthenticated(true);
        // setUser(JSON.parse(storedUser));
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

    // Login function to be passed to LoginPage
    const login = (userData) => {
      localStorage.setItem('authToken', userData.access);
      // localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
    };
  
    // Logout function
    const logout = () => {
      localStorage.removeItem('authToken');
      // localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    };

    const authContextValue = {
      isAuthenticated,
      user,
      login,
      logout
    };

    if (isLoading) {
      return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

  return (
    <AuthContext.Provider value={authContextValue}>
      {isAuthenticated ? <BudgetTracker /> : <LoginPage onLogin={login} />}
    </AuthContext.Provider> 
  )
}

export default App
