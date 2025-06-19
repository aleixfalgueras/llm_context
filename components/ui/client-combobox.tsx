"use client"

import * as React from "react"
import { Check, ChevronsUpDown, User } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Client {
  id: string
  name: string
  email?: string
}

interface ClientComboboxProps {
  clients: Client[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  required?: boolean
}

export function ClientCombobox({
  clients,
  value,
  onValueChange,
  placeholder = "Choose a client",
  searchPlaceholder = "Search clients...",
  emptyMessage = "No clients found.",
  disabled = false,
  required = false
}: ClientComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedClient = clients.find((client) => client.id === value)

  const getPlaceholderText = () => {
    if (clients.length === 0) return "No clients available"
    if (selectedClient) return selectedClient.name
    return placeholder
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <span className="truncate">{getPlaceholderText()}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={`${client.name} ${client.email || ''}`}
                  onSelect={() => {
                    onValueChange?.(client.id === value ? "" : client.id)
                    setOpen(false)
                  }}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <User className="h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <span className="truncate">{client.name}</span>
                      {client.email && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({client.email})
                        </span>
                      )}
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4",
                      value === client.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 