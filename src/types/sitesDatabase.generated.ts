/**
 * Generated from Supabase project pkgwzusngqwnmdfpifnd after the
 * Wersee Sites migrations. Keep this file scoped to the Sites domain so the
 * existing application can adopt generated database types incrementally.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type SitesDatabase = {
  public: {
    Tables: {
      sites: {
        Row: {
          active_release_id: string | null
          analytics_enabled: boolean
          business_id: string
          created_at: string
          created_by: string
          custom_404_behavior: string
          default_document: string
          deleted_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          marketplace_listing_id: string | null
          marketplace_published_at: string | null
          name: string
          owner_id: string
          password_protection_prepared: boolean
          site_type: string
          slug: string
          spa_fallback: boolean
          status: string
          strict_security_mode: boolean
          thumbnail_url: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active_release_id?: string | null
          analytics_enabled?: boolean
          business_id: string
          created_at?: string
          created_by: string
          custom_404_behavior?: string
          default_document?: string
          deleted_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          marketplace_listing_id?: string | null
          marketplace_published_at?: string | null
          name: string
          owner_id: string
          password_protection_prepared?: boolean
          site_type?: string
          slug: string
          spa_fallback?: boolean
          status?: string
          strict_security_mode?: boolean
          thumbnail_url?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active_release_id?: string | null
          analytics_enabled?: boolean
          business_id?: string
          created_at?: string
          created_by?: string
          custom_404_behavior?: string
          default_document?: string
          deleted_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          marketplace_listing_id?: string | null
          marketplace_published_at?: string | null
          name?: string
          owner_id?: string
          password_protection_prepared?: boolean
          site_type?: string
          slug?: string
          spa_fallback?: boolean
          status?: string
          strict_security_mode?: boolean
          thumbnail_url?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_active_release_fk"
            columns: ["active_release_id"]
            isOneToOne: false
            referencedRelation: "site_releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_marketplace_listing_id_fkey"
            columns: ["marketplace_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      site_reserved_slugs: {
        Row: {
          created_at: string
          created_by: string | null
          reason: string
          slug: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          reason: string
          slug: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          reason?: string
          slug?: string
        }
        Relationships: []
      }
      site_slug_claims: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          site_id: string
          slug: string
          state: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          site_id: string
          slug: string
          state?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          site_id?: string
          slug?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_slug_claims_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_uploads: {
        Row: {
          completed_at: string | null
          created_at: string
          error_code: string | null
          error_message: string | null
          expires_at: string
          file_count: number
          id: string
          original_name: string | null
          owner_id: string
          release_id: string | null
          site_id: string
          source_metadata: Json
          source_type: string
          status: string
          storage_prefix: string
          total_bytes: number
          updated_at: string
          uploaded_bytes: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          expires_at?: string
          file_count?: number
          id?: string
          original_name?: string | null
          owner_id: string
          release_id?: string | null
          site_id: string
          source_metadata?: Json
          source_type: string
          status?: string
          storage_prefix: string
          total_bytes?: number
          updated_at?: string
          uploaded_bytes?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          expires_at?: string
          file_count?: number
          id?: string
          original_name?: string | null
          owner_id?: string
          release_id?: string | null
          site_id?: string
          source_metadata?: Json
          source_type?: string
          status?: string
          storage_prefix?: string
          total_bytes?: number
          updated_at?: string
          uploaded_bytes?: number
        }
        Relationships: [
          {
            foreignKeyName: "site_uploads_release_fk"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "site_releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_uploads_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_releases: {
        Row: {
          created_at: string
          created_by: string
          detected_root: string | null
          error_code: string | null
          error_message: string | null
          failed_at: string | null
          file_count: number
          id: string
          manifest: Json
          published_at: string | null
          release_notes: string | null
          site_id: string
          source_checksum: string | null
          source_storage_path: string | null
          source_type: string
          status: string
          total_bytes: number
          validation_report: Json
          vercel_deployment_id: string | null
          vercel_deployment_url: string | null
          version: number
        }
        Insert: {
          created_at?: string
          created_by: string
          detected_root?: string | null
          error_code?: string | null
          error_message?: string | null
          failed_at?: string | null
          file_count?: number
          id?: string
          manifest?: Json
          published_at?: string | null
          release_notes?: string | null
          site_id: string
          source_checksum?: string | null
          source_storage_path?: string | null
          source_type: string
          status?: string
          total_bytes?: number
          validation_report?: Json
          vercel_deployment_id?: string | null
          vercel_deployment_url?: string | null
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string
          detected_root?: string | null
          error_code?: string | null
          error_message?: string | null
          failed_at?: string | null
          file_count?: number
          id?: string
          manifest?: Json
          published_at?: string | null
          release_notes?: string | null
          site_id?: string
          source_checksum?: string | null
          source_storage_path?: string | null
          source_type?: string
          status?: string
          total_bytes?: number
          validation_report?: Json
          vercel_deployment_id?: string | null
          vercel_deployment_url?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "site_releases_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_release_files: {
        Row: {
          content_type: string
          created_at: string
          id: string
          is_html: boolean
          path: string
          release_id: string
          sha1: string
          size_bytes: number
          storage_path: string
        }
        Insert: {
          content_type: string
          created_at?: string
          id?: string
          is_html?: boolean
          path: string
          release_id: string
          sha1: string
          size_bytes: number
          storage_path: string
        }
        Update: {
          content_type?: string
          created_at?: string
          id?: string
          is_html?: boolean
          path?: string
          release_id?: string
          sha1?: string
          size_bytes?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_release_files_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "site_releases"
            referencedColumns: ["id"]
          },
        ]
      }
      site_deployment_jobs: {
        Row: {
          completed_at: string | null
          created_by: string
          error_code: string | null
          error_message: string | null
          id: string
          idempotency_key: string
          progress: number
          release_id: string
          site_id: string
          stage: string
          started_at: string
          status: string
          support_reference: string
          updated_at: string
          vercel_deployment_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_by: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          idempotency_key: string
          progress?: number
          release_id: string
          site_id: string
          stage?: string
          started_at?: string
          status?: string
          support_reference?: string
          updated_at?: string
          vercel_deployment_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_by?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string
          progress?: number
          release_id?: string
          site_id?: string
          stage?: string
          started_at?: string
          status?: string
          support_reference?: string
          updated_at?: string
          vercel_deployment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_deployment_jobs_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "site_releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_deployment_jobs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          id: string
          metadata: Json
          occurred_at: string
          site_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          site_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_audit_logs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_analytics_events: {
        Row: {
          browser_family: string | null
          country_code: string | null
          device_type: string | null
          element_label: string | null
          engaged_seconds: number | null
          event_type: string
          exit_page: string | null
          id: string
          is_bounce: boolean | null
          landing_page: string | null
          occurred_at: string
          os_family: string | null
          outbound_url_domain: string | null
          path: string
          received_at: string
          referrer_domain: string | null
          release_id: string | null
          session_id_hash: string
          site_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id_hash: string | null
        }
        Insert: {
          browser_family?: string | null
          country_code?: string | null
          device_type?: string | null
          element_label?: string | null
          engaged_seconds?: number | null
          event_type: string
          exit_page?: string | null
          id?: string
          is_bounce?: boolean | null
          landing_page?: string | null
          occurred_at: string
          os_family?: string | null
          outbound_url_domain?: string | null
          path: string
          received_at?: string
          referrer_domain?: string | null
          release_id?: string | null
          session_id_hash: string
          site_id: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id_hash?: string | null
        }
        Update: {
          browser_family?: string | null
          country_code?: string | null
          device_type?: string | null
          element_label?: string | null
          engaged_seconds?: number | null
          event_type?: string
          exit_page?: string | null
          id?: string
          is_bounce?: boolean | null
          landing_page?: string | null
          occurred_at?: string
          os_family?: string | null
          outbound_url_domain?: string | null
          path?: string
          received_at?: string
          referrer_domain?: string | null
          release_id?: string | null
          session_id_hash?: string
          site_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_analytics_events_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "site_releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_analytics_events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_analytics_daily: {
        Row: {
          bounces: number
          clicks: number
          consented_visitors: number
          engaged_seconds: number
          event_date: string
          id: number
          page_views: number
          release_id: string | null
          sessions: number
          site_id: string
          updated_at: string
        }
        Insert: {
          bounces?: number
          clicks?: number
          consented_visitors?: number
          engaged_seconds?: number
          event_date: string
          id?: never
          page_views?: number
          release_id?: string | null
          sessions?: number
          site_id: string
          updated_at?: string
        }
        Update: {
          bounces?: number
          clicks?: number
          consented_visitors?: number
          engaged_seconds?: number
          event_date?: string
          id?: never
          page_views?: number
          release_id?: string | null
          sessions?: number
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_analytics_daily_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "site_releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_analytics_daily_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_analytics_visitor_days: {
        Row: {
          created_at: string
          event_date: string
          site_id: string
          visitor_id_hash: string
        }
        Insert: {
          created_at?: string
          event_date: string
          site_id: string
          visitor_id_hash: string
        }
        Update: {
          created_at?: string
          event_date?: string
          site_id?: string
          visitor_id_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_analytics_visitor_days_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_analytics_top_pages_daily: {
        Row: {
          engaged_seconds: number
          entries: number
          event_date: string
          exits: number
          id: number
          page_views: number
          path: string
          release_id: string | null
          site_id: string
          updated_at: string
        }
        Insert: {
          engaged_seconds?: number
          entries?: number
          event_date: string
          exits?: number
          id?: never
          page_views?: number
          path: string
          release_id?: string | null
          site_id: string
          updated_at?: string
        }
        Update: {
          engaged_seconds?: number
          entries?: number
          event_date?: string
          exits?: number
          id?: never
          page_views?: number
          path?: string
          release_id?: string | null
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_analytics_top_pages_daily_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "site_releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_analytics_top_pages_daily_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_analytics_dimensions_daily: {
        Row: {
          dimension: string
          event_count: number
          event_date: string
          id: number
          release_id: string | null
          site_id: string
          updated_at: string
          value: string
        }
        Insert: {
          dimension: string
          event_count?: number
          event_date: string
          id?: never
          release_id?: string | null
          site_id: string
          updated_at?: string
          value: string
        }
        Update: {
          dimension?: string
          event_count?: number
          event_date?: string
          id?: never
          release_id?: string | null
          site_id?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_analytics_dimensions_daily_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "site_releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_analytics_dimensions_daily_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_rate_limits: {
        Row: {
          bucket: string
          key_hash: string
          request_count: number
          updated_at: string
          window_started_at: string
        }
        Insert: {
          bucket: string
          key_hash: string
          request_count?: number
          updated_at?: string
          window_started_at: string
        }
        Update: {
          bucket?: string
          key_hash?: string
          request_count?: number
          updated_at?: string
          window_started_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      site_slug_available: {
        Args: { current_site_id?: string; requested_slug: string }
        Returns: boolean
      }
      create_site: {
        Args: {
          requested_site_type?: string
          requested_slug: string
          site_description?: string
          site_name: string
          target_business_id: string
        }
        Returns: {
          active_release_id: string | null
          analytics_enabled: boolean
          business_id: string
          created_at: string
          created_by: string
          custom_404_behavior: string
          default_document: string
          deleted_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          name: string
          owner_id: string
          password_protection_prepared: boolean
          site_type: string
          slug: string
          spa_fallback: boolean
          status: string
          strict_security_mode: boolean
          thumbnail_url: string | null
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "sites"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reserve_site_slug: {
        Args: { requested_slug: string; target_site_id: string }
        Returns: string
      }
      commit_site_slug: {
        Args: { reserved_slug: string; target_site_id: string }
        Returns: {
          active_release_id: string | null
          analytics_enabled: boolean
          business_id: string
          created_at: string
          created_by: string
          custom_404_behavior: string
          default_document: string
          deleted_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          name: string
          owner_id: string
          password_protection_prepared: boolean
          site_type: string
          slug: string
          spa_fallback: boolean
          status: string
          strict_security_mode: boolean
          thumbnail_url: string | null
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "sites"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      release_pending_site_slug: {
        Args: { reserved_slug: string; target_site_id: string }
        Returns: undefined
      }
      create_site_release: {
        Args: {
          notes?: string
          target_site_id: string
          target_upload_id: string
        }
        Returns: {
          created_at: string
          created_by: string
          detected_root: string | null
          error_code: string | null
          error_message: string | null
          failed_at: string | null
          file_count: number
          id: string
          manifest: Json
          published_at: string | null
          release_notes: string | null
          site_id: string
          source_checksum: string | null
          source_storage_path: string | null
          source_type: string
          status: string
          total_bytes: number
          validation_report: Json
          vercel_deployment_id: string | null
          vercel_deployment_url: string | null
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "site_releases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      begin_site_publish: {
        Args: {
          request_key: string
          target_release_id: string
          target_site_id: string
        }
        Returns: {
          completed_at: string | null
          created_by: string
          error_code: string | null
          error_message: string | null
          id: string
          idempotency_key: string
          progress: number
          release_id: string
          site_id: string
          stage: string
          started_at: string
          status: string
          support_reference: string
          updated_at: string
          vercel_deployment_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "site_deployment_jobs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_site_publish: {
        Args: {
          deployment_id: string
          deployment_url: string
          target_job_id: string
        }
        Returns: undefined
      }
      fail_site_publish: {
        Args: {
          failure_code: string
          failure_message: string
          target_job_id: string
        }
        Returns: undefined
      }
      complete_site_rollback: {
        Args: {
          actor_id: string
          target_release_id: string
          target_site_id: string
        }
        Returns: undefined
      }
      check_site_rate_limit: {
        Args: {
          rate_bucket: string
          rate_key_hash: string
          request_limit: number
          window_seconds: number
        }
        Returns: boolean
      }
      ingest_site_analytics_event: {
        Args: { event_payload: Json }
        Returns: string
      }
      count_site_unique_visitors: {
        Args: { from_date: string; target_site_id: string; to_date: string }
        Returns: number
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type SiteTableName = keyof SitesDatabase['public']['Tables']
export type SiteRow<T extends SiteTableName> = SitesDatabase['public']['Tables'][T]['Row']
export type SiteInsert<T extends SiteTableName> = SitesDatabase['public']['Tables'][T]['Insert']
export type SiteUpdate<T extends SiteTableName> = SitesDatabase['public']['Tables'][T]['Update']
