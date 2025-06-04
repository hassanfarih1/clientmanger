'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Utility function to format currency
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '';
  }
  // Use 'fr-FR' locale which uses comma for decimal and space for thousands.
  // Set minimumFractionDigits to 2 to ensure two decimal places.
  // Set maximumFractionDigits to 2 to limit to two decimal places.
  const formattedAmount = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2, // Ensure at least two decimal places
    maximumFractionDigits: 2, // Limit to exactly two decimal places
  }).format(amount);
  return formattedAmount;
};

export default function Hero() {
  const [totalPrixAchats, setTotalPrixAchats] = useState(0);
  const [totalPaiements, setTotalPaiements] = useState(0);
  const [leReste, setLeReste] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllTotals = async () => {
      setLoading(true);

      // Fetch all purchases to calculate total price
      const { data: allPurchases, error: purchasesError } = await supabase
        .from('achats')
        .select('prix_total');

      if (purchasesError) {
        console.error('Error fetching all purchases:', purchasesError.message);
      } else {
        const calculatedTotalPrix = allPurchases.reduce((sum, purchase) => sum + (parseFloat(purchase.prix_total) || 0), 0);
        setTotalPrixAchats(calculatedTotalPrix);
      }

      // Fetch all payments to calculate total payments
      const { data: allPayments, error: paymentsError } = await supabase
        .from('paiements')
        .select('paiement');

      if (paymentsError) {
        console.error('Error fetching all payments:', paymentsError.message);
      } else {
        const calculatedTotalPaiements = allPayments.reduce((sum, payment) => sum + (parseFloat(payment.paiement) || 0), 0);
        setTotalPaiements(calculatedTotalPaiements);
      }

      setLoading(false);
    };

    fetchAllTotals();
  }, []);

  // Calculate 'Le Reste' whenever totalPrixAchats or totalPaiements changes
  useEffect(() => {
    setLeReste(totalPrixAchats - totalPaiements);
  }, [totalPrixAchats, totalPaiements]);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100px] bg-softgray">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-[#3DB9B2] border-gray-200 mb-3"></div>
          <p className="text-[#3DB9B2] text-xs">Calcul des totaux...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 px-4 sm:px-6 lg:px-12 w-full">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Box 1: Prix Total (Total des Achats) */}
        <div className="bg-white rounded-lg shadow-lg py-8 px-6 flex flex-col items-center justify-center text-center border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-base font-semibold text-gray-700 mb-3">chiffre d'affaire</h3>
          <p className="text-3xl font-bold text-[#3DB9B2]">{formatCurrency(totalPrixAchats)} DH</p>
        </div>
        {/* Box 2: Totalité de la Paie (Total des Paiements) */}
        <div className="bg-white rounded-lg shadow-lg py-8 px-6 flex flex-col items-center justify-center text-center border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-base font-semibold text-gray-700 mb-3">les avances</h3>
          <p className="text-3xl font-bold text-[#3DB9B2]">{formatCurrency(totalPaiements)} DH</p>
        </div>
        {/* Box 3: Le Reste */}
        <div className="bg-white rounded-lg shadow-lg py-8 px-6 flex flex-col items-center justify-center text-center border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-base font-semibold text-gray-700 mb-3">Le reste</h3>
          <p className={`text-3xl font-bold ${leReste < 0 ? 'text-red-600' : 'text-[#3DB9B2]'}`}>
            {formatCurrency(leReste)} DH
          </p>
        </div>
      </section>
    </div>
  );
}