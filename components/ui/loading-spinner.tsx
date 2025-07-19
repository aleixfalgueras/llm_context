interface LoadingSpinnerProps {
  text?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ 
  text = 'Loading...', 
  size = 'md',
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-6 h-6'
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} border-2 border-white border-t-transparent rounded-full animate-spin`}></div>
      {text}
    </div>
  )
}