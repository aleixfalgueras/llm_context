'use client'

import { useState } from 'react'
import { Affiliation } from '@prisma/client'
import { ChevronDown, ChevronRight, User, Users, Copy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils/general'
import { AffiliationStatusLabels } from '@/lib/types/affiliation-types'

interface AffiliationTreeProps {
  userAffiliation: Affiliation
  children: Affiliation[]
}

interface TreeNodeProps {
  affiliation: Affiliation
  children: Affiliation[]
  level: number
  isRoot?: boolean
}

function TreeNode({ affiliation, children, level, isRoot = false }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = children.length > 0

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: 'Copied',
      description: `Affiliation code ${code} copied to clipboard`,
    })
  }

  return (
    <div className={cn("select-none", level > 0 && "ml-6")}>
      <div className={cn(
        "flex items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors",
        isRoot && "bg-primary/10 border border-primary/20"
      )}>
        {/* Expand/Collapse button */}
        {hasChildren && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
        
        {!hasChildren && (
          <div className="w-6 h-6" /> // Spacer for alignment
        )}

        {/* User Icon */}
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full",
          isRoot ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          {isRoot ? (
            <User className="h-5 w-5" />
          ) : (
            <Users className="h-5 w-5" />
          )}
        </div>

        {/* Affiliation Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {isRoot ? 'You' : `User ${affiliation.id.slice(-6)}`}
            </span>
            <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
              {affiliation.affiliationCode}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => copyToClipboard(affiliation.affiliationCode)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={isRoot ? "default" : "secondary"} className="text-xs">
              {AffiliationStatusLabels[affiliation.status]}
            </Badge>
            {hasChildren && (
              <span className="text-xs text-muted-foreground">
                {children.length} {children.length === 1 ? 'referral' : 'referrals'}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              Joined {new Date(affiliation.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Render children */}
      {isExpanded && hasChildren && (
        <div className="mt-1 relative">
          {/* Connection line */}
          {level === 0 && (
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
          )}
          
          {children.map((child, index) => (
            <div key={child.id} className="relative">
              {/* Horizontal connection line */}
              {level === 0 && (
                <div className="absolute left-6 top-6 w-6 h-px bg-border" />
              )}
              
              <TreeNode
                affiliation={child}
                children={[]} // For now, we only show direct children
                level={level + 1}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function AffiliationTree({ userAffiliation, children }: AffiliationTreeProps) {
  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground mb-4">
        Click on affiliation codes to copy them. Expand/collapse nodes to explore your network.
      </div>
      
      <TreeNode
        affiliation={userAffiliation}
        children={children}
        level={0}
        isRoot={true}
      />
    </div>
  )
}