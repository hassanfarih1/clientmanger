'use client';
import React, { useState, useEffect } from 'react';
import { Search, Eye, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Clients() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userType, setUserType] = useState(null); // New state for user type

  const router = useRouter();

  useEffect(() => {
    // Retrieve user type from localStorage on component mount
    if (typeof window !== 'undefined') {
      const storedUserType = localStorage.getItem('user_type');
      setUserType(storedUserType);
    }
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data, error } = await supabase.from('clients').select('*');
    if (!error) {
      setClients(data);
      setFilteredClients(data);
    }
  };

  // Effect to filter clients based on search term
  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const newFilteredClients = clients.filter((client) =>
      client.full_name.toLowerCase().includes(lowercasedSearchTerm) ||
      client.phone_number.includes(lowercasedSearchTerm) ||
      client.address.toLowerCase().includes(lowercasedSearchTerm)
    );
    setFilteredClients(newFilteredClients);
  }, [searchTerm, clients]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent adding if not admin
    if (userType !== 'admin') {
      alert('You do not have permission to add clients.');
      return;
    }

    setLoading(true);
    setSuccess(false);

    const { error } = await supabase.from('clients').insert([
      {
        full_name: fullName,
        phone_number: phoneNumber,
        address: address,
      },
    ]);

    setLoading(false);
    if (error) {
      alert('Failed to add client: ' + error.message);
    } else {
      setSuccess(true);
      fetchClients();
      setTimeout(() => {
        handleClose();
      }, 1500);
    }
  };

  const handleDelete = async () => {
    // Prevent deleting if not admin
    if (userType !== 'admin') {
      alert('You do not have permission to delete clients.');
      return;
    }

    if (!selectedClientId) return;

    setLoading(true);

    // 1. Delete associated payments
    const { error: paymentsError } = await supabase
      .from('paiements')
      .delete()
      .eq('client_id', selectedClientId);

    if (paymentsError) {
      alert('Failed to delete client payments: ' + paymentsError.message);
      setLoading(false);
      return;
    }

    // 2. Delete associated purchases
    const { error: purchasesError } = await supabase
      .from('achats')
      .delete()
      .eq('client_id', selectedClientId);

    if (purchasesError) {
      alert('Failed to delete client purchases: ' + purchasesError.message);
      setLoading(false);
      return;
    }

    // 3. Delete the client
    const { error: clientError } = await supabase
      .from('clients')
      .delete()
      .eq('id', selectedClientId);

    if (clientError) {
      alert('Failed to delete client: ' + clientError.message);
    } else {
      fetchClients();
      setIsDeleteModalOpen(false);
      setSelectedClientId(null);
    }
    setLoading(false);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setFullName('');
    setPhoneNumber('');
    setAddress('');
    setSuccess(false);
  };

  return (
    <div className="px-4 mt-6 md:px-11 md:mt-12">
      <div className="bg-slate-500 p-6 rounded-md w-full md:w-[430px]">
        <h2 className="text-white text-lg font-semibold mb-4">Filtrer par client</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
            <input
              type="text"
              placeholder="Search clients"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-md bg-[#E0F7F7] text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6DDADC]"
            />
          </div>
          {userType === 'admin' && ( // Conditionally render the "Ajouter un client" button
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#3DB9B2] text-white text-sm px-5 py-2 rounded-md hover:bg-[#36a49d] transition-colors w-full sm:w-auto"
            >
              Ajouter un client
            </button>
          )}
        </div>

        {/* Client list */}
        <div className="space-y-2">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-[#E0F7F7] rounded-md px-4 py-2 flex justify-between items-center"
            >
              <span className="text-gray-800 text-lg font-medium">{client.full_name}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/${client.id}`)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Eye className="w-6 h-6" />
                </button>
                {userType === 'admin' && ( // Conditionally render the delete button
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => {
                      setSelectedClientId(client.id);
                      setIsDeleteModalOpen(true);
                    }}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {filteredClients.length === 0 && (
            <p className="text-white text-center">Aucun client trouvé.</p>
          )}
        </div>
      </div>

      {/* Add Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 px-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
            <h1 className="text-xl font-bold text-center mb-2">Ajouter un client</h1>
            <h2 className="text-md font-semibold text-center mb-4 text-gray-600">
              Ajouter les données du client
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Nom complet du client"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6DDADC]"
                required
              />
              <input
                type="number"
                placeholder="Numéro de téléphone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6DDADC]"
                required
              />
              <input
                type="text"
                placeholder="Adresse"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6DDADC]"
                required
              />
              <button
                type="submit"
                className="w-full bg-[#3DB9B2] text-white py-2 rounded-md hover:bg-[#36a49d] transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Ajout en cours...' : 'Ajouter le client'}
              </button>
              {success && (
                <p className="text-green-600 text-sm text-center">Client ajouté avec succès !</p>
              )}
            </form>
            <button
              onClick={handleClose}
              className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-lg font-bold"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm text-center">
            <h2 className="text-lg font-bold text-red-600 mb-4">Confirmer la suppression</h2>
            <p className="text-gray-700 mb-6">Êtes-vous sûr de vouloir supprimer ce client ?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-md bg-gray-300 text-gray-800 hover:bg-gray-400 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}