import type { DashboardData } from '../types'

// const API_BASE_URL = '/api'  // TODO: Use this when connecting to real backend

export async function fetchDashboardData(): Promise<DashboardData> {
  // For now, return mock data
  // In production, this would fetch from the backend API
  return getMockDashboardData()
}

function getMockDashboardData(): DashboardData {
  return {
    overview: {
      cashBalance: 45280,
      totalInvestments: 128500,
      totalDebt: 32450,
      netWorth: 141330,
      changes: {
        cashBalance: 2.5,
        totalInvestments: 5.8,
        totalDebt: -1.2,
        netWorth: 4.3,
      },
    },
    accounts: [
      { id: '1', name: 'Chase Checking', type: 'checking', balance: 12500, currency: 'USD' },
      { id: '2', name: 'Ally Savings', type: 'savings', balance: 28000, currency: 'USD' },
      { id: '3', name: 'Emergency Fund', type: 'savings', balance: 4780, currency: 'USD' },
    ],
    investments: [
      {
        id: '1',
        type: 'stocks',
        name: 'Stock Portfolio',
        value: 85000,
        gain: 12500,
        gainPercentage: 17.2,
      },
      {
        id: '2',
        type: 'bonds',
        name: 'Treasury Bonds',
        value: 25000,
        gain: 1200,
        gainPercentage: 5.0,
      },
      {
        id: '3',
        type: 'real_estate',
        name: 'REIT Holdings',
        value: 15000,
        gain: -500,
        gainPercentage: -3.2,
      },
      {
        id: '4',
        type: 'crypto',
        name: 'Crypto Portfolio',
        value: 3500,
        gain: 800,
        gainPercentage: 29.6,
      },
    ],
    debts: [
      {
        id: '1',
        name: 'Credit Card A',
        type: 'short_term',
        balance: 2450,
        interestRate: 18.99,
        minimumPayment: 75,
        dueDate: '2025-11-25',
      },
      {
        id: '2',
        name: 'Car Loan',
        type: 'long_term',
        balance: 18000,
        interestRate: 4.5,
        minimumPayment: 450,
        dueDate: '2025-11-15',
      },
      {
        id: '3',
        name: 'Student Loan',
        type: 'long_term',
        balance: 12000,
        interestRate: 5.8,
        minimumPayment: 180,
        dueDate: '2025-11-20',
      },
    ],
    creditCards: [
      {
        id: '1',
        name: 'Chase Sapphire',
        balance: 2450,
        creditLimit: 10000,
        minimumPayment: 75,
        dueDate: '2025-11-25',
        utilizationPercentage: 24.5,
      },
      {
        id: '2',
        name: 'Amex Gold',
        balance: 1200,
        creditLimit: 5000,
        minimumPayment: 35,
        dueDate: '2025-11-20',
        utilizationPercentage: 24.0,
      },
      {
        id: '3',
        name: 'Citi Double Cash',
        balance: 500,
        creditLimit: 8000,
        minimumPayment: 25,
        dueDate: '2025-11-18',
        utilizationPercentage: 6.25,
      },
    ],
    cashFlow: [
      { month: 'May', income: 8500, expenses: 5200 },
      { month: 'Jun', income: 8500, expenses: 4800 },
      { month: 'Jul', income: 9200, expenses: 5100 },
      { month: 'Aug', income: 8500, expenses: 5400 },
      { month: 'Sep', income: 8800, expenses: 4900 },
      { month: 'Oct', income: 8500, expenses: 5300 },
    ],
    expenseCategories: [
      { category: 'Housing', amount: 2000, percentage: 38 },
      { category: 'Food', amount: 800, percentage: 15 },
      { category: 'Transportation', amount: 600, percentage: 11 },
      { category: 'Utilities', amount: 300, percentage: 6 },
      { category: 'Entertainment', amount: 400, percentage: 8 },
      { category: 'Shopping', amount: 500, percentage: 10 },
      { category: 'Healthcare', amount: 250, percentage: 5 },
      { category: 'Other', amount: 350, percentage: 7 },
    ],
    notifications: [
      {
        id: '1',
        type: 'bill',
        title: 'Credit Card Payment Due',
        message: 'Chase Sapphire payment of $75 due in 3 days',
        date: '2025-11-22',
        priority: 'high',
        read: false,
      },
      {
        id: '2',
        type: 'alert',
        title: 'High Credit Utilization',
        message: 'Your Chase Sapphire is at 24.5% utilization',
        date: '2025-11-12',
        priority: 'medium',
        read: false,
      },
      {
        id: '3',
        type: 'payment',
        title: 'Car Loan Payment Scheduled',
        message: 'Automatic payment of $450 scheduled for Nov 15',
        date: '2025-11-10',
        priority: 'low',
        read: true,
      },
      {
        id: '4',
        type: 'bill',
        title: 'Citi Double Cash Due Soon',
        message: 'Minimum payment of $25 due Nov 18',
        date: '2025-11-12',
        priority: 'medium',
        read: false,
      },
    ],
  }
}
