import {prisma} from '@/lib/prisma'
import {BaseOperations} from './base-operations'
import {DbOperationConfig, DbOperationResult} from "@/lib/types/database-types";
import {Affiliation, Prisma} from '@prisma/client';
import {logger} from '@/lib/logger';

export class AffiliationOperations extends BaseOperations {

  static async findUserAffiliation(
    userId: string,
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<Affiliation | null>> {
    try {
      const affiliation = await prisma.affiliation.findUnique({
        where: { userId },
        ...(config.select && { select: config.select })
      })
      
      return {
        success: true,
        data: affiliation
      }
    } catch (error) {
      logger.dbError('AffiliationOperations', 'findUserAffiliation', error as Error, { userId })
      return {
        success: false,
        error: 'Failed to find user affiliation'
      }
    }
  }

  static async findAffiliationByCode(
    affiliationCode: string,
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<Affiliation | null>> {
    try {
      const affiliation = await prisma.affiliation.findUnique({
        where: { affiliationCode },
        ...(config.select && { select: config.select })
      })
      
      return {
        success: true,
        data: affiliation
      }
    } catch (error) {
      logger.dbError('AffiliationOperations', 'findAffiliationByCode', error as Error)
      return {
        success: false,
        error: 'Failed to find affiliation by code'
      }
    }
  }

  static async findAffiliationChildren(
    affiliationCode: string,
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<Affiliation[]>> {
    try {
      const affiliations = await prisma.affiliation.findMany({
        where: { parentAffiliationCode: affiliationCode },
        ...(config.select && { select: config.select }),
        ...(config.orderBy && { orderBy: config.orderBy })
      })
      
      return {
        success: true,
        data: affiliations
      }
    } catch (error) {
      logger.dbError('AffiliationOperations', 'findAffiliationChildren', error as Error)
      return {
        success: false,
        error: 'Failed to find affiliation children'
      }
    }
  }

  static async createAffiliation(
    data: Prisma.AffiliationCreateInput
  ): Promise<DbOperationResult<Affiliation>> {
    try {
      const affiliation = await prisma.affiliation.create({
        data
      })
      
      return {
        success: true,
        data: affiliation
      }
    } catch (error) {
      logger.dbError('AffiliationOperations', 'createAffiliation', error as Error)
      
      // Handle unique constraint violations
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return {
            success: false,
            error: 'An affiliation with this information already exists'
          }
        }
      }
      
      return {
        success: false,
        error: 'Failed to create affiliation'
      }
    }
  }

  static async updateAffiliation(
    id: string,
    data: Prisma.AffiliationUpdateInput
  ): Promise<DbOperationResult<Affiliation>> {
    try {
      const affiliation = await prisma.affiliation.update({
        where: { id },
        data
      })
      
      return {
        success: true,
        data: affiliation
      }
    } catch (error) {
      logger.dbError('AffiliationOperations', 'updateAffiliation', error as Error)
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return {
            success: false,
            error: 'Affiliation not found'
          }
        }
        if (error.code === 'P2002') {
          return {
            success: false,
            error: 'An affiliation with this information already exists'
          }
        }
      }
      
      return {
        success: false,
        error: 'Failed to update affiliation'
      }
    }
  }

  static async unlinkAffiliation(
    affiliationCode: string
  ): Promise<DbOperationResult<Affiliation>> {
    try {
      const affiliation = await prisma.affiliation.update({
        where: { affiliationCode },
        data: { parentAffiliationCode: null }
      })
      
      return {
        success: true,
        data: affiliation
      }
    } catch (error) {
      logger.dbError('AffiliationOperations', 'unlinkAffiliation', error as Error)
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return {
            success: false,
            error: 'Affiliation not found'
          }
        }
      }
      
      return {
        success: false,
        error: 'Failed to unlink affiliation'
      }
    }
  }
}