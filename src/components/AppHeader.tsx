import React from 'react'

export const AppHeader: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold">DiveTools</h1>
        </div>
        <div className="flex items-center gap-4">
        </div>
      </div>
    </header>
  )
}

