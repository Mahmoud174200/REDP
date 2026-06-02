import React, { useState, useEffect } from 'react';
import { Users, ClipboardList, Send, ShieldCheck, CheckCircle2, Milestone, DollarSign, ListFilter, AlertCircle, ShoppingCart } from 'lucide-react';
import api from '../../services/api';
import { ToastContainer } from '../../components/Toast';

const CompanySalesPortal: React.FC = () => {
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const renderMetadata = (metadata: any) => {
    if (!metadata || typeof metadata !== 'object') return null;

    const items: { label: string; value: string; icon: string }[] = [];

    if (metadata.source) {
      items.push({ label: 'Source', value: metadata.source, icon: '📍' });
    }
    if (metadata.interaction_type) {
      items.push({ label: 'Interaction Channel', value: metadata.interaction_type, icon: '💬' });
    }
    if (metadata.meeting_date) {
      const formattedDate = new Date(metadata.meeting_date).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      items.push({ label: 'Meeting Date', value: formattedDate, icon: '📅' });
    }
    if (metadata.location) {
      items.push({ label: 'Location', value: metadata.location, icon: '🏢' });
    }
    if (metadata.from_tier || metadata.to_tier) {
      const from = (metadata.from_tier || '').replace('tier_', 'Tier ');
      const to = (metadata.to_tier || '').replace('tier_', 'Tier ');
      items.push({ label: 'Tier Escalation', value: `${from} ➔ ${to}`, icon: '⚡' });
    }
    if (metadata.notes) {
      items.push({ label: 'Notes', value: metadata.notes, icon: '📝' });
    }
    if (metadata.unit_number) {
      items.push({ label: 'Unit Number', value: `#${metadata.unit_number}`, icon: '🔑' });
    }
    if (metadata.price) {
      items.push({ label: 'Unit Price', value: `${parseFloat(metadata.price).toLocaleString()} EGP`, icon: '💰' });
    }
    if (metadata.eoi_amount) {
      items.push({ label: 'EOI Amount', value: `${parseFloat(metadata.eoi_amount).toLocaleString()} EGP`, icon: '💵' });
    }

    if (items.length > 0) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginTop: '8px', padding: '10px 14px', background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(50, 71, 58, 0.08)', borderLeft: '4px solid var(--color-primary)', borderRadius: 'var(--radius-sm)' }}>
          {items.map((item, idx) => (
            <div key={idx} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{item.label}:</span>
              <strong style={{ color: 'var(--text-main)' }}>{item.value}</strong>
            </div>
          ))}
        </div>
      );
    }

    return (
      <pre style={{ margin: '4px 0 0 0', padding: '6px', background: 'rgba(0,0,0,0.03)', borderRadius: 'var(--radius-xs)', fontSize: '0.7rem', overflowX: 'auto', fontFamily: 'monospace' }}>
        {JSON.stringify(metadata, null, 2)}
      </pre>
    );
  };

  const [stats, setStats] = useState<any>({
    pipeline: { total_leads: 0, tier_1: 0, tier_2: 0, tier_3: 0, my_leads: 0 },
    bookings: { total_confirmed: 0 },
    revenue: { sold_value: 0, reserved_value: 0 }
  });
  const [leads, setLeads] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Journey Log States
  const [journeyLead, setJourneyLead] = useState<any | null>(null);
  const [journeyLogs, setJourneyLogs] = useState<any[]>([]);
  const [journeyPresentations, setJourneyPresentations] = useState<any[]>([]);
  const [showJourneyModal, setShowJourneyModal] = useState(false);

  // Custom Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Booking Modal States & Calculation parameters
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedLeadForBooking, setSelectedLeadForBooking] = useState<any | null>(null);
  const [bookingUnitId, setBookingUnitId] = useState('');
  const [bookingEoi, setBookingEoi] = useState('50000');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingHoldingDays, setBookingHoldingDays] = useState(7);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedReservationForContract, setSelectedReservationForContract] = useState<any | null>(null);
  const [finalPaymentMethod, setFinalPaymentMethod] = useState<'cash' | 'installment'>('installment');
  const [installmentType, setInstallmentType] = useState<'direct' | 'bank'>('direct');
  const [installmentTerm, setInstallmentTerm] = useState(5); // in years
  const [installmentInterest, setInstallmentInterest] = useState(0); // in percent p.a.
  const [downPayment, setDownPayment] = useState('');
  const [interestType, setInterestType] = useState<'flat' | 'reducing'>('reducing');
  const [cashGracePeriod, setCashGracePeriod] = useState(14); // in days

  // New payment schedule and add-ons state
  const [discountPercent, setDiscountPercent] = useState('0');
  const [installmentStartMonth, setInstallmentStartMonth] = useState(1); // starting month
  
  const [includeClub, setIncludeClub] = useState(false);
  const [clubCost, setClubCost] = useState('150000');
  const [clubPaymentMethod, setClubPaymentMethod] = useState<'cash' | 'installment'>('cash');
  const [clubTerm, setClubTerm] = useState(5); // in years
  const [clubInstallmentStartYear, setClubInstallmentStartYear] = useState(1);
  
  const [includeGarage, setIncludeGarage] = useState(false);
  const [garageCost, setGarageCost] = useState('100000');
  const [garagePaymentMethod, setGaragePaymentMethod] = useState<'cash' | 'installment'>('cash');
  const [garageTerm, setGarageTerm] = useState(5); // in years
  const [garageInstallmentStartYear, setGarageInstallmentStartYear] = useState(1);
  
  const [includeMaintenance, setIncludeMaintenance] = useState(false);
  const [maintenanceCost, setMaintenanceCost] = useState('');
  const [maintenancePaymentMethod, setMaintenancePaymentMethod] = useState<'cash' | 'installment'>('cash');
  const [maintenanceTerm, setMaintenanceTerm] = useState(5); // in years
  const [maintenanceDueMonth, setMaintenanceDueMonth] = useState(36); // if cash
  const [maintenanceInstallmentStartYear, setMaintenanceInstallmentStartYear] = useState(1);
  
  const [enableAnnual, setEnableAnnual] = useState(false);
  const [annualInstallmentAmount, setAnnualInstallmentAmount] = useState('50000');
  const [yearPercentages, setYearPercentages] = useState<number[]>([]);
  const [customAddons, setCustomAddons] = useState<{ id: string; name: string; cost: string; paymentMethod: 'cash' | 'installment'; term: number; startYear: number }[]>([]);

  const getCashDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + cashGracePeriod);
    return date.toLocaleDateString(undefined, { dateStyle: 'medium' });
  };


  // Unit Status Modal
  const [selectedUnit, setSelectedUnit] = useState<any | null>(null);
  const [unitStatusInput, setUnitStatusInput] = useState('available');
  const [unitStatusReason, setUnitStatusReason] = useState('');
  const [showUnitModal, setShowUnitModal] = useState(false);


  // Default down payment & maintenance on unit select
  useEffect(() => {
    if (bookingUnitId) {
      const selectedUnitForBookingObj = units.find(u => u.id === bookingUnitId);
      if (selectedUnitForBookingObj) {
        const price = parseFloat(selectedUnitForBookingObj.price);
        setDownPayment((price * 0.1).toString()); // 10% default
        setMaintenanceCost((price * 0.08).toString()); // 8% default
      }
    } else {
      setDownPayment('');
      setMaintenanceCost('');
    }
  }, [bookingUnitId, units]);

  // Default interest rate on installment type select
  useEffect(() => {
    if (installmentType === 'direct') {
      setInstallmentInterest(0);
    } else {
      setInstallmentInterest(10); // default bank finance rate
    }
  }, [installmentType]);

  // Resize and initialize year percentages evenly when installmentTerm changes
  useEffect(() => {
    if (installmentTerm > 0) {
      const basePct = Math.floor(100 / installmentTerm);
      const remainder = 100 - (basePct * installmentTerm);
      const newPercentages = Array.from({ length: installmentTerm }, (_, i) => {
        return basePct + (i === installmentTerm - 1 ? remainder : 0);
      });
      setYearPercentages(newPercentages);
    } else {
      setYearPercentages([]);
    }
  }, [installmentTerm]);

  const selectedUnitForBookingObj = units.find(u => u.id === bookingUnitId);
  const unitPrice = selectedUnitForBookingObj ? parseFloat(selectedUnitForBookingObj.price) : 0;

  const handleYearPercentageChange = (index: number, val: number) => {
    setYearPercentages(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const calculatePlan = () => {
    const price = unitPrice;
    const discountPct = parseFloat(discountPercent) || 0;
    const discount = price * (discountPct / 100);
    const dp = parseFloat(downPayment) || 0;
    const eoi = parseFloat(bookingEoi) || 0;

    const netPrice = price - discount;
    const term = installmentTerm || 1;
    const rate = installmentInterest || 0;
    const n = term * 12; // Total months

    const totalAnnualPayments = enableAnnual ? ((parseFloat(annualInstallmentAmount) || 0) * term) : 0;
    const principal = netPrice - dp - eoi - totalAnnualPayments;

    if (principal <= 0) {
      return {
        price: netPrice,
        totalInterest: 0,
        totalPrice: netPrice,
        remaining: 0,
        monthlyPayment: 0,
        netPrice
      };
    }

    if (interestType === 'reducing') {
      const monthlyRate = (rate / 100) / 12;
      if (monthlyRate > 0) {
        const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
        const totalPrice = (monthlyPayment * n) + dp + eoi + totalAnnualPayments;
        const totalInterest = totalPrice - netPrice;
        const remaining = totalPrice - dp - eoi - totalAnnualPayments;
        return {
          price: netPrice,
          totalInterest,
          totalPrice,
          remaining,
          monthlyPayment,
          netPrice
        };
      } else {
        const monthlyPayment = principal / n;
        return {
          price: netPrice,
          totalInterest: 0,
          totalPrice: netPrice,
          remaining: principal,
          monthlyPayment,
          netPrice
        };
      }
    } else {
      // Flat interest: Interest = Principal * Rate * Years
      const totalInterest = principal * (rate / 100) * term;
      const totalPrice = netPrice + totalInterest;
      const remaining = principal + totalInterest;
      const monthlyPayment = remaining / n;
      return {
        price: netPrice,
        totalInterest,
        totalPrice,
        remaining,
        monthlyPayment,
        netPrice
      };
    }
  };

  const generatePaymentSchedule = () => {
    const schedule: any[] = [];
    const price = unitPrice;
    if (price <= 0) return schedule;

    const dp = parseFloat(downPayment) || 0;
    const eoi = parseFloat(bookingEoi) || 0;
    const discountPct = parseFloat(discountPercent) || 0;
    const discount = price * (discountPct / 100);
    const netPrice = price - discount;

    const today = new Date();

    // 1. EOI Deposit (paid today)
    schedule.push({
      month: 0,
      label: 'جدية الحجز (EOI Deposit)',
      amount: eoi,
      type: 'eoi',
      dueDate: today.toLocaleDateString(undefined, { dateStyle: 'medium' })
    });

    // 2. Down Payment (paid today)
    if (dp > 0) {
      schedule.push({
        month: 0,
        label: 'دفعة مقدمة (Down Payment)',
        amount: dp,
        type: 'down_payment',
        dueDate: today.toLocaleDateString(undefined, { dateStyle: 'medium' })
      });
    }

    // 3. Main Unit Payment (Cash or Installment)
    if (finalPaymentMethod === 'cash') {
      const remainingCash = netPrice - eoi;
      const cashDue = new Date();
      cashDue.setDate(cashDue.getDate() + cashGracePeriod);
      schedule.push({
        month: 1,
        label: 'باقي كاش ثمن الوحدة (Remaining Cash Balance)',
        amount: remainingCash,
        type: 'cash_balance',
        dueDate: cashDue.toLocaleDateString(undefined, { dateStyle: 'medium' })
      });
    } else {
      // Installment scheduling for unit
      const plan = calculatePlan();
      const term = installmentTerm || 1;
      const n = term * 12;
      const remainingToAmortize = plan.remaining;
      const annualAmount = enableAnnual ? (parseFloat(annualInstallmentAmount) || 0) : 0;

      for (let m = 1; m <= n; m++) {
        const actualMonth = (installmentStartMonth - 1) + m;
        const itemDate = new Date();
        itemDate.setMonth(itemDate.getMonth() + actualMonth);
        const dateStr = itemDate.toLocaleDateString(undefined, { dateStyle: 'medium' });

        const yearIndex = Math.ceil(m / 12) - 1;
        const yearPct = yearPercentages[yearIndex] || 0;
        const yearAllocatedAmount = remainingToAmortize * (yearPct / 100);
        const monthlyPaymentForThisYear = yearAllocatedAmount / 12;

        if (monthlyPaymentForThisYear > 0) {
          schedule.push({
            month: actualMonth,
            label: `قسط شهري وحدة - سنة ${yearIndex + 1} - رقم ${m} (Unit Installment #${m})`,
            amount: Math.round(monthlyPaymentForThisYear),
            type: 'monthly',
            dueDate: dateStr
          });
        }

        if (enableAnnual && annualAmount > 0 && m % 12 === 0) {
          const yearNum = m / 12;
          schedule.push({
            month: actualMonth,
            label: `دفعة سنوية وحدة رقم ${yearNum} (Annual Unit Installment #${yearNum})`,
            amount: annualAmount,
            type: 'annual',
            dueDate: dateStr
          });
        }
      }
    }

    // 4. Add-on: Club Membership
    if (includeClub) {
      const clubVal = parseFloat(clubCost) || 0;
      if (clubVal > 0) {
        if (clubPaymentMethod === 'cash') {
          const cashDue = new Date();
          cashDue.setMonth(cashDue.getMonth() + 1);
          schedule.push({
            month: 1,
            label: 'اشتراك نادي - كاش (Club Membership - Cash)',
            amount: clubVal,
            type: 'club_cash',
            dueDate: cashDue.toLocaleDateString(undefined, { dateStyle: 'medium' })
          });
        } else {
          const termMonths = clubTerm * 12;
          const clubMonthly = Math.round(clubVal / termMonths);
          const startMonth = (clubInstallmentStartYear - 1) * 12 + 1;
          for (let m = 1; m <= termMonths; m++) {
            const actualMonth = startMonth + m - 1;
            const itemDate = new Date();
            itemDate.setMonth(itemDate.getMonth() + actualMonth);
            schedule.push({
              month: actualMonth,
              label: `قسط اشتراك نادي رقم ${m} - سنة ${Math.ceil(actualMonth / 12)} (Club Installment #${m})`,
              amount: clubMonthly,
              type: 'club_installment',
              dueDate: itemDate.toLocaleDateString(undefined, { dateStyle: 'medium' })
            });
          }
        }
      }
    }

    // 5. Add-on: Garage Access
    if (includeGarage) {
      const garageVal = parseFloat(garageCost) || 0;
      if (garageVal > 0) {
        if (garagePaymentMethod === 'cash') {
          const cashDue = new Date();
          cashDue.setMonth(cashDue.getMonth() + 1);
          schedule.push({
            month: 1,
            label: 'جراج - كاش (Garage Access - Cash)',
            amount: garageVal,
            type: 'garage_cash',
            dueDate: cashDue.toLocaleDateString(undefined, { dateStyle: 'medium' })
          });
        } else {
          const termMonths = garageTerm * 12;
          const garageMonthly = Math.round(garageVal / termMonths);
          const startMonth = (garageInstallmentStartYear - 1) * 12 + 1;
          for (let m = 1; m <= termMonths; m++) {
            const actualMonth = startMonth + m - 1;
            const itemDate = new Date();
            itemDate.setMonth(itemDate.getMonth() + actualMonth);
            schedule.push({
              month: actualMonth,
              label: `قسط جراج رقم ${m} - سنة ${Math.ceil(actualMonth / 12)} (Garage Installment #${m})`,
              amount: garageMonthly,
              type: 'garage_installment',
              dueDate: itemDate.toLocaleDateString(undefined, { dateStyle: 'medium' })
            });
          }
        }
      }
    }

    // 6. Add-on: Maintenance Deposit
    if (includeMaintenance) {
      const maintenanceVal = parseFloat(maintenanceCost) || 0;
      if (maintenanceVal > 0) {
        if (maintenancePaymentMethod === 'cash') {
          const cashDue = new Date();
          cashDue.setMonth(cashDue.getMonth() + maintenanceDueMonth);
          schedule.push({
            month: maintenanceDueMonth,
            label: 'وديعة صيانة - كاش (Maintenance Deposit - Cash)',
            amount: maintenanceVal,
            type: 'maintenance_cash',
            dueDate: cashDue.toLocaleDateString(undefined, { dateStyle: 'medium' })
          });
        } else {
          const termMonths = maintenanceTerm * 12;
          const maintenanceMonthly = Math.round(maintenanceVal / termMonths);
          const startMonth = (maintenanceInstallmentStartYear - 1) * 12 + 1;
          for (let m = 1; m <= termMonths; m++) {
            const actualMonth = startMonth + m - 1;
            const itemDate = new Date();
            itemDate.setMonth(itemDate.getMonth() + actualMonth);
            schedule.push({
              month: actualMonth,
              label: `قسط وديعة صيانة رقم ${m} - سنة ${Math.ceil(actualMonth / 12)} (Maintenance Installment #${m})`,
              amount: maintenanceMonthly,
              type: 'maintenance_installment',
              dueDate: itemDate.toLocaleDateString(undefined, { dateStyle: 'medium' })
            });
          }
        }
      }
    }

    // 7. Dynamic Custom Add-ons
    customAddons.forEach(addon => {
      const val = parseFloat(addon.cost) || 0;
      if (val > 0) {
        if (addon.paymentMethod === 'cash') {
          const cashDue = new Date();
          cashDue.setMonth(cashDue.getMonth() + 1);
          schedule.push({
            month: 1,
            label: `${addon.name} - كاش (${addon.name} - Cash)`,
            amount: val,
            type: 'custom_cash',
            addonId: addon.id,
            dueDate: cashDue.toLocaleDateString(undefined, { dateStyle: 'medium' })
          });
        } else {
          const termMonths = addon.term * 12;
          const monthlyVal = Math.round(val / termMonths);
          const startMonth = (addon.startYear - 1) * 12 + 1;
          for (let m = 1; m <= termMonths; m++) {
            const actualMonth = startMonth + m - 1;
            const itemDate = new Date();
            itemDate.setMonth(itemDate.getMonth() + actualMonth);
            schedule.push({
              month: actualMonth,
              label: `قسط ${addon.name} رقم ${m} - سنة ${Math.ceil(actualMonth / 12)} (${addon.name} Installment #${m})`,
              amount: monthlyVal,
              type: 'custom_installment',
              addonId: addon.id,
              dueDate: itemDate.toLocaleDateString(undefined, { dateStyle: 'medium' })
            });
          }
        }
      }
    });

    // Sort chronologically by month index
    schedule.sort((a, b) => a.month - b.month);

    // Sum up the totals for each category
    const unitSum = schedule
      .filter(item => ['eoi', 'down_payment', 'cash_balance', 'monthly', 'annual'].includes(item.type))
      .reduce((sum, item) => sum + item.amount, 0);

    const clubSum = schedule
      .filter(item => ['club_cash', 'club_installment'].includes(item.type))
      .reduce((sum, item) => sum + item.amount, 0);

    const garageSum = schedule
      .filter(item => ['garage_cash', 'garage_installment'].includes(item.type))
      .reduce((sum, item) => sum + item.amount, 0);

    const maintenanceSum = schedule
      .filter(item => ['maintenance_cash', 'maintenance_installment'].includes(item.type))
      .reduce((sum, item) => sum + item.amount, 0);

    const customSums: { [key: string]: number } = {};
    schedule
      .filter(item => ['custom_cash', 'custom_installment'].includes(item.type))
      .forEach(item => {
        if (item.addonId) {
          customSums[item.addonId] = (customSums[item.addonId] || 0) + item.amount;
        }
      });

    // Compute percentage for each item relative to its category total
    schedule.forEach(item => {
      let denom = 0;
      let category = 'Unit';

      if (['eoi', 'down_payment', 'cash_balance', 'monthly', 'annual'].includes(item.type)) {
        denom = unitSum;
        category = 'Unit';
      } else if (['club_cash', 'club_installment'].includes(item.type)) {
        denom = clubSum;
        category = 'Club';
      } else if (['garage_cash', 'garage_installment'].includes(item.type)) {
        denom = garageSum;
        category = 'Garage';
      } else if (['maintenance_cash', 'maintenance_installment'].includes(item.type)) {
        denom = maintenanceSum;
        category = 'Maintenance';
      } else if (['custom_cash', 'custom_installment'].includes(item.type) && item.addonId) {
        denom = customSums[item.addonId] || 0;
        const addon = customAddons.find(a => a.id === item.addonId);
        category = addon ? addon.name : 'Add-on';
      }

      item.percentage = denom > 0 ? (item.amount / denom) * 100 : 0;
      item.categoryName = category;
    });

    return schedule;
  };

  const serializeScheduleTable = (schedule: any[]) => {
    let table = "\n\n=== SCHEDULED PAYMENT PLAN ===\n";
    table += "| # | Description / البيان | Due Date / تاريخ الاستحقاق | Amount / القيمة | % of Category |\n";
    table += "|---|----------------------|----------------------------|-----------------|----------------|\n";
    schedule.forEach((item) => {
      table += `| Month ${item.month} | ${item.label} | ${item.dueDate} | ${item.amount.toLocaleString()} EGP | ${(item.percentage || 0).toFixed(2)}% of ${item.categoryName || 'Total'} |\n`;
    });
    const totalPayments = schedule.reduce((sum, item) => sum + item.amount, 0);
    table += `\n**Total Scheduled Outlays: ${totalPayments.toLocaleString()} EGP**\n`;
    return table;
  };

  const handlePrintSchedule = () => {
    const schedule = generatePaymentSchedule();
    const plan = calculatePlan();
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Popup blocker prevented printing. Please allow popups.', 'error');
      return;
    }

    const title = `Payment Plan / جدول سداد - Unit ${selectedUnitForBookingObj?.unit_number || ''}`;

    const totalOutlays = schedule.reduce((sum, item) => sum + item.amount, 0);

    // Group items by month index
    const groupedByMonth: { [key: number]: any[] } = {};
    schedule.forEach(item => {
      if (!groupedByMonth[item.month]) {
        groupedByMonth[item.month] = [];
      }
      groupedByMonth[item.month].push(item);
    });

    const sortedMonths = Object.keys(groupedByMonth).map(Number).sort((a, b) => a - b);

    const groupedMonthsHtml = sortedMonths.map(mNum => {
      const items = groupedByMonth[mNum];
      const monthTotal = items.reduce((sum, item) => sum + item.amount, 0);
      const monthPct = totalOutlays > 0 ? (monthTotal / totalOutlays) * 100 : 0;
      
      const titleStr = mNum === 0 
        ? 'Today (المقدم وجدية الحجز)' 
        : `Month ${mNum} (الشهر ${mNum})`;

      return `
        <div class="month-card">
          <div class="month-card-header">
            <span class="month-title">${titleStr}</span>
            <span class="month-total">${monthTotal.toLocaleString()} EGP (${monthPct.toFixed(2)}% of Total)</span>
          </div>
          <div class="month-card-body">
            <table class="month-table">
              <thead>
                <tr>
                  <th style="width: 45%; text-align: left;">Description / البيان</th>
                  <th style="width: 25%; text-align: left;">Due Date / تاريخ الاستحقاق</th>
                  <th style="width: 15%; text-align: right;">Amount / القيمة</th>
                  <th style="width: 15%; text-align: right;">% of Category</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td>${item.label}</td>
                    <td>${item.dueDate}</td>
                    <td style="text-align: right; font-weight: 600;">${item.amount.toLocaleString()} EGP</td>
                    <td style="text-align: right; color: #555;">${(item.percentage || 0).toFixed(2)}% of ${item.categoryName}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }).join('');
    
    let html = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; direction: ltr; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2c3e32; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #2c3e32; font-size: 24px; }
            .header-info { text-align: right; font-size: 14px; color: #666; }
            .section-title { font-size: 18px; color: #2c3e32; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .card { background: #f9f9f9; padding: 15px; border: 1px solid #eee; border-radius: 6px; }
            .card-title { font-weight: bold; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; color: #666; }
            .card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px; }
            .card-grid div { padding: 4px 0; }
            
            /* Grouped Month Shaded Cards styling */
            .month-card { 
              background: #f4f6f4; 
              border: 1px solid #c8d3cb; 
              border-radius: 8px; 
              padding: 16px; 
              margin-bottom: 20px; 
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
              page-break-inside: avoid;
            }
            .month-card-header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              border-bottom: 2px solid #2c3e32; 
              padding-bottom: 8px; 
              margin-bottom: 12px; 
            }
            .month-title { 
              font-size: 16px; 
              font-weight: 800; 
              color: #2c3e32; 
            }
            .month-total { 
              font-size: 15px; 
              font-weight: 800; 
              color: #1b5e20; 
            }
            .month-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 13px;
            }
            .month-table th {
              background-color: transparent;
              color: #555;
              font-weight: bold;
              border-bottom: 1px solid #ddd;
              padding: 6px 8px;
              text-align: left;
            }
            .month-table td {
              padding: 6px 8px;
              border-bottom: 1px solid #eee;
              color: #333;
            }
            .month-table tr:last-child td {
              border-bottom: none;
            }

            .years-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; margin-bottom: 20px; }
            .year-box { background: #fdfdfd; border: 1px solid #ddd; padding: 10px; border-radius: 4px; text-align: center; }
            .year-box-title { font-weight: bold; font-size: 12px; color: #555; }
            .year-box-val { font-size: 14px; font-weight: 700; color: #2c3e32; margin-top: 4px; }
            .year-box-pct { font-size: 11px; color: #888; }
            @media print {
              body { padding: 0; }
              .print-btn-container { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>REAL ESTATE PAYMENT PLAN</h1>
              <div style="font-size:14px; margin-top:5px; color:#555;">Lead: <strong>${selectedLeadForBooking?.first_name || ''} ${selectedLeadForBooking?.last_name || ''}</strong></div>
            </div>
            <div class="header-info">
              <div>Date: ${new Date().toLocaleDateString()}</div>
              <div>Unit Number: <strong>${selectedUnitForBookingObj?.unit_number || 'N/A'}</strong></div>
              <div>Project: <strong>${selectedUnitForBookingObj?.project?.name || 'N/A'}</strong></div>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <div class="card-title">Deal Summary / ملخص الصفقة</div>
              <div class="card-grid">
                <div>Base Price:</div><div><strong>${unitPrice.toLocaleString()} EGP</strong></div>
                <div>Discount:</div><div><strong>${(unitPrice * (parseFloat(discountPercent) / 100)).toLocaleString()} EGP (${discountPercent}%)</strong></div>
                <div>Net Price:</div><div><strong>${plan.price.toLocaleString()} EGP</strong></div>
                <div>Down Payment:</div><div><strong>${(parseFloat(downPayment) || 0).toLocaleString()} EGP</strong></div>
                <div>EOI Deposit:</div><div><strong>${(parseFloat(bookingEoi) || 0).toLocaleString()} EGP</strong></div>
                ${finalPaymentMethod === 'installment' ? `<div>Installments Start:</div><div><strong>Month ${installmentStartMonth}</strong></div>` : ''}
              </div>
            </div>
            <div class="card">
              <div class="card-title">Add-ons Summary / ملخص الإضافات</div>
              <div class="card-grid">
                <div>Club Membership:</div><div><strong>${includeClub ? `${(parseFloat(clubCost) || 0).toLocaleString()} EGP (${clubPaymentMethod === 'cash' ? 'Cash' : `${clubTerm} Yr Installment (Starts Yr ${clubInstallmentStartYear})`})` : 'Not Included'}</strong></div>
                <div>Garage Access:</div><div><strong>${includeGarage ? `${(parseFloat(garageCost) || 0).toLocaleString()} EGP (${garagePaymentMethod === 'cash' ? 'Cash' : `${garageTerm} Yr Installment (Starts Yr ${garageInstallmentStartYear})`})` : 'Not Included'}</strong></div>
                <div>Maintenance Deposit:</div><div><strong>${includeMaintenance ? `${(parseFloat(maintenanceCost) || 0).toLocaleString()} EGP (${maintenancePaymentMethod === 'cash' ? `Cash - due Month ${maintenanceDueMonth}` : `${maintenanceTerm} Yr Installment (Starts Yr ${maintenanceInstallmentStartYear})`})` : 'Not Included'}</strong></div>
                ${customAddons.map(addon => `
                  <div>${addon.name}:</div><div><strong>${(parseFloat(addon.cost) || 0).toLocaleString()} EGP (${addon.paymentMethod === 'cash' ? 'Cash' : `${addon.term} Yr Installment (Starts Yr ${addon.startYear})`})</strong></div>
                `).join('')}
              </div>
            </div>
          </div>

          ${yearPercentages.length > 0 && finalPaymentMethod === 'installment' ? `
            <div class="section-title">Yearly Distribution / التوزيع السنوي للأقساط</div>
            <div class="years-grid">
              ${yearPercentages.map((pct, idx) => {
                const amount = plan.remaining * (pct / 100);
                return `
                  <div class="year-box">
                    <div class="year-box-title">Year ${idx + 1}</div>
                    <div class="year-box-val">${Math.round(amount).toLocaleString()} EGP</div>
                    <div class="year-box-pct">${pct}% of installments</div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}

          <div class="section-title">Chronological Payment Schedule / جدول الدفعات الزمني</div>
          ${groupedMonthsHtml}

          <div style="font-size: 16px; font-weight: bold; margin-top: 30px; text-align: right; border-top: 2px solid #2c3e32; padding-top: 15px;">
            Total Scheduled Outlays: ${totalOutlays.toLocaleString()} EGP (100.00%)
          </div>

          <div class="print-btn-container" style="margin-top: 40px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; font-weight: bold; background-color: #2c3e32; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">Print Plan / طباعة</button>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleDownloadCSV = () => {
    const schedule = generatePaymentSchedule();
    if (schedule.length === 0) return;

    let csvContent = "\ufeff"; // BOM for excel arabic support
    csvContent += "Month,Description,Due Date,Amount (EGP),% of Total\n";
    
    schedule.forEach(item => {
      csvContent += `${item.month},"${item.label}",${item.dueDate},${item.amount},${(item.percentage || 0).toFixed(2)}%\n`;
    });

    const total = schedule.reduce((s, i) => s + i.amount, 0);
    csvContent += `,,Total Scheduled Outlays,${total},100%\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `payment_schedule_unit_${selectedUnitForBookingObj?.unit_number || 'unit'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const fetchPortalData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Dashboard Stats
      const statsRes = await api.get('/v1/sales/company/dashboard');
      if (statsRes.data && statsRes.data.success) {
        setStats(statsRes.data.stats);
      }

      // 2. Fetch Leads
      const leadsRes = await api.get('/v1/sales/company/leads');
      if (leadsRes.data && leadsRes.data.success) {
        setLeads(leadsRes.data.data.data || []);
      }

      // 3. Fetch Units
      const unitsRes = await api.get('/v1/sales/company/units');
      if (unitsRes.data && unitsRes.data.success) {
        setUnits(unitsRes.data.data || []);
      }

      // 4. Fetch Transactions
      const transRes = await api.get('/v1/sales/company/transactions');
      if (transRes.data && transRes.data.success) {
        setTransactions(transRes.data.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch Company Sales portal data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  const handleAssignToSelf = async (leadId: string) => {
    try {
      setIsLoading(true);
      const res = await api.put(`/v1/sales/company/leads/${leadId}/assign`);
      if (res.data && res.data.success) {
        await fetchPortalData();
        showToast('Lead successfully assigned to you.', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to assign lead.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewJourney = async (lead: any) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/v1/sales/company/leads/${lead.id}/journey`);
      if (res.data && res.data.success) {
        setJourneyLead(res.data.lead);
        setJourneyLogs(res.data.journey || []);
        setJourneyPresentations(res.data.presentations || []);
        setShowJourneyModal(true);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to fetch journey details.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForBooking || !bookingUnitId) return;

    try {
      setIsLoading(true);
      const res = await api.post('/v1/sales/company/bookings', {
        lead_id: selectedLeadForBooking.id,
        unit_id: bookingUnitId,
        eoi_amount: parseFloat(bookingEoi),
        holding_days: bookingHoldingDays,
        notes: bookingNotes
      });
      if (res.data && res.data.success) {
        setBookingUnitId('');
        setBookingNotes('');
        setBookingEoi('50000');
        setBookingHoldingDays(7);
        setShowBookingModal(false);
        setSelectedLeadForBooking(null);
        await fetchPortalData();
        showToast('Booking hold executed successfully! Unit reserved and duration activated.', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to execute booking.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = (reservationId: string) => {
    setConfirmDialog({
      show: true,
      title: 'إلغاء حجز الوحدة / Cancel Booking Hold',
      message: 'هل أنت متأكد من إلغاء هذا الحجز المؤقت وإتاحة الوحدة للبيع مرة أخرى؟ سيتم ترحيل العميل إلى مرحلة التفاوض وسجل رد مبلغ جدية الحجز.\n\nAre you sure you want to cancel this booking hold and release the unit back to inventory?',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          const res = await api.post(`/v1/sales/company/bookings/${reservationId}/cancel`);
          if (res.data && res.data.success) {
            await fetchPortalData();
            showToast('Reservation hold cancelled successfully. Unit is now available.', 'success');
          }
        } catch (err: any) {
          showToast(err.response?.data?.message || 'Failed to cancel reservation.', 'error');
        } finally {
          setIsLoading(false);
          setConfirmDialog(prev => ({ ...prev, show: false }));
        }
      }
    });
  };


  const handleFinalizeContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReservationForContract) return;

    const plan = calculatePlan();
    const schedule = generatePaymentSchedule();

    try {
      setIsLoading(true);
      const res = await api.post(`/v1/finance/contracts/generate/${selectedReservationForContract.id}`, {
        type: finalPaymentMethod,
        notes: bookingNotes,
        schedule: schedule,
        monthly_amount: plan.monthlyPayment
      });

      if (res.data && res.data.success) {
        setShowContractModal(false);
        setSelectedReservationForContract(null);
        setBookingUnitId('');
        setBookingNotes('');
        setBookingEoi('50000');
        setDiscountPercent('0');
        setDownPayment('');
        setIncludeClub(false);
        setIncludeGarage(false);
        setIncludeMaintenance(false);
        setCustomAddons([]);
        await fetchPortalData();
        showToast('Contract and payment schedule finalized successfully!', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to finalize contract.', 'error');
    } finally {
      setIsLoading(false);
    }
  };




  const handleUpdateUnitStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;

    try {
      setIsLoading(true);
      const res = await api.put(`/v1/sales/company/units/${selectedUnit.id}/status`, {
        status: unitStatusInput,
        reason: unitStatusReason
      });
      if (res.data && res.data.success) {
        setUnitStatusReason('');
        setShowUnitModal(false);
        setSelectedUnit(null);
        await fetchPortalData();
        showToast('Unit status updated successfully.', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update unit status.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && leads.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '20px' }}>
        <div className="animate-spin" style={{ width: '50px', height: '50px', border: '5px solid var(--color-secondary)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }} />
        <p style={{ color: 'var(--text-muted)', fontWeight: 650, fontFamily: 'var(--font-title)' }}>Loading secure data environment...</p>
      </div>
    );
  }

  return (

    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', position: 'relative' }}>
      
      {/* Header Panel */}
      <div className="glass-panel" style={{ padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>🏢 Company Sales Portal (Tier 3)</h1>
          <p style={{ color: 'var(--text-muted)' }}>Oversee the complete lead lifecycle journey, execute reservations, and configure inventory status.</p>
        </div>
        <div style={{ padding: '6px 12px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b5cf6' }}>Sales Tier 3 Portal</span>
        </div>
      </div>

      {/* Stats Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ padding: '12px', background: 'rgba(59,130,246,0.1)', color: 'var(--color-primary)', borderRadius: 'var(--radius-sm)' }}>
            <Users style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>Lead Pipeline</h4>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '4px 0 0 0' }}>
              {stats.pipeline.total_leads} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>(My: {stats.pipeline.my_leads})</span>
            </h2>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ padding: '12px', background: 'rgba(245,158,11,0.1)', color: 'var(--color-warning)', borderRadius: 'var(--radius-sm)' }}>
            <Milestone style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>Tiers Distribution</h4>
            <h5 style={{ fontSize: '0.75rem', fontWeight: 700, margin: '4px 0 0 0' }}>
              T1: {stats.pipeline.tier_1} | T2: {stats.pipeline.tier_2} | T3: {stats.pipeline.tier_3}
            </h5>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ padding: '12px', background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', borderRadius: 'var(--radius-sm)' }}>
            <ShoppingCart style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>Bookings Done</h4>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '4px 0 0 0', color: 'var(--color-success)' }}>
              {stats.bookings.total_confirmed}
            </h2>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ padding: '12px', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', borderRadius: 'var(--radius-sm)' }}>
            <DollarSign style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>Inventory Sold</h4>
            <h5 style={{ fontSize: '0.72rem', fontWeight: 700, margin: '4px 0 0 0' }}>
              Sold: {stats.revenue.sold_value.toLocaleString()} EGP
            </h5>
          </div>
        </div>
      </div>

      {/* Main Grid Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
        
        {/* Leads and Journeys */}
        <div className="glass-panel" style={{ padding: '25px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users style={{ color: 'var(--color-primary)' }} />
            Leads Pipeline Operations
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Client Profile</th>
                  <th>Tier & Owner</th>
                  <th>Lifecycle Status</th>
                  <th>Operations</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No leads in system.</td>
                  </tr>
                ) : (
                  leads.map(lead => (
                    <tr key={lead.id}>
                      <td>
                        <strong>{lead.first_name} {lead.last_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📞 {lead.phone} | {lead.email}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nat. ID: {lead.national_id || 'N/A'}</div>
                        {(lead.interested_project || lead.interestedProject) && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: '2px' }}>
                            🏢 Project: {(lead.interested_project || lead.interestedProject).name}
                          </div>
                        )}
                        {lead.budget && (
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-success)', marginTop: '2px' }}>
                            💰 Budget: {parseFloat(lead.budget).toLocaleString()} EGP ({lead.payment_method})
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${lead.current_tier === 'tier_3' ? 'success' : lead.current_tier === 'tier_2' ? 'primary' : 'warning'}`} style={{ marginRight: '6px' }}>
                          {lead.current_tier.toUpperCase()}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Agent: {lead.company_sales_agent?.name || 'Unassigned'}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${lead.status === 'reserved' ? 'success' : lead.status === 'contracted' ? 'info' : 'warning'}`}>
                          {lead.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            onClick={() => handleViewJourney(lead)}
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Milestone style={{ width: '12px', height: '12px' }} /> View Journey
                          </button>
                          
                          {!lead.company_sales_agent_id ? (
                            <button
                              onClick={() => handleAssignToSelf(lead.id)}
                              className="btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            >
                              Assign to Me
                            </button>
                          ) : lead.status !== 'reserved' && lead.status !== 'contracted' ? (
                            <button
                              onClick={() => { setSelectedLeadForBooking(lead); setShowBookingModal(true); }}
                              className="btn-primary"
                              style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                            >
                              Execute Booking
                            </button>
                          ) : lead.status === 'reserved' ? (() => {
                            const txn = transactions.find(t => 
                              t.status === 'confirmed' && (!t.contract || t.contract.status === 'draft') &&
                              ((lead.email && t.client?.email === lead.email) || 
                               (lead.phone && t.client?.phone === lead.phone))
                            );
                            if (txn) {
                              return (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    onClick={() => {
                                      setSelectedReservationForContract(txn);
                                      setBookingUnitId(txn.unit_id);
                                      setBookingEoi(txn.eoi_amount.toString());
                                      setDiscountPercent('0');
                                      const uPrice = parseFloat(txn.unit?.price) || 0;
                                      setDownPayment((uPrice * 0.1).toString());
                                      setMaintenanceCost((uPrice * 0.08).toString());
                                      setShowContractModal(true);
                                    }}
                                    className="btn-primary"
                                    style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
                                  >
                                    إتمام التعاقد / Finalize
                                  </button>
                                  <button
                                    onClick={() => handleCancelBooking(txn.id)}
                                    className="btn-secondary"
                                    style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--color-danger)', borderColor: 'var(--color-danger)', color: '#ffffff' }}
                                  >
                                    إلغاء / Cancel
                                  </button>
                                </div>
                              );
                            }
                            return (
                              <span style={{ color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: 700 }}>
                                Booking Done
                              </span>
                            );
                          })() : (
                            <span style={{ color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: 700 }}>
                              Contracted
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Units and Status Panel */}
        <div className="glass-panel" style={{ padding: '25px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingCart style={{ color: 'var(--color-warning)' }} />
            Inventory Status Configuration
          </h3>
          <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }} className="sidebar-scroll-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Unit ID</th>
                  <th>Compound Project</th>
                  <th>Floor & Type</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {units.map(unit => (
                  <tr key={unit.id}>
                    <td><strong>{unit.unit_number}</strong></td>
                    <td>{unit.project?.name}</td>
                    <td>Floor {unit.floor} ({unit.type})</td>
                    <td><strong>{unit.price?.toLocaleString()} EGP</strong></td>
                    <td>
                      <span className={`badge badge-${
                        unit.status === 'available' ? 'success' :
                        unit.status === 'reserved' ? 'warning' :
                        unit.status === 'sold' ? 'info' : 'danger'
                      }`}>
                        {unit.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => { setSelectedUnit(unit); setUnitStatusInput(unit.status); setShowUnitModal(true); }}
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        Change Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transactions & Audit Logs Panel */}
        <div className="glass-panel" style={{ padding: '25px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ClipboardList style={{ color: 'var(--color-success)' }} />
            Reservations and Contracts Transactions Log
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Reservation ID</th>
                  <th>Client</th>
                  <th>Unit Number</th>
                  <th>EOI Amount</th>
                  <th>Hold Time Remaining</th>
                  <th>Status & Contract</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No bookings executed yet.</td>
                  </tr>
                ) : (
                  transactions.map(txn => {
                    const getHoldTimeRemaining = (expiresAtStr: string, status: string, hasContract: boolean) => {
                      if (hasContract) return 'Contracted';
                      if (status === 'expired') return 'Expired';
                      if (status === 'cancelled') return 'Cancelled';
                      if (!expiresAtStr) return 'N/A';
                      const expiresAt = new Date(expiresAtStr);
                      const diffMs = expiresAt.getTime() - Date.now();
                      if (diffMs <= 0) return 'Expired';
                      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                      if (diffDays > 0) {
                        return `${diffDays}d ${diffHours}h left`;
                      }
                      return `${diffHours}h left`;
                    };

                    const isExpired = txn.status === 'expired' || (!txn.contract && new Date(txn.expires_at).getTime() < Date.now());

                    return (
                      <tr key={txn.id}>
                        <td><span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{txn.id.substring(0, 18)}...</span></td>
                        <td><strong>{txn.client?.name}</strong></td>
                        <td><strong>{txn.unit?.unit_number}</strong> ({txn.unit?.project?.name})</td>
                        <td><strong>{txn.eoi_amount?.toLocaleString()} EGP</strong></td>
                        <td>
                          <span style={{ fontWeight: 600, color: isExpired ? 'var(--color-danger)' : (txn.contract && txn.contract.status !== 'draft') ? 'var(--color-success)' : 'var(--color-warning)' }}>
                            {getHoldTimeRemaining(txn.expires_at, txn.status, txn.contract && txn.contract.status !== 'draft')}
                          </span>
                        </td>
                        <td>
                          {txn.contract ? (
                            <span className={`badge badge-${txn.contract.status === 'active' ? 'success' : 'info'}`}>
                              {txn.contract.status === 'active' ? `Signed: ${txn.contract.contract_number}` : `Draft: ${txn.contract.contract_number}`}
                            </span>
                          ) : isExpired ? (
                            <span className="badge badge-danger">Expired (EOI Refunded)</span>
                          ) : txn.status === 'cancelled' ? (
                            <span className="badge badge-danger">Cancelled</span>
                          ) : (
                            <span className="badge badge-warning">Awaiting Contract (Hold)</span>
                          )}
                        </td>
                        <td>
                          {!isExpired && txn.status === 'confirmed' && (!txn.contract || txn.contract.status === 'draft') && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => {
                                  setSelectedReservationForContract(txn);
                                  setBookingUnitId(txn.unit_id);
                                  setBookingEoi(txn.eoi_amount.toString());
                                  setDiscountPercent('0');
                                  const uPrice = parseFloat(txn.unit?.price) || 0;
                                  setDownPayment((uPrice * 0.1).toString());
                                  setMaintenanceCost((uPrice * 0.08).toString());
                                  setShowContractModal(true);
                                }}
                                className="btn-primary"
                                style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
                              >
                                Finalize Contract
                              </button>
                              <button
                                onClick={() => handleCancelBooking(txn.id)}
                                className="btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--color-danger)', borderColor: 'var(--color-danger)', color: '#ffffff' }}
                              >
                                Cancel Hold
                              </button>
                            </div>
                          )}
                          {(isExpired || txn.status === 'cancelled' || (txn.contract && txn.contract.status !== 'draft')) && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No action available</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* 🧭 TIMELINE CLIENT JOURNEY MODAL */}
      {showJourneyModal && journeyLead && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '600px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
              <h3 style={{ fontWeight: 800 }}>Journey Timeline: {journeyLead.first_name} {journeyLead.last_name}</h3>
              <span className="badge badge-info">{journeyLead.source} source</span>
            </div>

            {/* Broker presentations */}
            {journeyPresentations.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 850, color: 'var(--color-primary)', marginBottom: '8px' }}>Broker Presentations Shown:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                  {journeyPresentations.map(p => (
                    <div key={p.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.4)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5)' }}>
                      <strong>Agency:</strong> {p.broker?.name || 'External'} | <strong>Project:</strong> {p.project?.name}
                      {p.presentation_notes && <p style={{ margin: '4px 0 0 0', fontStyle: 'italic', color: 'var(--text-muted)' }}>Notes: "{p.presentation_notes}"</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Journey Logs */}
            <h4 style={{ fontSize: '0.85rem', fontWeight: 850, color: 'var(--color-primary)', marginBottom: '8px' }}>Audited Transitions Timeline:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', position: 'relative', paddingLeft: '20px', borderLeft: '2px solid rgba(44,62,50,0.1)' }}>
              {journeyLogs.map((log, idx) => (
                <div key={log.id} style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-27px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-primary)', border: '2px solid #ffffff' }} />
                  <div style={{ fontSize: '0.8rem' }}>
                    <strong style={{ textTransform: 'capitalize', color: 'var(--text-main)' }}>{log.stage.replace(/_/g, ' ')}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Done by: {log.actor?.name || 'System'} ({log.actor_role}) on {new Date(log.created_at).toLocaleString()}
                    </div>
                    {log.metadata && renderMetadata(log.metadata)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button className="btn-secondary" onClick={() => { setShowJourneyModal(false); setJourneyLead(null); }}>Close Journey</button>
            </div>
          </div>
        </div>
      )}

      {/* EXECUTE BOOKING MODAL */}
      {showBookingModal && selectedLeadForBooking && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '520px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontWeight: 800 }}>Execute Booking Reservation Hold</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Reserve an inventory unit on hold for <strong>{selectedLeadForBooking.first_name} {selectedLeadForBooking.last_name}</strong>.
            </p>
            <form onSubmit={handleCreateBooking} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {selectedLeadForBooking && (
                <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Client Preferred Method:</span>
                    <strong style={{ textTransform: 'capitalize' }}>{selectedLeadForBooking.payment_method || 'Installment'}</strong>
                  </div>
                  {selectedLeadForBooking.budget && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Client Budget:</span>
                      <strong>{parseFloat(selectedLeadForBooking.budget).toLocaleString()} EGP</strong>
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Select Available Unit</label>
                <select className="form-control" value={bookingUnitId} onChange={e => setBookingUnitId(e.target.value)} required>
                  <option value="">-- Choose Unit --</option>
                  {units.filter(u => u.status === 'available').map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.unit_number} - {unit.price?.toLocaleString()} EGP ({unit.project?.name} / {unit.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>EOI Booking Deposit (EGP) / جدية الحجز</label>
                <input type="number" className="form-control" value={bookingEoi} onChange={e => setBookingEoi(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Holding Duration (Days) / مدة الحجز باليوم</label>
                <input type="number" className="form-control" value={bookingHoldingDays} onChange={e => setBookingHoldingDays(parseInt(e.target.value) || 7)} min="1" max="90" required />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Additional Notes / ملاحظات</label>
                <textarea className="form-control" value={bookingNotes} onChange={e => setBookingNotes(e.target.value)} placeholder="Hold conditions, special requests..." style={{ height: '60px' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => { 
                  setBookingUnitId('');
                  setBookingNotes('');
                  setBookingEoi('50000');
                  setBookingHoldingDays(7);
                  setShowBookingModal(false); 
                  setSelectedLeadForBooking(null); 
                }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}>Confirm Reservation Hold</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FINALIZE CONTRACT MODAL */}
      {showContractModal && selectedReservationForContract && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '640px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontWeight: 800 }}>Finalize Contract & Payment Plan</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Set up the payment plan schedule for unit <strong>{selectedReservationForContract.unit?.unit_number}</strong> ({selectedReservationForContract.unit?.project?.name}).
            </p>
            <form onSubmit={handleFinalizeContract} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }} className="sidebar-scroll-container">
              
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Client:</span>
                  <strong>{selectedReservationForContract.client?.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Unit Base Price:</span>
                  <strong>{parseFloat(selectedReservationForContract.unit?.price || 0).toLocaleString()} EGP</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>EOI Deposit Already Paid:</span>
                  <strong style={{ color: 'var(--color-success)' }}>{parseFloat(selectedReservationForContract.eoi_amount || 0).toLocaleString()} EGP</strong>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Discount Percent (%) / نسبة الخصم</label>
                <input type="number" className="form-control" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} min="0" max="100" placeholder="0" />
              </div>

              {/* Add-ons Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Add-ons / إضافات اختيارية</div>
                
                {/* Club Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', background: 'rgba(255,255,255,0.2)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                    <input type="checkbox" checked={includeClub} onChange={e => setIncludeClub(e.target.checked)} />
                    <span>اشتراك نادي (Club Membership)</span>
                  </label>
                  {includeClub && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cost (EGP)</label>
                          <input type="number" className="form-control" style={{ fontSize: '0.75rem', padding: '4px 8px' }} value={clubCost} onChange={e => setClubCost(e.target.value)} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Payment Method</label>
                          <select className="form-control" style={{ fontSize: '0.75rem', padding: '4px 8px', height: '28px' }} value={clubPaymentMethod} onChange={e => setClubPaymentMethod(e.target.value as 'cash' | 'installment')}>
                            <option value="cash">Cash / كاش</option>
                            <option value="installment">Installment / تقسيط</option>
                          </select>
                        </div>
                      </div>
                      {clubPaymentMethod === 'installment' && (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'center' }}>
                            <div>
                              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Start Year (سنة البدء)</label>
                              <select className="form-control" style={{ fontSize: '0.75rem', padding: '4px 8px', height: '28px' }} value={clubInstallmentStartYear} onChange={e => setClubInstallmentStartYear(parseInt(e.target.value) || 1)}>
                                {Array.from({ length: installmentTerm || 1 }, (_, i) => i + 1).map(yr => (
                                  <option key={yr} value={yr}>Year {yr}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Duration (Years) / مدة التقسيط</label>
                              <select className="form-control" style={{ fontSize: '0.75rem', padding: '4px 8px', height: '28px' }} value={clubTerm} onChange={e => setClubTerm(parseInt(e.target.value))}>
                                {Array.from({ length: 25 }, (_, i) => i + 1).map(yr => (
                                  <option key={yr} value={yr}>{yr} {yr === 1 ? 'Year' : 'Years'}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 650, marginTop: '6px', textAlign: 'right' }}>
                            Monthly: {Math.round((parseFloat(clubCost) || 0) / (clubTerm * 12)).toLocaleString()} EGP (Starting Year {clubInstallmentStartYear})
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Garage Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', background: 'rgba(255,255,255,0.2)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                    <input type="checkbox" checked={includeGarage} onChange={e => setIncludeGarage(e.target.checked)} />
                    <span>جراج (Garage Access)</span>
                  </label>
                  {includeGarage && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cost (EGP)</label>
                          <input type="number" className="form-control" style={{ fontSize: '0.75rem', padding: '4px 8px' }} value={garageCost} onChange={e => setGarageCost(e.target.value)} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Payment Method</label>
                          <select className="form-control" style={{ fontSize: '0.75rem', padding: '4px 8px', height: '28px' }} value={garagePaymentMethod} onChange={e => setGaragePaymentMethod(e.target.value as 'cash' | 'installment')}>
                            <option value="cash">Cash / كاش</option>
                            <option value="installment">Installment / تقسيط</option>
                          </select>
                        </div>
                      </div>
                      {garagePaymentMethod === 'installment' && (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'center' }}>
                            <div>
                              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Start Year (سنة البدء)</label>
                              <select className="form-control" style={{ fontSize: '0.75rem', padding: '4px 8px', height: '28px' }} value={garageInstallmentStartYear} onChange={e => setGarageInstallmentStartYear(parseInt(e.target.value) || 1)}>
                                {Array.from({ length: installmentTerm || 1 }, (_, i) => i + 1).map(yr => (
                                  <option key={yr} value={yr}>Year {yr}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Duration (Years) / مدة التقسيط</label>
                              <select className="form-control" style={{ fontSize: '0.75rem', padding: '4px 8px', height: '28px' }} value={garageTerm} onChange={e => setGarageTerm(parseInt(e.target.value))}>
                                {Array.from({ length: 25 }, (_, i) => i + 1).map(yr => (
                                  <option key={yr} value={yr}>{yr} {yr === 1 ? 'Year' : 'Years'}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 650, marginTop: '6px', textAlign: 'right' }}>
                            Monthly: {Math.round((parseFloat(garageCost) || 0) / (garageTerm * 12)).toLocaleString()} EGP (Starting Year {garageInstallmentStartYear})
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Maintenance Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', background: 'rgba(255,255,255,0.2)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                    <input type="checkbox" checked={includeMaintenance} onChange={e => setIncludeMaintenance(e.target.checked)} />
                    <span>وديعة الصيانة (Maintenance Deposit)</span>
                  </label>
                  {includeMaintenance && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cost (EGP)</label>
                          <input type="number" className="form-control" style={{ fontSize: '0.75rem', padding: '4px 8px' }} value={maintenanceCost} onChange={e => setMaintenanceCost(e.target.value)} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Payment Method</label>
                          <select className="form-control" style={{ fontSize: '0.75rem', padding: '4px 8px', height: '28px' }} value={maintenancePaymentMethod} onChange={e => setMaintenancePaymentMethod(e.target.value as 'cash' | 'installment')}>
                            <option value="cash">Cash / كاش</option>
                            <option value="installment">Installment / تقسيط</option>
                          </select>
                        </div>
                      </div>
                      {maintenancePaymentMethod === 'installment' ? (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'center' }}>
                            <div>
                              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Start Year (سنة البدء)</label>
                              <select className="form-control" style={{ fontSize: '0.75rem', padding: '4px 8px', height: '28px' }} value={maintenanceInstallmentStartYear} onChange={e => setMaintenanceInstallmentStartYear(parseInt(e.target.value) || 1)}>
                                {Array.from({ length: installmentTerm || 1 }, (_, i) => i + 1).map(yr => (
                                  <option key={yr} value={yr}>Year {yr}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Duration (Years) / مدة التقسيط</label>
                              <select className="form-control" style={{ fontSize: '0.75rem', padding: '4px 8px', height: '28px' }} value={maintenanceTerm} onChange={e => setMaintenanceTerm(parseInt(e.target.value))}>
                                {Array.from({ length: 25 }, (_, i) => i + 1).map(yr => (
                                  <option key={yr} value={yr}>{yr} {yr === 1 ? 'Year' : 'Years'}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 650, marginTop: '6px', textAlign: 'right' }}>
                            Monthly: {Math.round((parseFloat(maintenanceCost) || 0) / (maintenanceTerm * 12)).toLocaleString()} EGP (Starting Year {maintenanceInstallmentStartYear})
                          </div>
                        </>
                      ) : (
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Due Month (الشهر المستحق)</label>
                          <input type="number" className="form-control" style={{ fontSize: '0.75rem', padding: '4px 8px' }} value={maintenanceDueMonth} onChange={e => setMaintenanceDueMonth(parseInt(e.target.value) || 0)} min="0" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Custom Add-ons Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>Custom Add-ons / إضافات مخصصة</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomAddons(prev => [
                          ...prev,
                          {
                            id: Math.random().toString(36).substring(2, 9),
                            name: `Custom Add-on #${prev.length + 1}`,
                            cost: '',
                            paymentMethod: 'cash',
                            term: 5,
                            startYear: 1
                          }
                        ]);
                      }}
                      className="btn-secondary"
                      style={{ padding: '2px 8px', fontSize: '0.68rem', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(50, 71, 58, 0.2)' }}
                    >
                      + Add New / إضافة
                    </button>
                  </div>

                  {customAddons.map((addon, idx) => (
                    <div key={addon.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', background: 'rgba(255,255,255,0.2)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="form-control"
                          style={{ fontSize: '0.75rem', padding: '2px 6px', height: '24px', width: '70%', fontWeight: 700 }}
                          value={addon.name}
                          onChange={e => {
                            const val = e.target.value;
                            setCustomAddons(prev => prev.map(a => a.id === addon.id ? { ...a, name: val } : a));
                          }}
                          placeholder="Add-on Name / الاسم"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCustomAddons(prev => prev.filter(a => a.id !== addon.id));
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 750 }}
                        >
                          ✕ Remove
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cost (EGP)</label>
                          <input
                            type="number"
                            className="form-control"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            value={addon.cost}
                            onChange={e => {
                              const val = e.target.value;
                              setCustomAddons(prev => prev.map(a => a.id === addon.id ? { ...a, cost: val } : a));
                            }}
                            placeholder="Cost"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Payment Method</label>
                          <select
                            className="form-control"
                            style={{ fontSize: '0.75rem', padding: '4px 8px', height: '28px' }}
                            value={addon.paymentMethod}
                            onChange={e => {
                              const val = e.target.value as 'cash' | 'installment';
                              setCustomAddons(prev => prev.map(a => a.id === addon.id ? { ...a, paymentMethod: val } : a));
                            }}
                          >
                            <option value="cash">Cash / كاش</option>
                            <option value="installment">Installment / تقسيط</option>
                          </select>
                        </div>
                      </div>

                      {addon.paymentMethod === 'installment' && (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'center' }}>
                            <div>
                              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Start Year (سنة البدء)</label>
                              <select
                                className="form-control"
                                style={{ fontSize: '0.75rem', padding: '4px 8px', height: '28px' }}
                                value={addon.startYear}
                                onChange={e => {
                                  const val = parseInt(e.target.value) || 1;
                                  setCustomAddons(prev => prev.map(a => a.id === addon.id ? { ...a, startYear: val } : a));
                                }}
                              >
                                {Array.from({ length: installmentTerm || 1 }, (_, i) => i + 1).map(yr => (
                                  <option key={yr} value={yr}>Year {yr}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Duration (Years) / مدة التقسيط</label>
                              <select
                                className="form-control"
                                style={{ fontSize: '0.75rem', padding: '4px 8px', height: '28px' }}
                                value={addon.term}
                                onChange={e => {
                                  const val = parseInt(e.target.value) || 1;
                                  setCustomAddons(prev => prev.map(a => a.id === addon.id ? { ...a, term: val } : a));
                                }}
                              >
                                {Array.from({ length: 25 }, (_, i) => i + 1).map(yr => (
                                  <option key={yr} value={yr}>{yr} {yr === 1 ? 'Year' : 'Years'}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 650, marginTop: '6px', textAlign: 'right' }}>
                            Monthly: {Math.round((parseFloat(addon.cost) || 0) / (addon.term * 12)).toLocaleString()} EGP (Starting Year {addon.startYear})
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Finalized Payment Method</label>
                <select className="form-control" value={finalPaymentMethod} onChange={e => setFinalPaymentMethod(e.target.value as 'cash' | 'installment')}>
                  <option value="installment">Installment Plan (تقسيط)</option>
                  <option value="cash">Full Cash Payment (كاش)</option>
                </select>
              </div>

              {finalPaymentMethod === 'cash' && (
                <>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>Cash Grace Period (Days) / مهلة سداد الكاش</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={cashGracePeriod} 
                      onChange={e => setCashGracePeriod(parseInt(e.target.value) || 0)} 
                      min="1" 
                      max="365"
                    />
                  </div>
                </>
              )}

              {finalPaymentMethod === 'installment' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group" style={{ marginBottom: '10px' }}>
                      <label className="form-label" style={{ fontWeight: 700 }}>Installment Type</label>
                      <select className="form-control" value={installmentType} onChange={e => setInstallmentType(e.target.value as 'direct' | 'bank')}>
                        <option value="direct">Direct Installment (مباشر)</option>
                        <option value="bank">Bank Finance (تمويل بنكي)</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '10px' }}>
                      <label className="form-label" style={{ fontWeight: 700 }}>Interest Type</label>
                      <select className="form-control" value={interestType} onChange={e => setInterestType(e.target.value as 'flat' | 'reducing')}>
                        <option value="reducing">Reducing Balance (متناقصة)</option>
                        <option value="flat">Flat Balance (ثابتة)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group" style={{ marginBottom: '10px' }}>
                      <label className="form-label" style={{ fontWeight: 700 }}>Term (Years)</label>
                      <select className="form-control" value={installmentTerm} onChange={e => setInstallmentTerm(parseInt(e.target.value))}>
                        {Array.from({ length: 25 }, (_, i) => i + 1).map(yr => (
                          <option key={yr} value={yr}>{yr} {yr === 1 ? 'Year' : 'Years'}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '10px' }}>
                      <label className="form-label" style={{ fontWeight: 700 }}>Interest Rate (% p.a.)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={installmentInterest} 
                        onChange={e => setInstallmentInterest(parseFloat(e.target.value) || 0)} 
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>Installment Start Month (بدء الأقساط من الشهر)</label>
                    <select className="form-control" value={installmentStartMonth} onChange={e => setInstallmentStartMonth(parseInt(e.target.value) || 1)}>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>Month {m} {m === 1 ? '(Next Month)' : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>Down Payment (EGP) / دفعة مقدمة</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={downPayment} 
                      onChange={e => setDownPayment(e.target.value)} 
                      placeholder="e.g. 500000"
                      required
                    />
                  </div>
                </>
              )}

              {/* Dynamic Chronological Payment Schedule Preview */}
              {bookingUnitId && (
                <div style={{ marginTop: '10px', padding: '12px', background: 'rgba(255, 255, 255, 0.4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', justifyItems: 'center', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 800, margin: 0, color: 'var(--color-primary)' }}>📅 جدول الدفعات المقترح (Chronological Schedule)</h4>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button type="button" onClick={handlePrintSchedule} className="btn-secondary" style={{ padding: '3px 8px', fontSize: '0.68rem', borderRadius: 'var(--radius-xs)' }}>
                        🖨️ Print Plan
                      </button>
                      <button type="button" onClick={handleDownloadCSV} className="btn-secondary" style={{ padding: '3px 8px', fontSize: '0.68rem', borderRadius: 'var(--radius-xs)' }}>
                        📥 Download CSV
                      </button>
                    </div>
                  </div>

                  <div style={{ maxHeight: '180px', overflowY: 'auto', marginTop: '10px', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-xs)' }} className="sidebar-scroll-container">
                    <table className="premium-table" style={{ fontSize: '0.72rem', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Description</th>
                          <th>Due Date</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                          <th style={{ textAlign: 'right' }}>% Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generatePaymentSchedule().map((item, idx) => (
                          <tr key={idx} style={{ background: item.month === 0 ? 'rgba(16,185,129,0.05)' : (item.month % 2 === 0 ? 'rgba(0,0,0,0.01)' : 'transparent') }}>
                            <td><strong>Month {item.month}</strong></td>
                            <td>{item.label}</td>
                            <td>{item.dueDate}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.amount.toLocaleString()} EGP</td>
                            <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{(item.percentage || 0).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Additional Deal Notes</label>
                <textarea className="form-control" value={bookingNotes} onChange={e => setBookingNotes(e.target.value)} placeholder="Agreed installment dates, grace periods, etc..." style={{ height: '60px' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => { 
                  setBookingUnitId('');
                  setBookingNotes('');
                  setDiscountPercent('0');
                  setDownPayment('');
                  setIncludeClub(false);
                  setIncludeGarage(false);
                  setIncludeMaintenance(false);
                  setCustomAddons([]);
                  setShowContractModal(false); 
                  setSelectedReservationForContract(null); 
                }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }} disabled={finalPaymentMethod === 'installment' && Math.abs(yearPercentages.reduce((s, p) => s + p, 0) - 100) > 0.01}>Confirm & Generate Contract</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* UPDATE UNIT STATUS MODAL */}
      {showUnitModal && selectedUnit && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '400px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontWeight: 800 }}>Configure Unit Status: {selectedUnit.unit_number}</h3>
            <form onSubmit={handleUpdateUnitStatus} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Unit Status</label>
                <select className="form-control" value={unitStatusInput} onChange={e => setUnitStatusInput(e.target.value)}>
                  <option value="available">Available (Open for sale)</option>
                  <option value="reserved">Reserved (Locked for client)</option>
                  <option value="sold">Sold (Ownership transferred)</option>
                  <option value="blocked">Blocked (Under maintenance/hold)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status Change Reason</label>
                <input type="text" className="form-control" value={unitStatusReason} onChange={e => setUnitStatusReason(e.target.value)} placeholder="e.g. CEO manual hold" />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowUnitModal(false); setSelectedUnit(null); }}>Cancel</button>
                <button type="submit" className="btn-primary">Update Status</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⚠️ CUSTOM CONFIRMATION MODAL */}
      {confirmDialog.show && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }}>
          <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '450px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '15px', border: '1px solid rgba(239, 68, 68, 0.2)', boxShadow: '0 8px 32px rgba(239, 68, 68, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-danger)' }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <h3 style={{ fontWeight: 800, margin: 0, fontSize: '1.15rem' }}>{confirmDialog.title}</h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
              {confirmDialog.message}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setConfirmDialog(prev => ({ ...prev, show: false }))}
                style={{ minWidth: '80px' }}
              >
                Cancel / تراجع
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={confirmDialog.onConfirm}
                style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger)', color: '#ffffff', minWidth: '100px' }}
              >
                Confirm / تأكيد إلغاء الحجز
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};


export default CompanySalesPortal;
