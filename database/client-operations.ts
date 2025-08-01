/**
 * Client-specific database operations
 */

import { prisma } from '../lib/prisma'
import { BaseOperations } from './base-operations'
import {DbOperationConfig, PaginationConfig} from "@/lib/types/database-types";

export class ClientOperations extends BaseOperations {
  static async findUserClients(
    userId: string,
    pagination?: PaginationConfig,
    searchTerm?: string,
    config: DbOperationConfig = {}
  ) {
    const filters = searchTerm 
      ? {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } }
          ]
        }
      : {}

    return this.findUserOwnedRecords(
      prisma.client,
      userId,
      filters,
      pagination,
      { context: 'Find user clients', ...config }
    )
  }

  static async createClient(userId: string, data: any) {
    return this.createUserOwnedRecord(
      prisma.client,
      userId,
      data,
      { context: 'Create client' }
    )
  }

  static async updateClient(clientId: string, userId: string, data: any) {
    return this.updateUserOwnedRecord(
      prisma.client,
      clientId,
      userId,
      data,
      { context: 'Update client' }
    )
  }

  static async deleteClient(clientId: string, userId: string) {
    return this.deleteUserOwnedRecord(
      prisma.client,
      clientId,
      userId,
      { context: 'Delete client' }
    )
  }
}