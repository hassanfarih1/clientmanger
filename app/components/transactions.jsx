'use client'
import React, { useState, useRef, useEffect } from "react";
import { supabase } from '@/lib/supabaseClient'; // Import your Supabase client

// Utility function to format currency (re-used from ClientDetailPage)
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '';
  }
  const formattedAmount = new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return formattedAmount;
};

// Utility function to format date from YYYY-MM-DD to DD / MM / YYYY
const formatDisplayDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day} / ${month} / ${year}`;
};

const ITEMS_PER_PAGE = 78; // Define how many items per page

export default function Transactions() {
  const [choice, setChoice] = useState("paie");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [payments, setPayments] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination states for payments
  const [currentPagePayments, setCurrentPagePayments] = useState(1);
  const [totalPaymentsCount, setTotalPaymentsCount] = useState(0);

  // Pagination states for purchases
  const [currentPagePurchases, setCurrentPagePurchases] = useState(1);
  const [totalPurchasesCount, setTotalPurchasesCount] = useState(0);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);

      // --- Fetch payments with pagination and server-side sorting ---
      const paymentsOffset = (currentPagePayments - 1) * ITEMS_PER_PAGE;
      const { data: paymentsData, error: paymentsError, count: paymentsCount } = await supabase
        .from('paiements')
        .select('*, clients!inner(full_name)', { count: 'exact' })
        .order('date_paiement', { ascending: false, nullsFirst: false }) // KEY CHANGE FOR PAYMENTS
        .range(paymentsOffset, paymentsOffset + ITEMS_PER_PAGE - 1);

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError.message);
      } else {
        // No need for client-side sorting here, Supabase handled it
        setPayments(paymentsData);
        setTotalPaymentsCount(paymentsCount);
      }

      // --- Fetch purchases with pagination and server-side sorting ---
      const purchasesOffset = (currentPagePurchases - 1) * ITEMS_PER_PAGE;
      const { data: purchasesData, error: purchasesError, count: purchasesCount } = await supabase
        .from('achats')
        .select('*, clients!inner(full_name)', { count: 'exact' })
        .order('date_achat', { ascending: false, nullsFirst: false }) // KEY CHANGE FOR PURCHASES
        .range(purchasesOffset, purchasesOffset + ITEMS_PER_PAGE - 1);

      if (purchasesError) {
        console.error('Error fetching purchases:', purchasesError.message);
      } else {
        // No need for client-side sorting here, Supabase handled it
        setPurchases(purchasesData);
        setTotalPurchasesCount(purchasesCount);
      }

      setLoading(false);
    };

    fetchTransactions();
  }, [currentPagePayments, currentPagePurchases]); // Re-fetch when page changes

  const totalPagesPayments = Math.ceil(totalPaymentsCount / ITEMS_PER_PAGE);
  const totalPagesPurchases = Math.ceil(totalPurchasesCount / ITEMS_PER_PAGE);

  const handlePageChangePayments = (page) => {
    if (page >= 1 && page <= totalPagesPayments) {
      setCurrentPagePayments(page);
    }
  };

  const handlePageChangePurchases = (page) => {
    if (page >= 1 && page <= totalPagesPurchases) {
      setCurrentPagePurchases(page);
    }
  };

  const renderPaginationControls = (currentPage, totalPages, handlePageChange) => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPageNumbersToShow = 5; // e.g., show 5 page numbers (current, 2 before, 2 after)

    let startPage = Math.max(1, currentPage - Math.floor(maxPageNumbersToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPageNumbersToShow - 1);

    if (endPage - startPage + 1 < maxPageNumbersToShow) {
        startPage = Math.max(1, endPage - maxPageNumbersToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center items-center mt-4 space-x-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="bg-[#3DB9B2] text-white px-3 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#36a49d] transition-colors text-sm"
        >
          Précédent
        </button>
        {startPage > 1 && (
            <>
                <button
                    onClick={() => handlePageChange(1)}
                    className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300 transition-colors text-sm"
                >
                    1
                </button>
                {startPage > 2 && <span className="text-gray-700">...</span>}
            </>
        )}
        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => handlePageChange(number)}
            className={`px-3 py-1 rounded-md text-sm ${
              currentPage === number
                ? 'bg-[#3DB9B2] text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {number}
          </button>
        ))}
        {endPage < totalPages && (
            <>
                {endPage < totalPages - 1 && <span className="text-gray-700">...</span>}
                <button
                    onClick={() => handlePageChange(totalPages)}
                    className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300 transition-colors text-sm"
                >
                    {totalPages}
                </button>
            </>
        )}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="bg-[#3DB9B2] text-white px-3 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#36a49d] transition-colors text-sm"
        >
          Suivant
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-softgray">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-[#3DB9B2] border-gray-200 mb-3"></div>
          <p className="text-[#3DB9B2] text-xs">Chargement des transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 px-4 sm:px-6 lg:px-12 w-full">
      <div className="bg-slate-500 p-6 rounded-md w-full">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
          <h2 className="text-white text-lg font-semibold">
            Historique des transactions
          </h2>

          <div className="relative w-max" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="bg-[#3DB9B2] text-white px-4 py-2 rounded-md hover:bg-[#36a49d] transition-colors font-semibold"
            >
              {choice === "paie" ? "La Paie" : "L'achat"} ▼
            </button>

            {dropdownOpen && (
              <ul className="absolute right-0 mt-2 w-36 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <li
                  className="px-4 py-2 cursor-pointer hover:bg-[#E0F7F7]"
                  onClick={() => {
                    setChoice("paie");
                    setDropdownOpen(false);
                    setCurrentPagePayments(1); // Reset page when changing tab
                  }}
                >
                  La Paie
                </li>
                <li
                  className="px-4 py-2 cursor-pointer hover:bg-[#E0F7F7]"
                  onClick={() => {
                    setChoice("achat");
                    setDropdownOpen(false);
                    setCurrentPagePurchases(1); // Reset page when changing tab
                  }}
                >
                  L'achat
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto rounded-md">
          {choice === "paie" ? (
            <>
              <table className="w-full text-xs sm:text-sm text-left border-collapse bg-[#E0F7F7]">
                <thead className="text-gray-700">
                  <tr>
                    <th className="px-2 py-1 sm:px-4 sm:py-2 border border-gray-300">Date de paiement</th>
                    <th className="px-2 py-1 sm:px-4 sm:py-2 border border-gray-300">Client</th>
                    <th className="px-2 py-1 sm:px-4 sm:py-2 border border-gray-300">Type de paiement</th>
                    <th className="px-2 py-1 sm:px-4 sm:py-2 border border-gray-300">Paiement</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-2 py-4 text-center text-gray-500 border border-gray-300">Aucun paiement trouvé.</td>
                    </tr>
                  ) : (
                    payments.map((payment, idx) => (
                      <tr key={payment.id} className={idx % 2 === 0 ? 'bg-white text-gray-800' : 'bg-gray-50 text-gray-800'}>
                        <td className="px-2 py-1 sm:px-4 sm:py-2 border border-gray-300">{formatDisplayDate(payment.date_paiement)}</td>
                        <td className="px-2 py-1 sm:px-4 sm:py-2 border border-gray-300">{payment.clients.full_name}</td>
                        <td className="px-2 py-1 sm:px-4 sm:py-2 border border-gray-300">{payment.type_paiement}</td>
                        <td className="px-2 py-1 sm:px-4 sm:py-2 border border-gray-300">{formatCurrency(payment.paiement)} DH</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {renderPaginationControls(currentPagePayments, totalPagesPayments, handlePageChangePayments)}
            </>
          ) : (
            <>
              <table className="w-full text-xs sm:text-sm text-left border-collapse bg-[#E0F7F7]">
                <thead className="text-gray-700">
                  <tr>
                    <th className="px-2 py-1 sm:px-4 sm:py-2 border border-gray-300">Date d'achat</th>
                    <th className="px-2 py-1 sm:px-4 sm:py-2 border border-gray-300">Client</th>
                    <th className="px-2 py-1 sm:px-4 sm:py-2 border border-gray-300">Quantité</th>
                    <th className="px-2 py-1 sm:px-4 sm:py-2 border border-gray-300">Type</th>
                    <th className="px-2 py-1 sm:px-4 sm:py-2 border border-gray-300">Classe</th>
                    <th className="px-2 py-1 sm:px-4 sm:py-2 border border-gray-300">Poids</th>
                    <th className="px-2 py-1 sm:px-4 sm:py-2 border border-gray-300">Prix total</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-2 py-4 text-center text-gray-500 border border-gray-300">Aucun achat trouvé.</td>
                    </tr>
                  ) : (
                    purchases.map((purchase, idx) => (
                      <tr key={purchase.id} className={idx % 2 === 0 ? 'bg-white text-gray-800' : 'bg-gray-50 text-gray-800'}>
                        <td className="px-2 py-1 sm:px-4 sm:py-2 border border-gray-300">{formatDisplayDate(purchase.date_achat)}</td>
                        <td className="px-2 py-1 sm:px-4 sm:py-2 border border-gray-300">{purchase.clients.full_name}</td>
                        <td className="px-2 py-1 sm:px-4 sm:py-2 border border-gray-300">{purchase.quantite}</td>
                        <td className="px-2 py-1 sm:px-4 sm:py-2 border border-gray-300">{purchase.type}</td>
                        <td className="px-2 py-1 sm:px-4 sm:py-2 border border-gray-300">{purchase.classe}</td>
                        <td className="px-2 py-1 sm:px-4 sm:py-2 border border-gray-300">{purchase.poids} kg</td>
                        <td className="px-2 py-1 sm:px-4 sm:py-2 border border-gray-300">{formatCurrency(purchase.prix_total)} DH</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {renderPaginationControls(currentPagePurchases, totalPagesPurchases, handlePageChangePurchases)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}