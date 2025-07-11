"use client"

import * as React from "react"
import { Check, ChevronsUpDown, FileText } from "lucide-react"

import { cn } from "@/lib/utils/general"
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
import { DocumentBasic } from "@/types/component-types"

interface DocumentComboboxProps {
  documents: DocumentBasic[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  loading?: boolean
}

export function DocumentCombobox({
  documents,
  value,
  onValueChange,
  placeholder = "Select a document...",
  searchPlaceholder = "Search documents...",
  emptyMessage = "No documents found.",
  disabled = false,
  loading = false
}: DocumentComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedDocument = documents.find((doc) => doc.id === value)

  const getPlaceholderText = () => {
    if (loading) return "Loading documents..."
    if (documents.length === 0) return "No documents available"
    if (selectedDocument) return selectedDocument.documentName
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
          disabled={disabled || loading}
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
              {documents.map((document) => (
                <CommandItem
                  key={document.id}
                  value={`${document.documentName} ${document.documentType} ${document.id}`}
                  onSelect={() => {
                    onValueChange?.(document.id === value ? "" : document.id)
                    setOpen(false)
                  }}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <FileText className="h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <span className="truncate">{document.documentName}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({document.documentType})
                      </span>
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4",
                      value === document.id ? "opacity-100" : "opacity-0"
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