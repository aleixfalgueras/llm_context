'use client'

import { Button } from '@/components/ui/button'
import { FileText, Edit, Trash2 } from 'lucide-react'
import { Client, ClientActionHandlers, LanguageInfo } from '@/types/client-list-types'

interface ClientTableViewProps {
  clients: Client[]
  actionHandlers: ClientActionHandlers
  isDeleting: string | null
  getLanguageInfo: (languageValue: string) => LanguageInfo
}

export function ClientTableView({ 
  clients, 
  actionHandlers, 
  isDeleting, 
  getLanguageInfo 
}: ClientTableViewProps) {
  const { onEditClient, onViewDocuments, onDeleteClient } = actionHandlers

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[150px]">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[180px] hidden sm:table-cell">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[140px] hidden sm:table-cell">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px] hidden md:table-cell">
                Country
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[130px] hidden lg:table-cell">
                Documents
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px] sticky right-0 bg-gray-50 dark:bg-gray-800">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {clients.map((client) => {
              const languageInfo = getLanguageInfo(client.documentsLanguage || 'english')
              return (
                <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {client.name}
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {client.email || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {client.phone || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {client.country || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <div className="text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1">
                      <span>{languageInfo.flag}</span>
                      <span>{languageInfo.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right sticky right-0 bg-white dark:bg-gray-900">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDocuments(client)}
                        title="View Documents"
                      >
                        <FileText className="h-4 w-4 text-yellow-600 hover:text-yellow-700" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditClient(client)}
                        title="Edit Client"
                      >
                        <Edit className="h-4 w-4 text-blue-600 hover:text-blue-700" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteClient(client.id, client.name)}
                        disabled={isDeleting === client.id}
                        title="Delete Client"
                      >
                        <Trash2 className="h-4 w-4 text-red-600 hover:text-red-700" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
} 