'use client'

import React, {Component, ReactNode} from 'react'
import {AlertTriangle, RefreshCw} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {useTranslations} from '@/lib/translations/context'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorFallbackProps {
  error?: Error
  onRetry: () => void
}

interface State {
  hasError: boolean
  error?: Error
}

// Functional component for error display that can use hooks
function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  const t = useTranslations('errors.generic')
  const tCommon = useTranslations('common')

  return (
    <Card className="p-6 m-4 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
      <div className="flex items-center space-x-3 mb-4">
        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
          {t('somethingWentWrong')}
        </h3>
      </div>
      
      <p className="text-red-800 dark:text-red-200 mb-4">
        {t('unexpectedError')}
      </p>
      
      {error && (
        <details className="mb-4">
          <summary className="text-sm text-red-700 dark:text-red-300 cursor-pointer hover:underline">
            {t('technicalDetails')}
          </summary>
          <pre className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-2 rounded overflow-auto">
            {error.message}
            {error.stack && '\n\n' + error.stack}
          </pre>
        </details>
      )}
      
      <div className="flex space-x-2">
        <Button 
          onClick={onRetry}
          className="bg-red-600 hover:bg-red-700 text-white"
          size="sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {tCommon('retry')}
        </Button>
        
        <Button 
          onClick={() => window.location.reload()}
          variant="outline"
          size="sm"
        >
          {t('reloadPage')}
        </Button>
      </div>
    </Card>
  )
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Use the functional component with translations
      return (
        <ErrorFallback 
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      )
    }

    return this.props.children
  }
}

// Hook version for functional components that need error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}