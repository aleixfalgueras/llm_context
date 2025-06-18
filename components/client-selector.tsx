'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, Search, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface ClientSelectorProps {
  clients: any[]
  selectedClientId: string | null
  onClientSelect: (clientId: string | null) => void
  placeholder?: string
  className?: string
}

export function ClientSelector({
  clients,
  selectedClientId,
  onClientSelect,
  placeholder = "Select client...",
  className
}: ClientSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const selectedClient = clients.find(client => client.id === selectedClientId)
  
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (clientId: string | null) => {
    onClientSelect(clientId)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={cn("w-full justify-between min-w-0", className)}
        >
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
            <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate text-xs sm:text-sm">
              {selectedClient ? selectedClient.name : placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[240px] sm:w-[300px] p-0">
        <div className="flex items-center border-b px-2 sm:px-3">
          <Search className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs sm:text-sm"
          />
        </div>
        <div className="max-h-[160px] sm:max-h-[200px] overflow-auto">
          <DropdownMenuItem
            onSelect={() => handleSelect(null)}
            className="px-2 py-1.5 sm:px-3 sm:py-2"
          >
            <Check
              className={cn(
                "mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4",
                selectedClientId === null ? "opacity-100" : "opacity-0"
              )}
            />
            <span className="text-xs sm:text-sm">All clients</span>
          </DropdownMenuItem>
          
          {filteredClients.length === 0 ? (
            <div className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-muted-foreground">
              {searchTerm ? 'No clients found' : 'No clients available'}
            </div>
          ) : (
            filteredClients.map((client) => (
              <DropdownMenuItem
                key={client.id}
                onSelect={() => handleSelect(client.id)}
                className="px-2 py-1.5 sm:px-3 sm:py-2"
              >
                <Check
                  className={cn(
                    "mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4",
                    selectedClientId === client.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm truncate">{client.name}</span>
                  {client.email && (
                    <span className="text-xs text-muted-foreground truncate">
                      {client.email}
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 