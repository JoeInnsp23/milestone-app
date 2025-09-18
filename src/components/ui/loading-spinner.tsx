interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3',
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-solid border-gray-300 border-t-transparent`}
        style={{
          borderTopColor: 'transparent',
          borderRightColor: '#d1d5db',
          borderBottomColor: '#d1d5db',
          borderLeftColor: '#d1d5db',
        }}
      />
    </div>
  );
}