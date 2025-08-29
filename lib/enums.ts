
export enum ServiceStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  COMING_SOON = 'coming_soon'
}

export enum ConsentAction {
  GRANTED = 'granted',
  WITHDRAWN = 'withdrawn',
  UPDATED = 'updated'
}

export enum ConsentType {
  DATA_PROCESSING = 'data_processing',
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
  COOKIES_ANALYTICS = 'cookies_analytics',
  COOKIES_MARKETING = 'cookies_marketing',
  COOKIES_FUNCTIONAL = 'cookies_functional'
}

// =============================================================================
// UI AND COMPONENT VARIANTS
// =============================================================================

export enum ToastVariant {
  DEFAULT = 'default',
  DESTRUCTIVE = 'destructive',
  SUCCESS = 'success'
}

export enum ButtonVariant {
  DEFAULT = 'default',
  DESTRUCTIVE = 'destructive',
  OUTLINE = 'outline',
  SECONDARY = 'secondary',
  GHOST = 'ghost',
  LINK = 'link'
}

export enum BadgeVariant {
  DEFAULT = 'default',
  SECONDARY = 'secondary',
  DESTRUCTIVE = 'destructive',
  OUTLINE = 'outline'
}

export enum ViewMode {
  GRID = 'grid',
  TABLE = 'table'
}

export enum ClientSortMode {
  CREATED = 'created',
  NAME = 'name'
}