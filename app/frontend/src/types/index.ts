export interface Account {
  id: string
  name: string
  type: 'checking' | 'savings' | 'investment'
  balance: number
  currency: string
}

export interface Investment {
  id: string
  type: 'stocks' | 'bonds' | 'real_estate' | 'crypto'
  name: string
  value: number
  gain: number
  gainPercentage: number
}

export interface Debt {
  id: string
  name: string
  type: 'short_term' | 'long_term'
  balance: number
  interestRate: number
  minimumPayment: number
  dueDate: string
}

export interface CreditCard {
  id: string
  name: string
  balance: number
  creditLimit: number
  minimumPayment: number
  dueDate: string
  utilizationPercentage: number
}

export interface CashFlowData {
  month: string
  income: number
  expenses: number
}

export interface ExpenseCategory {
  category: string
  amount: number
  percentage: number
}

export interface Notification {
  id: string
  type: 'bill' | 'payment' | 'alert'
  title: string
  message: string
  date: string
  priority: 'low' | 'medium' | 'high'
  read: boolean
}

export interface DashboardData {
  overview: {
    cashBalance: number
    totalInvestments: number
    totalDebt: number
    netWorth: number
    changes: {
      cashBalance: number
      totalInvestments: number
      totalDebt: number
      netWorth: number
    }
  }
  accounts: Account[]
  investments: Investment[]
  debts: Debt[]
  creditCards: CreditCard[]
  cashFlow: CashFlowData[]
  expenseCategories: ExpenseCategory[]
  notifications: Notification[]
}
