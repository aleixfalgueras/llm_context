import {prisma} from '@/lib/prisma'
import {BaseOperations} from './base-operations'
import {DbOperationConfig, DbOperationResult, PaginationConfig} from "@/lib/types/database-types";
import {Client, Prisma} from '@prisma/client';

export class ClientOperations extends BaseOperations {

  static async findUserClients(
    userId: string,
    pagination?: PaginationConfig,
    searchTerm?: string,
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<{ records: Client[]; total?: number }>> {
    const filters = searchTerm 
      ? {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } }
          ]
        }
      : {}

    return this.findUserOwnedRecords<Client>(
      prisma.client,
      userId,
      filters,
      pagination,
      { context: 'Find user clients', ...config }
    )
  }

  static async createClient(userId: string, data: Omit<Prisma.ClientCreateInput, 'userId'>): Promise<DbOperationResult<Client>> {
    return this.createUserOwnedRecord<Client>(
      prisma.client,
      userId,
      data,
      { context: 'Create client' }
    )
  }

  static async updateClient(clientId: string, userId: string, data: Partial<Omit<Prisma.ClientCreateInput, 'userId' | 'id' | 'createdAt' | 'updatedAt'>>): Promise<DbOperationResult<Client>> {
    return this.updateUserOwnedRecord<Client>(
      prisma.client,
      clientId,
      userId,
      data,
      { context: 'Update client' }
    )
  }

  static async deleteClient(clientId: string, userId: string): Promise<DbOperationResult<{ id: string }>> {
    return this.deleteUserOwnedRecord(
      prisma.client,
      clientId,
      userId,
      { context: 'Delete client' }
    )
  }
}