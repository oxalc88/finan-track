import { useNavigate } from 'react-router-dom'

interface MobileHeaderProps {
  title: string
  showBack?: boolean
}

export default function MobileHeader({ title, showBack = false }: MobileHeaderProps): JSX.Element {
  const navigate = useNavigate()

  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm sticky top-0 z-10">
      <div className="px-4 py-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 active:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <svg
                className="w-6 h-6 text-neutral-700"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
                role="img"
                aria-hidden="true"
              >
                <title>Back arrow</title>
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
        </div>
      </div>
    </header>
  )
}
