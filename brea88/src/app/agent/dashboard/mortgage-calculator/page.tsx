'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calculator,
  CalendarDays,
  CircleDollarSign,
  Landmark,
  Percent,
  WalletCards,
} from 'lucide-react';

type FinancingType = 'bank' | 'pagibig';

export default function MortgageCalculatorPage() {
  const [financingType, setFinancingType] =
    useState<FinancingType>('bank');

  const [propertyPrice, setPropertyPrice] =
    useState('5000000');

  const [downPayment, setDownPayment] =
    useState('1000000');

  const [bankInterestRate, setBankInterestRate] =
    useState('6.50');

  const [pagibigInterestRate, setPagibigInterestRate] =
    useState('5.75');

  const [loanTerm, setLoanTerm] =
    useState('20');

  const interestRate =
    financingType === 'bank'
      ? bankInterestRate
      : pagibigInterestRate;

  /*
   * Remove commas and peso signs before calculations.
   */
  const parseNumber = (value: string) => {
    const cleaned = value.replace(/[₱,\s]/g, '');

    const parsed = Number(cleaned);

    return Number.isFinite(parsed) ? parsed : 0;
  };

  /*
   * Format Philippine Peso.
   */
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.max(value, 0));
  };

  /*
   * Format numbers with commas.
   *
   * Example:
   * 5000000 -> 5,000,000
   * 12500000 -> 12,500,000
   */
  const formatInputNumber = (value: string) => {
    const cleaned = value.replace(/[₱,\s]/g, '');

    if (!/^\d*\.?\d*$/.test(cleaned)) {
      return '';
    }

    if (!cleaned) {
      return '';
    }

    const [integerPart, decimalPart] =
      cleaned.split('.');

    const formattedInteger =
      Number(integerPart || '0').toLocaleString(
        'en-PH',
      );

    if (decimalPart !== undefined) {
      return `${formattedInteger}.${decimalPart.slice(
        0,
        2,
      )}`;
    }

    return formattedInteger;
  };

  /*
   * Store the raw numeric value while displaying
   * the formatted value.
   */
  const handleMoneyChange = (
    value: string,
    setter: (value: string) => void,
  ) => {
    const cleaned = value.replace(/[₱,\s]/g, '');

    if (!/^\d*\.?\d*$/.test(cleaned)) {
      return;
    }

    setter(cleaned);
  };

  /*
   * Interest rate input.
   */
  const handleInterestChange = (
    value: string,
    setter: (value: string) => void,
  ) => {
    const cleaned = value.replace(/[%\s]/g, '');

    if (!/^\d*\.?\d*$/.test(cleaned)) {
      return;
    }

    setter(cleaned);
  };

  const calculation = useMemo(() => {
    const price = parseNumber(propertyPrice);
    const down = parseNumber(downPayment);
    const annualRate = parseNumber(interestRate);
    const years = parseNumber(loanTerm);

    const loanAmount = Math.max(price - down, 0);

    const monthlyRate =
      annualRate / 100 / 12;

    const numberOfPayments =
      years * 12;

    let monthlyPayment = 0;

    if (
      loanAmount > 0 &&
      numberOfPayments > 0
    ) {
      if (monthlyRate === 0) {
        monthlyPayment =
          loanAmount / numberOfPayments;
      } else {
        monthlyPayment =
          (loanAmount *
            monthlyRate *
            Math.pow(
              1 + monthlyRate,
              numberOfPayments,
            )) /
          (Math.pow(
            1 + monthlyRate,
            numberOfPayments,
          ) - 1);
      }
    }

    const totalPayment =
      monthlyPayment * numberOfPayments;

    const totalInterest =
      Math.max(
        totalPayment - loanAmount,
        0,
      );

    const downPaymentPercentage =
      price > 0
        ? (down / price) * 100
        : 0;

    const loanPercentage =
      price > 0
        ? (loanAmount / price) * 100
        : 0;

    const estimatedRequiredIncome =
    monthlyPayment > 0
        ? monthlyPayment / 0.30
        : 0;

    return {
        price,
        down,
        annualRate,
        years,
        loanAmount,
        monthlyPayment,
        estimatedRequiredIncome,
        totalPayment,
        totalInterest,
        downPaymentPercentage,
        loanPercentage,
        };
  }, [
    propertyPrice,
    downPayment,
    interestRate,
    loanTerm,
  ]);

  const currentRate =
    parseNumber(interestRate);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/agent/dashboard"
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </Link>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
                  <Calculator size={21} />
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Agent Finance Tool
                  </p>

                  <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                    Mortgage Calculator
                  </h1>
                </div>
              </div>

              <p className="max-w-2xl text-sm leading-6 text-slate-500">
                Estimate monthly mortgage payments for
                property buyers using Bank or Pag-IBIG
                financing.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          {/* Calculator Form */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Financing Details
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-900">
                Loan Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Enter the buyer's property and financing
                information.
              </p>
            </div>

            {/* Financing Type */}
            <div className="mb-7">
              <label className="mb-3 block text-sm font-bold text-slate-700">
                Financing Type
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFinancingType('bank')
                  }
                  className={`group rounded-2xl border p-4 text-left transition ${
                    financingType === 'bank'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Landmark
                    size={20}
                    className={
                      financingType === 'bank'
                        ? 'text-white'
                        : 'text-slate-400'
                    }
                  />

                  <p className="mt-3 text-sm font-black">
                    Bank Financing
                  </p>

                  <p
                    className={`mt-1 text-[11px] leading-4 ${
                      financingType === 'bank'
                        ? 'text-slate-400'
                        : 'text-slate-400'
                    }`}
                  >
                    Flexible bank loan options
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFinancingType('pagibig')
                  }
                  className={`group rounded-2xl border p-4 text-left transition ${
                    financingType === 'pagibig'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <WalletCards
                    size={20}
                    className={
                      financingType === 'pagibig'
                        ? 'text-white'
                        : 'text-slate-400'
                    }
                  />

                  <p className="mt-3 text-sm font-black">
                    Pag-IBIG Financing
                  </p>

                  <p
                    className={`mt-1 text-[11px] leading-4 ${
                      financingType === 'pagibig'
                        ? 'text-slate-400'
                        : 'text-slate-400'
                    }`}
                  >
                    Government housing financing
                  </p>
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {/* Property Price */}
              <div>
                <label
                  htmlFor="propertyPrice"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Property Price
                </label>

                <div className="relative">
                  <CircleDollarSign
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <span className="absolute left-11 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    ₱
                  </span>

                  <input
                    id="propertyPrice"
                    type="text"
                    inputMode="decimal"
                    value={
                      propertyPrice
                        ? formatInputNumber(
                            propertyPrice,
                          )
                        : ''
                    }
                    onChange={(e) =>
                      handleMoneyChange(
                        e.target.value,
                        setPropertyPrice,
                      )
                    }
                    placeholder="Input price"
                    className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-16 pr-4 text-sm font-bold text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
                  />
                </div>

                <p className="mt-2 text-xs font-medium text-slate-400">
                  Example: ₱5,000,000.00
                </p>
              </div>

              {/* Down Payment */}
              <div>
                <label
                  htmlFor="downPayment"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Down Payment
                </label>

                <div className="relative">
                  <WalletCards
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <span className="absolute left-11 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    ₱
                  </span>

                  <input
                    id="downPayment"
                    type="text"
                    inputMode="decimal"
                    value={
                      downPayment
                        ? formatInputNumber(
                            downPayment,
                          )
                        : ''
                    }
                    onChange={(e) =>
                      handleMoneyChange(
                        e.target.value,
                        setDownPayment,
                      )
                    }
                    placeholder="1,000,000.00"
                    className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-16 pr-4 text-sm font-bold text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
                  />
                </div>

                <div className="mt-2 flex justify-between text-xs font-medium text-slate-400">
                  <span>Down payment percentage</span>

                  <span className="font-bold text-slate-600">
                    {calculation.downPaymentPercentage.toFixed(
                      2,
                    )}
                    %
                  </span>
                </div>
              </div>

              {/* Interest Rate */}
              <div>
                <label
                  htmlFor="interestRate"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  {financingType === 'bank'
                    ? 'Bank Interest Rate'
                    : 'Pag-IBIG Interest Rate'}
                </label>

                <div className="relative">
                  <Percent
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="interestRate"
                    type="text"
                    inputMode="decimal"
                    value={interestRate}
                    onChange={(e) =>
                      handleInterestChange(
                        e.target.value,
                        financingType === 'bank'
                          ? setBankInterestRate
                          : setPagibigInterestRate,
                      )
                    }
                    placeholder="6.50"
                    className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm font-bold text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    %
                  </span>
                </div>

                <p className="mt-2 text-xs font-medium text-slate-400">
                  Current calculation rate:{' '}
                  {currentRate.toFixed(2)}%
                </p>
              </div>

              {/* Loan Term */}
              <div>
                <label
                  htmlFor="loanTerm"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Loan Term
                </label>

                <div className="relative">
                  <CalendarDays
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    id="loanTerm"
                    value={loanTerm}
                    onChange={(e) =>
                      setLoanTerm(e.target.value)
                    }
                    className="h-13 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
                  >
                    <option value="5">
                      5 years
                    </option>

                    <option value="10">
                      10 years
                    </option>

                    <option value="15">
                      15 years
                    </option>

                    <option value="20">
                      20 years
                    </option>

                    <option value="25">
                      25 years
                    </option>

                    <option value="30">
                      30 years
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Results */}
          <section className="overflow-hidden rounded-3xl bg-slate-900 shadow-xl">
            <div className="p-5 sm:p-7">
              {/* Result Header */}
              <div className="mb-7">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  {financingType === 'bank'
                    ? 'Bank Financing'
                    : 'Pag-IBIG Financing'}
                </p>

                <h2 className="mt-1 text-xl font-black text-white">
                  Mortgage Summary
                </h2>
              </div>

              {/* Monthly Payment */}
              <div className="rounded-3xl bg-white p-6 shadow-xl sm:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Estimated Monthly Payment
                </p>

                <p className="mt-3 break-words text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  {formatCurrency(
                    calculation.monthlyPayment,
                  )}
                </p>

                <p className="mt-2 text-xs font-medium text-slate-400">
                  Estimated principal + interest
                </p>
              </div>

                <div className="mt-3 rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Estimated Monthly Required Income
                </p>

                <p className="mt-2 break-words text-2xl font-black tracking-tight text-white sm:text-3xl">
                    {formatCurrency(
                    calculation.estimatedRequiredIncome,
                    )}
                </p>

                <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
                    Based on an estimated 30% monthly payment-to-income ratio
                </p>
                </div>
                
              {/* Loan Summary */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-4">
                  <span className="text-sm font-medium text-slate-400">
                    Property Price
                  </span>

                  <span className="text-right text-sm font-black text-white">
                    {formatCurrency(
                      calculation.price,
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-4">
                  <span className="text-sm font-medium text-slate-400">
                    Down Payment
                  </span>

                  <span className="text-right text-sm font-black text-white">
                    {formatCurrency(
                      calculation.down,
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-4">
                  <span className="text-sm font-medium text-slate-400">
                    Loan Amount
                  </span>

                  <span className="text-right text-sm font-black text-white">
                    {formatCurrency(
                      calculation.loanAmount,
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-4">
                  <span className="text-sm font-medium text-slate-400">
                    Interest Rate
                  </span>

                  <span className="text-right text-sm font-black text-white">
                    {calculation.annualRate.toFixed(
                      2,
                    )}
                    %
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-4">
                  <span className="text-sm font-medium text-slate-400">
                    Loan Term
                  </span>

                  <span className="text-right text-sm font-black text-white">
                    {calculation.years} years
                  </span>
                </div>
              </div>

              {/* Loan Ratio */}
              <div className="mt-5 rounded-2xl border border-white/10 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Loan-to-Value
                  </span>

                  <span className="text-sm font-black text-white">
                    {calculation.loanPercentage.toFixed(
                      2,
                    )}
                    %
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        Math.max(
                          calculation.loanPercentage,
                          0,
                        ),
                        100,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Totals */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Total Interest
                  </p>

                  <p className="mt-2 text-base font-black text-white">
                    {formatCurrency(
                      calculation.totalInterest,
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Total Payment
                  </p>

                  <p className="mt-2 text-base font-black text-white">
                    {formatCurrency(
                      calculation.totalPayment,
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="border-t border-white/10 px-5 py-5 sm:px-7">
              <p className="text-[11px] leading-5 text-slate-500">
                This calculator provides an estimate for
                principal and interest only. Actual loan
                approval, interest rates, fees, insurance,
                taxes, and financing terms may vary depending
                on the lender and buyer qualifications.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

