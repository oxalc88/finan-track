import { format } from 'date-fns'

export default function DashboardHeader(): JSX.Element {
  const today = new Date()

  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm">
      <div className="max-w-container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Financial Dashboard</h1>
            <p className="text-neutral-600 mt-1">{format(today, 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors">
              Export
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                U
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
