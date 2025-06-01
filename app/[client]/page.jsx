'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Navbar from '../components/navbar';
import { Pen, Trash2, Plus } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Utility function to format currency
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '';
  }
  // Use 'fr-FR' locale which uses comma for decimal and space for thousands.
  // Set minimumFractionDigits to 0 to avoid forcing trailing zeros (e.g., 3,8 instead of 3,80).
  // Set maximumFractionDigits to a high number to preserve existing decimal precision.
  const formattedAmount = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 20, // Allows up to 20 decimal places if they exist, without forcing them.
  }).format(amount);
  return formattedAmount;
};

// Utility function to format date from YYYY-MM-DD to DD/MM/YYYY
// Now accepts an isUnknown flag
const formatDisplayDate = (dateString, isUnknown = false) => {
  if (isUnknown || !dateString) return 'Inconnue';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`; // Changed to remove spaces around slashes
};

export default function ClientDetailPage() {
  const { client } = useParams();
  const [clientData, setClientData] = useState(null);
  const [isClientEditOpen, setIsClientEditOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  // State for Add Payment Modal
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState('');
  const [isPaymentDateUnknown, setIsPaymentDateUnknown] = useState(false);
  const [paymentType, setPaymentType] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [payments, setPayments] = useState([]);

  // State for Edit Payment Modal
  const [isEditPaymentOpen, setIsEditPaymentOpen] = useState(false);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [editPaymentDate, setEditPaymentDate] = useState('');
  const [editIsPaymentDateUnknown, setEditIsPaymentDateUnknown] = useState(false);
  const [editPaymentType, setEditPaymentType] = useState('');
  const [editPaymentAmount, setEditPaymentAmount] = useState('');
  const [editPaymentLoading, setEditPaymentLoading] = useState(false);

  // State for Delete Payment Confirmation Modal
  const [isConfirmDeletePaymentOpen, setIsConfirmDeletePaymentOpen] = useState(false);
  const [paymentToDeleteId, setPaymentToDeleteId] = useState(null);

  // State for Add Purchase Modal
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState('');
  const [isPurchaseDateUnknown, setIsPurchaseDateUnknown] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState('');
  const [purchaseType, setPurchaseType] = useState('');
  const [purchaseClass, setPurchaseClass] = useState('');
  const [purchaseWeight, setPurchaseWeight] = useState('');
  const [purchaseUnitPrice, setPurchaseUnitPrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchases, setPurchases] = useState([]);

  // State for Edit Purchase Modal
  const [isEditPurchaseOpen, setIsEditPurchaseOpen] = useState(false);
  const [currentPurchase, setCurrentPurchase] = useState(null);
  const [editPurchaseDate, setEditPurchaseDate] = useState('');
  const [editIsPurchaseDateUnknown, setEditIsPurchaseDateUnknown] = useState(false);
  const [editPurchaseQuantity, setEditPurchaseQuantity] = useState('');
  const [editPurchaseType, setEditPurchaseType] = useState('');
  const [editPurchaseClass, setEditPurchaseClass] = useState('');
  const [editPurchaseWeight, setEditPurchaseWeight] = useState('');
  const [editPurchaseUnitPrice, setEditPurchaseUnitPrice] = useState('');
  const [editPurchasePrice, setEditPurchasePrice] = useState('');
  const [editPurchaseLoading, setEditPurchaseLoading] = useState(false);

  // State for Delete Purchase Confirmation Modal
  const [isConfirmDeletePurchaseOpen, setIsConfirmDeletePurchaseOpen] = useState(false);
  const [purchaseToDeleteId, setPurchaseToDeleteId] = useState(null);

  // STATES FOR TYPES AND CLASSES
  const [types, setTypes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isAddTypeModalOpen, setIsAddTypeModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [isAddClasseModalOpen, setIsAddClasseModalOpen] = useState(false);
  const [newClasseName, setNewClasseName] = useState('');
  const [isAddingType, setIsAddingType] = useState(false);
  const [isAddingClasse, setIsAddingClasse] = useState(false);

  // Hardcoded payment types
  const paymentTypes = ['cash', 'cheque', 'virement', 'versement', 'traite', 'inconnue'];

  // Ref for the content to be printed (now used by html2canvas)
  const reportContentRef = useRef(null);


  useEffect(() => {
    const fetchClientAndRelatedData = async () => {
      setLoading(true);
      const { data: clientDetails, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', client)
        .single();

      if (!clientError) {
        setClientData(clientDetails);
      } else {
        console.error('Erreur lors de la récupération du client :', clientError.message);
      }

      const { data: clientPayments, error: paymentsError } = await supabase
        .from('paiements')
        .select('*')
        .eq('client_id', client)
        .order('date_paiement', { ascending: false });

      if (!paymentsError) {
        setPayments(clientPayments);
      } else {
        console.error('Erreur lors de la récupération des paiements :', paymentsError.message);
      }

      const { data: clientPurchases, error: purchasesError } = await supabase
        .from('achats')
        .select('*')
        .eq('client_id', client)
        .order('date_achat', { ascending: false });

      if (!purchasesError) {
        setPurchases(clientPurchases);
      } else {
        console.error('Erreur lors de la récupération des achats :', purchasesError.message);
      }

      setLoading(false);
    };

    if (client) fetchClientAndRelatedData();
  }, [client]);

  // useEffect to fetch types and classes
  useEffect(() => {
    const fetchTypesAndClasses = async () => {
      const { data: typesData, error: typesError } = await supabase
        .from('type')
        .select('id, type_name')
        .order('type_name', { ascending: true });

      if (!typesError) {
        setTypes(typesData.map(t => ({ ...t, type_name: t.type_name?.toLowerCase() })));
      } else {
        console.error('Error fetching types:', typesError.message);
      }

      const { data: classesData, error: classesError } = await supabase
        .from('classe')
        .select('id, classe_name')
        .order('classe_name', { ascending: true });

      if (!classesError) {
        setClasses(classesData.map(c => ({ ...c, classe_name: c.classe_name?.toLowerCase() })));
      } else {
        console.error('Error fetching classes:', classesError.message);
      }
    };

    fetchTypesAndClasses();
  }, []);

  // useEffect for automatic purchase price calculation (Add Modal)
  useEffect(() => {
    const unitPrice = parseFloat(purchaseUnitPrice);
    const weight = parseFloat(purchaseWeight);
    if (!isNaN(unitPrice) && !isNaN(weight)) {
      setPurchasePrice((unitPrice * weight)); // Removed .toFixed(2) to match new formatCurrency
    } else {
      // Keep existing price if user has manually entered it, otherwise clear if inputs are invalid
      // This is a basic way to "prioritize" manual input.
      // A more robust solution would involve a separate state for "isManualPrice"
      if (purchasePrice === '') { // Only auto-clear if it's currently empty (not manually set)
        setPurchasePrice('');
      }
    }
  }, [purchaseUnitPrice, purchaseWeight]);

  // useEffect for automatic purchase price calculation (Edit Modal)
  useEffect(() => {
    const unitPrice = parseFloat(editPurchaseUnitPrice);
    const weight = parseFloat(editPurchaseWeight);
    if (!isNaN(unitPrice) && !isNaN(weight)) {
      setEditPurchasePrice((unitPrice * weight)); // Removed .toFixed(2)
    } else {
      // Keep existing price if user has manually entered it, otherwise clear if inputs are invalid
      if (editPurchasePrice === '') { // Only auto-clear if it's currently empty (not manually set)
        setEditPurchasePrice('');
      }
    }
  }, [editPurchaseUnitPrice, editPurchaseWeight]);


  // Client Edit
  const openClientEditModal = () => {
    setFullName(clientData.full_name || '');
    setPhoneNumber(clientData.phone_number || '');
    setAddress(clientData.address || '');
    setIsClientEditOpen(true);
  };

  const handleClientUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('clients')
      .update({
        full_name: fullName,
        phone_number: phoneNumber,
        address: address,
      })
      .eq('id', client);

    setLoading(false);
    if (error) {
      alert('Erreur lors de la mise à jour : ' + error.message);
    } else {
      setClientData({ ...clientData, full_name: fullName, phone_number: phoneNumber, address });
      setIsClientEditOpen(false);
    }
  };

  // Add Payment
  const handleAddPayment = async (e) => {
    e.preventDefault();
    setPaymentLoading(true);

    const { data, error } = await supabase
      .from('paiements')
      .insert([
        {
          client_id: client,
          date_paiement: isPaymentDateUnknown ? null : paymentDate,
          type_paiement: paymentType,
          paiement: parseFloat(paymentAmount), // Ensure it's a number
        },
      ])
      .select();

    setPaymentLoading(false);
    if (error) {
      alert('Erreur lors de l\'ajout du paiement : ' + error.message);
    } else {
      setPayments([data[0], ...payments]);
      setIsAddPaymentOpen(false);
      setPaymentDate('');
      setPaymentType('');
      setPaymentAmount('');
      setIsPaymentDateUnknown(false);
    }
  };

  // Edit Payment
  const openEditPaymentModal = (payment) => {
    setCurrentPayment(payment);
    setEditPaymentDate(payment.date_paiement || '');
    setEditIsPaymentDateUnknown(payment.date_paiement === null);
    setEditPaymentType(payment.type_paiement);
    setEditPaymentAmount(payment.paiement);
    setIsEditPaymentOpen(true);
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    setEditPaymentLoading(true);

    const { data, error } = await supabase
      .from('paiements')
      .update({
        date_paiement: editIsPaymentDateUnknown ? null : editPaymentDate,
        type_paiement: editPaymentType,
        paiement: parseFloat(editPaymentAmount), // Ensure it's a number
      })
      .eq('id', currentPayment.id)
      .select();

    setEditPaymentLoading(false);
    if (error) {
      alert('Erreur lors de la mise à jour du paiement : ' + error.message);
    } else {
      setPayments(payments.map(p => p.id === currentPayment.id ? data[0] : p));
      setIsEditPaymentOpen(false);
      setCurrentPayment(null);
      setEditIsPaymentDateUnknown(false);
    }
  };

  // Delete Payment
  const openConfirmDeletePaymentModal = (id) => {
    setPaymentToDeleteId(id);
    setIsConfirmDeletePaymentOpen(true);
  };

  const handleDeletePaymentConfirmed = async () => {
    setPaymentLoading(true);
    const { error } = await supabase
      .from('paiements')
      .delete()
      .eq('id', paymentToDeleteId);

    setPaymentLoading(false);
    if (error) {
      alert('Erreur lors de la suppression du paiement : ' + error.message);
    } else {
      setPayments(payments.filter(payment => payment.id !== paymentToDeleteId));
      setIsConfirmDeletePaymentOpen(false);
      setPaymentToDeleteId(null);
    }
  };

  // Add Purchase
  const handleAddPurchase = async (e) => {
    e.preventDefault();
    setPurchaseLoading(true);

    const { data, error } = await supabase
      .from('achats')
      .insert([
        {
          client_id: client,
          date_achat: isPurchaseDateUnknown ? null : purchaseDate,
          quantite: parseFloat(purchaseQuantity),
          type: purchaseType,
          classe: purchaseClass,
          poids: parseFloat(purchaseWeight),
          prix_unitaire: parseFloat(purchaseUnitPrice),
          prix_total: parseFloat(purchasePrice),
        },
      ])
      .select();

    setPurchaseLoading(false);
    if (error) {
      alert('Erreur lors de l\'ajout de l\'achat : ' + error.message);
    } else {
      setPurchases([data[0], ...purchases]);
      setIsAddPurchaseOpen(false);
      setPurchaseDate('');
      setPurchaseQuantity('');
      setPurchaseType('');
      setPurchaseClass('');
      setPurchaseWeight('');
      setPurchaseUnitPrice('');
      setPurchasePrice('');
      setIsPurchaseDateUnknown(false);
    }
  };

  // Edit Purchase
  const openEditPurchaseModal = (purchase) => {
    setCurrentPurchase(purchase);
    setEditPurchaseDate(purchase.date_achat || '');
    setEditIsPurchaseDateUnknown(purchase.date_achat === null);
    setEditPurchaseQuantity(purchase.quantite);
    setEditPurchaseType(purchase.type?.toLowerCase() || '');
    setEditPurchaseClass(purchase.classe?.toLowerCase() || '');
    setEditPurchaseWeight(purchase.poids);
    setEditPurchaseUnitPrice(purchase.prix_unitaire || '');
    setEditPurchasePrice(purchase.prix_total || '');
    setIsEditPurchaseOpen(true);
  };

  const handleUpdatePurchase = async (e) => {
    e.preventDefault();
    setEditPurchaseLoading(true);

    const { data, error } = await supabase
      .from('achats')
      .update({
        date_achat: editIsPurchaseDateUnknown ? null : editPurchaseDate,
        quantite: parseFloat(editPurchaseQuantity),
        type: editPurchaseType,
        classe: editPurchaseClass,
        poids: parseFloat(editPurchaseWeight),
        prix_unitaire: parseFloat(editPurchaseUnitPrice),
        prix_total: parseFloat(editPurchasePrice),
      })
      .eq('id', currentPurchase.id)
      .select();

    setEditPurchaseLoading(false);
    if (error) {
      alert('Erreur lors de la mise à jour de l\'achat : ' + error.message);
    } else {
      setPurchases(purchases.map(p => p.id === currentPurchase.id ? data[0] : p));
      setIsEditPurchaseOpen(false);
      setCurrentPurchase(null);
      setEditIsPurchaseDateUnknown(false);
    }
  };

  // Delete Purchase
  const openConfirmDeletePurchaseModal = (id) => {
    setPurchaseToDeleteId(id);
    setIsConfirmDeletePurchaseOpen(true);
  };

  const handleDeletePurchaseConfirmed = async () => {
    setPurchaseLoading(true);
    const { error } = await supabase
      .from('achats')
      .delete()
      .eq('id', purchaseToDeleteId);

    setPurchaseLoading(false);
    if (error) {
      alert('Erreur lors de la suppression de l\'achat : ' + error.message);
    } else {
      setPurchases(purchases.filter(purchase => purchase.id !== purchaseToDeleteId));
      setIsConfirmDeletePurchaseOpen(false);
      setPurchaseToDeleteId(null);
    }
  };

  // Handle Add New Type
  const handleAddNewType = async (e) => {
    e.preventDefault();
    setIsAddingType(true);
    const typeNameToInsert = newTypeName.toLowerCase();
    const { data, error } = await supabase
      .from('type')
      .insert([{ type_name: typeNameToInsert }])
      .select();

    setIsAddingType(false);
    if (error) {
      alert('Erreur lors de l\'ajout du type : ' + error.message);
    } else {
      setTypes([...types, data[0]]);
      setNewTypeName('');
      setIsAddTypeModalOpen(false);
      setPurchaseType(data[0].type_name);
      setEditPurchaseType(data[0].type_name);
    }
  };

  // Handle Add New Classe
  const handleAddNewClasse = async (e) => {
    e.preventDefault();
    setIsAddingClasse(true);
    const classeNameToInsert = newClasseName.toLowerCase();
    const { data, error } = await supabase
      .from('classe')
      .insert([{ classe_name: classeNameToInsert }])
      .select();

    setIsAddingClasse(false);
    if (error) {
      alert('Erreur lors de l\'ajout de la classe : ' + error.message);
    } else {
      setClasses([...classes, data[0]]);
      setNewClasseName('');
      setIsAddClasseModalOpen(false);
      setPurchaseClass(data[0].classe_name);
      setEditPurchaseClass(data[0].classe_name);
    }
  };

  // Function to generate the PDF report using html2canvas and jsPDF
  const generateClientReportPDF = async () => {
    const input = reportContentRef.current;
    if (!input) {
      console.error("Report content ref is not available.");
      return;
    }

    // Generate canvas from the report content
    const canvas = await html2canvas(input, {
      scale: 2, // Increase scale for better resolution
      useCORS: true, // Needed if you have images from external sources
      logging: true, // Enable logging for debugging
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for millimeters, 'a4' for A4 size
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = canvas.height * imgWidth / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add the first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add more pages if content overflows
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${clientData.full_name.replace(/\s+/g, '_')}_rapport.pdf`);
  };


  if (loading || !clientData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-softgray">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-[#3DB9B2] border-gray-200 mb-3"></div>
          <p className="text-[#3DB9B2] text-xs">Chargement des données...</p>
        </div>
      </div>
    );
  }

  // Calculate totals for the new containers
  const totalPaiement = payments.reduce((sum, p) => sum + (parseFloat(p.paiement) || 0), 0);
  const totalPrix = purchases.reduce((sum, a) => sum + (parseFloat(a.prix_total) || 0), 0);
  const leReste = totalPrix - totalPaiement;

  return (
    <div>
      <Navbar />
      <main className="mx-10 mt-10 px-6 py-5 bg-[#d9f1f1] rounded-lg">
        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3 border-b border-gray-300 pb-3 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-[#045757] tracking-wide max-w-full">
              {clientData.full_name}
            </h1>
            <button
              onClick={openClientEditModal}
              aria-label="Modifier le client"
              className="text-[#3DB9B2] hover:text-[#298b89] transition"
            >
              <Pen size={24} />
            </button>
          </div>
          {/* Imprimer le rapport button */}
          <button
            onClick={generateClientReportPDF}
            className="bg-[#045757] text-white text-sm px-4 py-2 rounded-md hover:bg-[#034444] transition-colors mt-4 sm:mt-0"
          >
            Imprimer le rapport
          </button>
        </div>

        <section className="flex flex-col gap-2 max-w-full">
          <div className="flex flex-col sm:flex-row sm:justify-start sm:items-center bg-[#f5f7f7] rounded-lg border border-gray-300 px-4 py-3">
            <p className="text-sm font-semibold text-[#3a5858] w-32 min-w-[8rem]">Téléphone</p>
            <p className="text-gray-600 text-sm">{clientData.phone_number || 'N/A'}</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-start sm:items-center bg-[#f5f7f7] rounded-lg border border-gray-300 px-4 py-3">
            <p className="text-sm font-semibold text-[#3a5858] w-32 min-w-[8rem]">Adresse</p>
            <p className="text-gray-600 text-sm">{clientData.address || 'N/A'}</p>
          </div>
        </section>

        {/* Section for calculation summary */}
        <section className="flex flex-row justify-around items-center gap-2 sm:gap-4 mt-10 mb-10 overflow-x-auto px-2">
          {/* Box 1: Prix Total */}
          <div className="bg-[#f5f7f7] rounded-lg shadow-md p-2 sm:p-4 flex-1 text-center border border-gray-300 min-w-0 sm:min-w-[180px] md:min-w-[200px]">
            <h3 className="text-sm sm:text-lg font-semibold text-[#045757] whitespace-nowrap">Prix Total</h3>
            <p className="text-xl sm:text-2xl font-bold text-[#3DB9B2] mt-1 sm:mt-2 whitespace-nowrap">{formatCurrency(totalPrix)} DH</p>
          </div>
          {/* Box 2: Totalité de la Paie */}
          <div className="bg-[#f5f7f7] rounded-lg shadow-md p-2 sm:p-4 flex-1 text-center border border-gray-300 min-w-0 sm:min-w-[180px] md:min-w-[200px]">
            <h3 className="text-sm sm:text-lg font-semibold text-[#045757] whitespace-nowrap">Totalité de la Paie</h3>
            <p className="text-xl sm:text-2xl font-bold text-[#3DB9B2] mt-1 sm:mt-2 whitespace-nowrap">{formatCurrency(totalPaiement)} DH</p>
          </div>
          {/* Box 3: Le Reste */}
          <div className="bg-[#f5f7f7] rounded-lg shadow-md p-2 sm:p-4 flex-1 text-center border border-gray-300 min-w-0 sm:min-w-[180px] md:min-w-[200px]">
            <h3 className="text-sm sm:text-lg font-semibold text-[#045757] whitespace-nowrap">Le Reste</h3>
            <p className={`text-xl sm:text-2xl font-bold mt-1 sm:mt-2 whitespace-nowrap ${leReste < 0 ? 'text-red-500' : 'text-[#3DB9B2]'}`}>
              {formatCurrency(leReste)} DH
            </p>
          </div>
        </section>

        <section className="flex flex-col md:flex-row gap-6 mt-10">
          {/* Left Table: Payment Data */}
          <div className="flex-1 overflow-x-auto bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#045757]">Paiements</h2>
              <button
                onClick={() => setIsAddPaymentOpen(true)}
                className="bg-[#3DB9B2] text-white text-sm px-4 py-2 rounded-md hover:bg-[#36a49d] transition-colors"
              >
                Ajouter un paiement
              </button>
            </div>
            <table className="w-full border-collapse text-xs sm:text-sm md:text-base">
              <thead>
                <tr className="bg-[#3DB9B2] text-white text-xs sm:text-sm">
                  <th className="border px-2 py-1 text-left">Date de paiement</th><th className="border px-2 py-1 text-left">Type de paiement</th><th className="border px-2 py-1 text-left">Paiement</th><th className="border px-2 py-1 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>{
                payments.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="border px-2 py-4 text-center text-gray-500">Aucun paiement trouvé.</td>
                  </tr>
                ) : (
                  payments.map((row, idx) => (
                    <tr key={row.id} className={idx % 2 === 0 ? 'bg-gray-100' : ''}>
                      {/* Added whitespace-nowrap */}
                      <td className="border px-2 py-1 whitespace-nowrap">{formatDisplayDate(row.date_paiement, row.date_paiement === null)}</td>
                      <td className="border px-2 py-1">{row.type_paiement}</td>
                      <td className="border px-2 py-1">{formatCurrency(row.paiement)}</td>
                      <td className="border px-2 py-1 flex gap-2">
                        <button onClick={() => openEditPaymentModal(row)} aria-label={`Modifier le paiement ${row.id}`} className="text-[#3DB9B2] hover:text-[#298b89] transition"><Pen size={16} /></button>
                        <button onClick={() => openConfirmDeletePaymentModal(row.id)} aria-label={`Supprimer le paiement ${row.id}`} className="text-red-500 pl-2 hover:text-red-700 transition"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))
                )
              }</tbody>
            </table>
          </div>

          {/* Right Table: Purchase Data */}
          <div className="flex-1 overflow-x-auto bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#045757]">Achats</h2>
              <button
                onClick={() => setIsAddPurchaseOpen(true)}
                className="bg-[#3DB9B2] text-white text-sm px-4 py-2 rounded-md hover:bg-[#36a49d] transition-colors"
              >
                Ajouter un achat
              </button>
            </div>
            <table className="w-full border-collapse text-xs sm:text-sm md:text-base">
              <thead>
                <tr className="bg-[#3DB9B2] text-white text-xs sm:text-sm">
                  <th className="border px-2 py-1 text-left">
                    <span className="hidden sm:inline">Date d'achat</span>
                    <span className="inline sm:hidden">Date</span>
                  </th>
                  <th className="border px-2 py-1 text-left">
                    <span className="hidden sm:inline">Quantité</span>
                    <span className="inline sm:hidden">Qté</span>
                  </th>
                  <th className="border px-2 py-1 text-left">Type</th>
                  <th className="border px-2 py-1 text-left">Classe</th>
                  <th className="border px-2 py-1 text-left">Poids</th>
                  <th className="border px-2 py-1 text-left">
                    <span className="hidden sm:inline">Prix unitaire</span>
                    <span className="inline sm:hidden">P.Unit.</span>
                  </th>
                  <th className="border px-2 py-1 text-left">Prix</th>
                  <th className="border px-2 py-1 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>{
                purchases.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="border px-2 py-4 text-center text-gray-500">Aucun achat trouvé.</td>
                  </tr>
                ) : (
                  purchases.map((row, idx) => (
                    <tr key={row.id} className={idx % 2 === 0 ? 'bg-gray-100' : ''}>
                      {/* Added whitespace-nowrap */}
                      <td className="border px-2 py-1 whitespace-nowrap">{formatDisplayDate(row.date_achat, row.date_achat === null)}</td>
                      <td className="border px-2 py-1">{row.quantite}</td>
                      <td className="border px-2 py-1">{row.type?.toLowerCase()}</td>
                      <td className="border px-2 py-1">{row.classe?.toLowerCase()}</td>
                      <td className="border px-2 py-1">{row.poids}</td>
                      <td className="border px-2 py-1">{formatCurrency(row.prix_unitaire)}</td>
                      <td className="border px-2 py-1">{formatCurrency(row.prix_total)}</td>
                      <td className="border px-2 py-1 flex gap-2">
                        <button onClick={() => openEditPurchaseModal(row)} aria-label={`Modifier l'achat ${row.id}`} className="text-[#3DB9B2] hover:text-[#298b89] transition"><Pen size={16} /></button>
                        <button onClick={() => openConfirmDeletePurchaseModal(row.id)} aria-label={`Supprimer l'achat ${row.id}`} className="text-red-500 pl-2 hover:text-red-700 transition"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))
                )
              }</tbody>
            </table>
          </div>
        </section>

        {/* Client Edit Modal */}
        {isClientEditOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsClientEditOpen(false)}
          >
            <form
              onSubmit={handleClientUpdate}
              className="bg-white p-6 rounded-md w-80"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl mb-4 font-semibold text-[#045757]">Modifier le client</h2>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Nom complet
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3DB9B2]"
                />
              </label>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Téléphone
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3DB9B2]"
                />
              </label>
              <label className="block mb-4 text-sm font-medium text-gray-700">
                Adresse
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3DB9B2]"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClientEditOpen(false)}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#3DB9B2] text-white rounded hover:bg-[#298b89] disabled:opacity-50"
                >
                  {loading ? 'Mise à jour...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Payment Modal */}
        {isAddPaymentOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsAddPaymentOpen(false)}
          >
            <form
              onSubmit={handleAddPayment}
              className="bg-white p-6 rounded-md w-80"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl mb-4 font-semibold text-[#045757]">Ajouter un paiement</h2>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Date de paiement
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => {
                    setPaymentDate(e.target.value);
                    setIsPaymentDateUnknown(false);
                  }}
                  required={!isPaymentDateUnknown}
                  disabled={isPaymentDateUnknown}
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3DB9B2]"
                />
                <div className="mt-2 flex items-center">
                  <input
                    type="checkbox"
                    id="paymentDateUnknown"
                    checked={isPaymentDateUnknown}
                    onChange={(e) => {
                      setIsPaymentDateUnknown(e.target.checked);
                      if (e.target.checked) {
                        setPaymentDate('');
                      }
                    }}
                    className="mr-2"
                  />
                  <label htmlFor="paymentDateUnknown" className="text-sm text-gray-700">Date inconnue</label>
                </div>
              </label>
              {/* Type de paiement DROPDOWN */}
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Type de paiement
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  required
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3DB9B2]"
                >
                  <option value="">Sélectionnez un type</option>
                  {paymentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block mb-4 text-sm font-medium text-gray-700">
                Paiement
                <input
                  type="text" // Changed to text to allow comma input
                  value={paymentAmount}
                  onChange={(e) => {
                    const value = e.target.value.replace(',', '.'); // Replace comma with dot
                    setPaymentAmount(value);
                  }}
                  required
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3DB9B2]"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPaymentOpen(false)}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={paymentLoading}
                  className="px-4 py-2 bg-[#3DB9B2] text-white rounded hover:bg-[#298b89] disabled:opacity-50"
                >
                  {paymentLoading ? 'Ajout en cours...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Payment Modal */}
        {isEditPaymentOpen && currentPayment && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsEditPaymentOpen(false)}
          >
            <form
              onSubmit={handleUpdatePayment}
              className="bg-white p-6 rounded-md w-80"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl mb-4 font-semibold text-[#045757]">Modifier le paiement</h2>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Date de paiement
                <input
                  type="date"
                  value={editPaymentDate}
                  onChange={(e) => {
                    setEditPaymentDate(e.target.value);
                    setEditIsPaymentDateUnknown(false);
                  }}
                  required={!editIsPaymentDateUnknown}
                  disabled={editIsPaymentDateUnknown}
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3DB9B2]"
                />
                <div className="mt-2 flex items-center">
                  <input
                    type="checkbox"
                    id="editPaymentDateUnknown"
                    checked={editIsPaymentDateUnknown}
                    onChange={(e) => {
                      setEditIsPaymentDateUnknown(e.target.checked);
                      if (e.target.checked) {
                        setEditPaymentDate('');
                      }
                    }}
                    className="mr-2"
                  />
                  <label htmlFor="editPaymentDateUnknown" className="text-sm text-gray-700">Date inconnue</label>
                </div>
              </label>
              {/* Type de paiement DROPDOWN for Edit */}
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Type de paiement
                <select
                  value={editPaymentType}
                  onChange={(e) => setEditPaymentType(e.target.value)}
                  required
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3DB9B2]"
                >
                  <option value="">Sélectionnez un type</option>
                  {paymentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block mb-4 text-sm font-medium text-gray-700">
                Paiement
                <input
                  type="text" // Changed to text to allow comma input
                  value={editPaymentAmount}
                  onChange={(e) => {
                    const value = e.target.value.replace(',', '.'); // Replace comma with dot
                    setEditPaymentAmount(value);
                  }}
                  required
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3DB9B2]"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditPaymentOpen(false)}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={editPaymentLoading}
                  className="px-4 py-2 bg-[#3DB9B2] text-white rounded hover:bg-[#298b89] disabled:opacity-50"
                >
                  {editPaymentLoading ? 'Mise à jour...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Delete Payment Confirmation Modal */}
        {isConfirmDeletePaymentOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsConfirmDeletePaymentOpen(false)}
          >
            <div
              className="bg-white p-6 rounded-md w-80 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl mb-4 font-semibold text-red-600">Confirmer la suppression</h2>
              <p className="mb-6 text-gray-700">Êtes-vous sûr de vouloir supprimer ce paiement ?</p>
              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsConfirmDeletePaymentOpen(false)}
                  className="px-5 py-2 rounded border border-gray-300 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDeletePaymentConfirmed}
                  disabled={paymentLoading}
                  className="px-5 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                >
                  {paymentLoading ? 'Suppression...' : 'Oui, supprimer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Purchase Modal */}
        {isAddPurchaseOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsAddPurchaseOpen(false)}
          >
            <form
              onSubmit={handleAddPurchase}
              className="bg-white p-6 rounded-md w-96"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl mb-4 font-semibold text-[#045757]">Ajouter un achat</h2>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Date d'achat
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => {
                    setPurchaseDate(e.target.value);
                    setIsPurchaseDateUnknown(false);
                  }}
                  required={!isPurchaseDateUnknown}
                  disabled={isPurchaseDateUnknown}
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3DB9B2]"
                />
                <div className="mt-2 flex items-center">
                  <input
                    type="checkbox"
                    id="purchaseDateUnknown"
                    checked={isPurchaseDateUnknown}
                    onChange={(e) => {
                      setIsPurchaseDateUnknown(e.target.checked);
                      if (e.target.checked) {
                        setPurchaseDate('');
                      }
                    }}
                    className="mr-2"
                  />
                  <label htmlFor="purchaseDateUnknown" className="text-sm text-gray-700">Date inconnue</label>
                </div>
              </label>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Quantité
                <input
                  type="text" // Changed to text to allow comma input
                  value={purchaseQuantity}
                  onChange={(e) => {
                    const value = e.target.value.replace(',', '.');
                    setPurchaseQuantity(value);
                  }}
                  required
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3DB9B2]"
                />
              </label>
              {/* Type Dropdown with Add Button */}
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Type
                <div className="flex items-center gap-2">
                  <select
                    value={purchaseType}
                    onChange={(e) => setPurchaseType(e.target.value)}
                    required
                    className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3DB9B2]"
                  >
                    <option value="">Sélectionnez un type</option>
                    {types.map((type) => (
                      <option key={type.id} value={type.type_name}>
                        {type.type_name}
                      </option>
                    ))}
                    <option value="inconnue" style={{ color: 'red' }}>Inconnue</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsAddTypeModalOpen(true)}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                    aria-label="Ajouter un nouveau type"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </label>
              {/* Classe Dropdown with Add Button */}
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Classe
                <div className="flex items-center gap-2">
                  <select
                    value={purchaseClass}
                    onChange={(e) => setPurchaseClass(e.target.value)}
                    required
                    className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3DB9B2]"
                  >
                    <option value="">Sélectionnez une classe</option>
                    {classes.map((classe) => (
                      <option key={classe.id} value={classe.classe_name}>
                        {classe.classe_name}
                      </option>
                    ))}
                    <option value="inconnue" style={{ color: 'red' }}>Inconnue</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsAddClasseModalOpen(true)}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                    aria-label="Ajouter une nouvelle classe"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </label>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Poids
                <input
                  type="text" // Changed to text to allow comma input
                  step="0.01"
                  value={purchaseWeight}
                  onChange={(e) => {
                    const value = e.target.value.replace(',', '.');
                    setPurchaseWeight(value);
                  }}
                  required
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3DB9B2]"
                />
              </label>
              {/* NEW: Prix unitaire field */}
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Prix unitaire
                <input
                  type="text" // Changed to text to allow comma input
                  step="0.01"
                  value={purchaseUnitPrice}
                  onChange={(e) => {
                    const value = e.target.value.replace(',', '.');
                    setPurchaseUnitPrice(value);
                  }}
                  required
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3DB9B2]"
                />
              </label>
              {/* MODIFIED: Prix field (formerly Prix total) - now editable */}
              <label className="block mb-4 text-sm font-medium text-gray-700">
                Prix
                <input
                  type="text" // Changed to text to allow comma input
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => {
                    const value = e.target.value.replace(',', '.');
                    setPurchasePrice(value);
                  }}
                  required
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3DB9B2]"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPurchaseOpen(false)}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={purchaseLoading}
                  className="px-4 py-2 bg-[#3DB9B2] text-white rounded hover:bg-[#298b89] disabled:opacity-50"
                >
                  {purchaseLoading ? 'Ajout en cours...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Purchase Modal */}
        {isEditPurchaseOpen && currentPurchase && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsEditPurchaseOpen(false)}
          >
            <form
              onSubmit={handleUpdatePurchase}
              className="bg-white p-6 rounded-md w-96"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl mb-4 font-semibold text-[#045757]">Modifier l'achat</h2>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Date d'achat
                <input
                  type="date"
                  value={editPurchaseDate}
                  onChange={(e) => {
                    setEditPurchaseDate(e.target.value);
                    setEditIsPurchaseDateUnknown(false);
                  }}
                  required={!editIsPurchaseDateUnknown}
                  disabled={editIsPurchaseDateUnknown}
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3DB9B2]"
                />
                <div className="mt-2 flex items-center">
                  <input
                    type="checkbox"
                    id="editPurchaseDateUnknown"
                    checked={editIsPurchaseDateUnknown}
                    onChange={(e) => {
                      setEditIsPurchaseDateUnknown(e.target.checked);
                      if (e.target.checked) {
                        setEditPurchaseDate('');
                      }
                    }}
                    className="mr-2"
                  />
                  <label htmlFor="editPurchaseDateUnknown" className="text-sm text-gray-700">Date inconnue</label>
                </div>
              </label>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Quantité
                <input
                  type="text" // Changed to text to allow comma input
                  value={editPurchaseQuantity}
                  onChange={(e) => {
                    const value = e.target.value.replace(',', '.');
                    setEditPurchaseQuantity(value);
                  }}
                  required
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3DB9B2]"
                />
              </label>
              {/* Type Dropdown with Add Button for Edit Modal */}
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Type
                <div className="flex items-center gap-2">
                  <select
                    value={editPurchaseType}
                    onChange={(e) => setEditPurchaseType(e.target.value)}
                    required
                    className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3DB9B2]"
                  >
                    <option value="">Sélectionnez un type</option>
                    {types.map((type) => (
                      <option key={type.id} value={type.type_name}>
                        {type.type_name}
                      </option>
                    ))}
                    <option value="inconnue" style={{ color: 'red' }}>Inconnue</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsAddTypeModalOpen(true)}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                    aria-label="Ajouter un nouveau type"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </label>
              {/* Classe Dropdown with Add Button for Edit Modal */}
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Classe
                <div className="flex items-center gap-2">
                  <select
                    value={editPurchaseClass}
                    onChange={(e) => setEditPurchaseClass(e.target.value)}
                    required
                    className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3DB9B2]"
                  >
                    <option value="">Sélectionnez une classe</option>
                    {classes.map((classe) => (
                      <option key={classe.id} value={classe.classe_name}>
                        {classe.classe_name}
                      </option>
                    ))}
                    <option value="inconnue" style={{ color: 'red' }}>Inconnue</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsAddClasseModalOpen(true)}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                    aria-label="Ajouter une nouvelle classe"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </label>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Poids
                <input
                  type="text" // Changed to text to allow comma input
                  step="0.01"
                  value={editPurchaseWeight}
                  onChange={(e) => {
                    const value = e.target.value.replace(',', '.');
                    setEditPurchaseWeight(value);
                  }}
                  required
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3DB9B2]"
                />
              </label>
              {/* NEW: Prix unitaire field for Edit */}
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Prix unitaire
                <input
                  type="text" // Changed to text to allow comma input
                  step="0.01"
                  value={editPurchaseUnitPrice}
                  onChange={(e) => {
                    const value = e.target.value.replace(',', '.');
                    setEditPurchaseUnitPrice(value);
                  }}
                  required
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3DB9B2]"
                />
              </label>
              {/* MODIFIED: Prix field (formerly Prix total) - now editable for Edit */}
              <label className="block mb-4 text-sm font-medium text-gray-700">
                Prix
                <input
                  type="text" // Changed to text to allow comma input
                  step="0.01"
                  value={editPurchasePrice}
                  onChange={(e) => {
                    const value = e.target.value.replace(',', '.');
                    setEditPurchasePrice(value);
                  }}
                  required
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3DB9B2]"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditPurchaseOpen(false)}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={editPurchaseLoading}
                  className="px-4 py-2 bg-[#3DB9B2] text-white rounded hover:bg-[#298b89] disabled:opacity-50"
                >
                  {editPurchaseLoading ? 'Mise à jour...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Delete Purchase Confirmation Modal */}
        {isConfirmDeletePurchaseOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsConfirmDeletePurchaseOpen(false)}
          >
            <div
              className="bg-white p-6 rounded-md w-80 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl mb-4 font-semibold text-red-600">Confirmer la suppression</h2>
              <p className="mb-6 text-gray-700">Êtes-vous sûr de vouloir supprimer cet achat ?</p>
              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsConfirmDeletePurchaseOpen(false)}
                  className="px-5 py-2 rounded border border-gray-300 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDeletePurchaseConfirmed}
                  disabled={purchaseLoading}
                  className="px-5 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                >
                  {purchaseLoading ? 'Suppression...' : 'Oui, supprimer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NEW: Add Type Modal */}
        {isAddTypeModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsAddTypeModalOpen(false)}
          >
            <form
              onSubmit={handleAddNewType}
              className="bg-white p-6 rounded-md w-80"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl mb-4 font-semibold text-[#045757]">Ajouter un nouveau type</h2>
              <label className="block mb-4 text-sm font-medium text-gray-700">
                Nom du type
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value.toLowerCase())}
                  required
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3DB9B2]"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTypeModalOpen(false)}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isAddingType}
                  className="px-4 py-2 bg-[#3DB9B2] text-white rounded hover:bg-[#298b89] disabled:opacity-50"
                >
                  {isAddingType ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* NEW: Add Classe Modal */}
        {isAddClasseModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsAddClasseModalOpen(false)}
          >
            <form
              onSubmit={handleAddNewClasse}
              className="bg-white p-6 rounded-md w-80"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl mb-4 font-semibold text-[#045757]">Ajouter une nouvelle classe</h2>
              <label className="block mb-4 text-sm font-medium text-gray-700">
                Nom de la classe
                <input
                  type="text"
                  value={newClasseName}
                  onChange={(e) => setNewClasseName(e.target.value.toLowerCase())}
                  required
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3DB9B2]"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddClasseModalOpen(false)}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isAddingClasse}
                  className="px-4 py-2 bg-[#3DB9B2] text-white rounded hover:bg-[#298b89] disabled:opacity-50"
                >
                  {isAddingClasse ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        )}

      </main>

      {/* Hidden div for PDF generation */}
      <div ref={reportContentRef} style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm', padding: '10mm' }}>
        {/* Client Info */}
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px' }}>Rapport Client</h1>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Nom: {clientData.full_name}</h2>
        <p style={{ fontSize: '14px', marginBottom: '4px' }}>Téléphone: {clientData.phone_number || 'N/A'}</p>
        <p style={{ fontSize: '14px', marginBottom: '20px' }}>Adresse: {clientData.address || 'N/A'}</p>

        {/* Summary */}
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>Sommaire</h2>
        <p style={{ fontSize: '16px', marginBottom: '4px' }}>Total Achats: {formatCurrency(totalPrix)} DH</p>
        <p style={{ fontSize: '16px', marginBottom: '4px' }}>Total Paiements: {formatCurrency(totalPaiement)} DH</p>
        <p style={{ fontSize: '16px', fontWeight: 'bold', color: leReste < 0 ? 'red' : 'black' }}>
          Le Reste: {formatCurrency(leReste)} DH
        </p>
        <div style={{ height: '20px' }}></div> {/* Spacer */}

        {/* Payments Table */}
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>Paiements</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#3DB9B2', color: 'white' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Date de paiement</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Type de paiement</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Paiement (DH)</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', color: 'gray' }}>Aucun paiement trouvé.</td>
              </tr>
            ) : (
              payments.map((p, idx) => (
                <tr key={p.id} style={{ backgroundColor: idx % 2 === 0 ? '#f5f7f7' : 'white' }}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatDisplayDate(p.date_paiement, p.date_paiement === null)}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{p.type_paiement}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatCurrency(p.paiement)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Purchases Table */}
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>Achats</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#3DB9B2', color: 'white' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Date d'achat</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Qté</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Type</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Classe</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Poids</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Prix unitaire (DH)</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Prix total (DH)</th>
            </tr>
          </thead>
          <tbody>
            {purchases.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', color: 'gray' }}>Aucun achat trouvé.</td>
              </tr>
            ) : (
              purchases.map((a, idx) => (
                <tr key={a.id} style={{ backgroundColor: idx % 2 === 0 ? '#f5f7f7' : 'white' }}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatDisplayDate(a.date_achat, a.date_achat === null)}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{a.quantite}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{a.type?.toLowerCase()}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{a.classe?.toLowerCase()}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{a.poids}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatCurrency(a.prix_unitaire)}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatCurrency(a.prix_total)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}