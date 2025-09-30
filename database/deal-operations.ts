import {prisma} from '@/lib/prisma'
import {BaseOperations} from './base-operations'
import {DbOperationConfig, DbOperationResult, PaginationConfig} from "@/lib/types/database-types";
import {Deal, Prisma} from '@prisma/client';

export class DealOperations extends BaseOperations {

  static async findUserDeals(
    userId: string,
    pagination?: PaginationConfig,
    filters?: {
      searchTerm?: string;
      isActive?: boolean;
      isApproved?: boolean;
    },
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<{ records: Deal[]; total?: number }>> {
    const whereFilters: any = {}

    if (filters?.searchTerm) {
      whereFilters.OR = [
        { title: { contains: filters.searchTerm, mode: 'insensitive' } },
        { description: { contains: filters.searchTerm, mode: 'insensitive' } }
      ]
    }

    if (filters?.isActive !== undefined) {
      whereFilters.isActive = filters.isActive
    }

    if (filters?.isApproved !== undefined) {
      whereFilters.isApproved = filters.isApproved
    }

    return this.findUserOwnedRecords<Deal>(
      prisma.deal,
      userId,
      whereFilters,
      pagination,
      {
        context: 'Find user deals',
        orderBy: [
          { isActive: 'desc' },
          { updatedAt: 'desc' }
        ],
        ...config
      }
    )
  }

  static async findAllDeals(
    pagination?: PaginationConfig,
    filters?: {
      searchTerm?: string;
      isActive?: boolean;
      isApproved?: boolean;
      userId?: string;
    },
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<{ records: Deal[]; total?: number }>> {
    try {
      const where: any = {}

      if (filters?.searchTerm) {
        where.OR = [
          { title: { contains: filters.searchTerm, mode: 'insensitive' } },
          { description: { contains: filters.searchTerm, mode: 'insensitive' } }
        ]
      }

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive
      }

      if (filters?.isApproved !== undefined) {
        where.isApproved = filters.isApproved
      }

      if (filters?.userId) {
        where.userId = filters.userId
      }

      const queryOptions: any = {
        where,
        include: config.include,
        select: config.select,
        orderBy: config.orderBy || [
          { isActive: 'desc' },
          { updatedAt: 'desc' }
        ]
      }

      if (pagination) {
        queryOptions.skip = pagination.skip ?? (pagination.page - 1) * pagination.limit
        queryOptions.take = pagination.limit
      }

      const [records, total] = await Promise.all([
        prisma.deal.findMany(queryOptions),
        pagination ? prisma.deal.count({ where }) : Promise.resolve(undefined)
      ])

      return {
        success: true,
        data: { records, total }
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch deals'
      }
    }
  }

  static async findDealById(dealId: string, userId: string, config: DbOperationConfig = {}): Promise<DbOperationResult<Deal>> {
    return this.findUserOwnedRecord<Deal>(
      prisma.deal,
      dealId,
      userId,
      { context: 'Find deal by ID', ...config }
    )
  }

  static async findDealByIdPublic(dealId: string, config: DbOperationConfig = {}): Promise<DbOperationResult<Deal>> {
    try {
      const deal = await prisma.deal.findFirst({
        where: {
          id: dealId,
          isActive: true,
          isApproved: true
        }
      })

      if (!deal) {
        return {
          success: false,
          error: 'Deal not found or not available'
        }
      }

      return {
        success: true,
        data: deal
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch deal'
      }
    }
  }

  static async createDeal(userId: string, data: Omit<Prisma.DealCreateInput, 'userId'>): Promise<DbOperationResult<Deal>> {
    return this.createUserOwnedRecord<Deal>(
      prisma.deal,
      userId,
      data,
      { context: 'Create deal' }
    )
  }

  static async updateDeal(
    dealId: string,
    userId: string,
    data: Partial<Omit<Prisma.DealUpdateInput, 'userId' | 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<DbOperationResult<Deal>> {
    return this.updateUserOwnedRecord<Deal>(
      prisma.deal,
      dealId,
      userId,
      data,
      { context: 'Update deal' }
    )
  }

  static async deleteDeal(dealId: string, userId: string): Promise<DbOperationResult<{ id: string }>> {
    return this.deleteUserOwnedRecord(
      prisma.deal,
      dealId,
      userId,
      { context: 'Delete deal' }
    )
  }

  static async approveDeal(dealId: string): Promise<DbOperationResult<Deal>> {
    try {
      const deal = await prisma.deal.update({
        where: { id: dealId },
        data: { isApproved: true }
      })

      return {
        success: true,
        data: deal
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to approve deal'
      }
    }
  }
}