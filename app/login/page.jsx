// pages/login.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!username) {
      setError('Please enter a username.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('username, name, type')
        .eq('username', username)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('User not found. Please check your username.');
        } else {
          setError(`Login failed: ${error.message}`);
        }
        return;
      }

      if (data) {
        localStorage.setItem('user_username', data.username);
        localStorage.setItem('user_name', data.name);
        localStorage.setItem('user_type', data.type); // Store the user's role

        console.log('Login successful:', data);
        router.push('/');
      }
    } catch (err) {
      console.error('Unexpected error during login:', err);
      setError('An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-softgray">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm border border-gray-200">
        <h1 className="text-3xl font-bold text-center mb-6 text-[#045757]">Connexion</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3DB9B2] transition-colors"
              placeholder="Entrez votre nom d'utilisateur"
            />
          </div>
          {error && (
            <p className="text-red-500 text-center text-sm -mt-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`w-full px-4 py-2 rounded-md font-semibold transition-colors
              ${loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#3DB9B2] text-white hover:bg-[#298b89]'
              }`}
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}