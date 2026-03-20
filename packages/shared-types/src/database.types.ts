export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      agents: {
        Row: {
          api_key_hash: string | null
          avg_rating: number
          created_at: string
          dispute_count: number
          email: string
          handle: string
          id: string
          job_count: number
          level: number
          onboarding_acknowledged_at: string | null
          onboarding_prompt_version: number
          reputation_score: number
          role: Database["public"]["Enums"]["agent_role"]
          solve_rate: number
          suspension_status: Database["public"]["Enums"]["suspension_status"]
          total_xp: number
          trust_tier: Database["public"]["Enums"]["trust_tier"]
          updated_at: string
          verified: boolean
          zone: Database["public"]["Enums"]["zone_enum"]
        }
        Insert: {
          api_key_hash?: string | null
          avg_rating?: number
          created_at?: string
          dispute_count?: number
          email: string
          handle: string
          id: string
          job_count?: number
          level?: number
          onboarding_acknowledged_at?: string | null
          onboarding_prompt_version?: number
          reputation_score?: number
          role?: Database["public"]["Enums"]["agent_role"]
          solve_rate?: number
          suspension_status?: Database["public"]["Enums"]["suspension_status"]
          total_xp?: number
          trust_tier?: Database["public"]["Enums"]["trust_tier"]
          updated_at?: string
          verified?: boolean
          zone?: Database["public"]["Enums"]["zone_enum"]
        }
        Update: {
          api_key_hash?: string | null
          avg_rating?: number
          created_at?: string
          dispute_count?: number
          email?: string
          handle?: string
          id?: string
          job_count?: number
          level?: number
          onboarding_acknowledged_at?: string | null
          onboarding_prompt_version?: number
          reputation_score?: number
          role?: Database["public"]["Enums"]["agent_role"]
          solve_rate?: number
          suspension_status?: Database["public"]["Enums"]["suspension_status"]
          total_xp?: number
          trust_tier?: Database["public"]["Enums"]["trust_tier"]
          updated_at?: string
          verified?: boolean
          zone?: Database["public"]["Enums"]["zone_enum"]
        }
        Relationships: []
      }
      ai_tools: {
        Row: {
          approved_at: string | null
          capabilities: string[]
          category: Database["public"]["Enums"]["tool_category"]
          created_at: string
          description_full: Json | null
          description_short: string | null
          documentation_url: string | null
          id: string
          input_formats: string[]
          known_limitations: string[]
          last_verified_at: string | null
          name: string
          output_formats: string[]
          pricing_model: Database["public"]["Enums"]["pricing_model"]
          provider: string
          registered_by_agent_id: string
          swarm_confidence_score: number | null
          url: string
          verification_status: Database["public"]["Enums"]["tool_verification_status"]
          version: string
        }
        Insert: {
          approved_at?: string | null
          capabilities?: string[]
          category: Database["public"]["Enums"]["tool_category"]
          created_at?: string
          description_full?: Json | null
          description_short?: string | null
          documentation_url?: string | null
          id?: string
          input_formats?: string[]
          known_limitations?: string[]
          last_verified_at?: string | null
          name: string
          output_formats?: string[]
          pricing_model?: Database["public"]["Enums"]["pricing_model"]
          provider: string
          registered_by_agent_id: string
          swarm_confidence_score?: number | null
          url: string
          verification_status?: Database["public"]["Enums"]["tool_verification_status"]
          version: string
        }
        Update: {
          approved_at?: string | null
          capabilities?: string[]
          category?: Database["public"]["Enums"]["tool_category"]
          created_at?: string
          description_full?: Json | null
          description_short?: string | null
          documentation_url?: string | null
          id?: string
          input_formats?: string[]
          known_limitations?: string[]
          last_verified_at?: string | null
          name?: string
          output_formats?: string[]
          pricing_model?: Database["public"]["Enums"]["pricing_model"]
          provider?: string
          registered_by_agent_id?: string
          swarm_confidence_score?: number | null
          url?: string
          verification_status?: Database["public"]["Enums"]["tool_verification_status"]
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_tools_registered_by_agent_id_fkey"
            columns: ["registered_by_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverable_access_log: {
        Row: {
          accessed_at: string
          action: string
          agent_id: string
          deliverable_id: string
          id: string
        }
        Insert: {
          accessed_at?: string
          action: string
          agent_id: string
          deliverable_id: string
          id?: string
        }
        Update: {
          accessed_at?: string
          action?: string
          agent_id?: string
          deliverable_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverable_access_log_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverable_access_log_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverables: {
        Row: {
          agent_id: string
          id: string
          job_id: string
          md_content_hash: string
          metadata: Json
          prompt_injection_scan_status: Database["public"]["Enums"]["scan_status"]
          safety_scan_status: Database["public"]["Enums"]["scan_status"]
          schema_version: string
          storage_path: string
          submitted_at: string
          tools_used: string[]
          version: number
        }
        Insert: {
          agent_id: string
          id?: string
          job_id: string
          md_content_hash: string
          metadata?: Json
          prompt_injection_scan_status?: Database["public"]["Enums"]["scan_status"]
          safety_scan_status?: Database["public"]["Enums"]["scan_status"]
          schema_version?: string
          storage_path: string
          submitted_at?: string
          tools_used?: string[]
          version?: number
        }
        Update: {
          agent_id?: string
          id?: string
          job_id?: string
          md_content_hash?: string
          metadata?: Json
          prompt_injection_scan_status?: Database["public"]["Enums"]["scan_status"]
          safety_scan_status?: Database["public"]["Enums"]["scan_status"]
          schema_version?: string
          storage_path?: string
          submitted_at?: string
          tools_used?: string[]
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          assigned_to: string | null
          audit_trail: Json[]
          evidence: string | null
          id: string
          job_id: string
          opened_at: string
          priority: Database["public"]["Enums"]["dispute_priority"]
          raised_by: string
          reason: string
          resolution: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["dispute_status"]
        }
        Insert: {
          assigned_to?: string | null
          audit_trail?: Json[]
          evidence?: string | null
          id?: string
          job_id: string
          opened_at?: string
          priority?: Database["public"]["Enums"]["dispute_priority"]
          raised_by: string
          reason: string
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Update: {
          assigned_to?: string | null
          audit_trail?: Json[]
          evidence?: string | null
          id?: string
          job_id?: string
          opened_at?: string
          priority?: Database["public"]["Enums"]["dispute_priority"]
          raised_by?: string
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Relationships: [
          {
            foreignKeyName: "disputes_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_raised_by_fkey"
            columns: ["raised_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          acceptance_criteria: string
          accepted_at: string | null
          client_agent_id: string
          created_at: string
          description: string
          dispute_id: string | null
          feature_flag_cohort: string | null
          helpfulness_score: number | null
          id: string
          point_budget: number
          point_quote: number | null
          reviewed_at: string | null
          service_agent_id: string | null
          solved: boolean | null
          status: Database["public"]["Enums"]["job_status"]
          submitted_at: string | null
          tools_used: string[]
          zone_at_creation: Database["public"]["Enums"]["zone_enum"]
        }
        Insert: {
          acceptance_criteria: string
          accepted_at?: string | null
          client_agent_id: string
          created_at?: string
          description: string
          dispute_id?: string | null
          feature_flag_cohort?: string | null
          helpfulness_score?: number | null
          id?: string
          point_budget: number
          point_quote?: number | null
          reviewed_at?: string | null
          service_agent_id?: string | null
          solved?: boolean | null
          status?: Database["public"]["Enums"]["job_status"]
          submitted_at?: string | null
          tools_used?: string[]
          zone_at_creation: Database["public"]["Enums"]["zone_enum"]
        }
        Update: {
          acceptance_criteria?: string
          accepted_at?: string | null
          client_agent_id?: string
          created_at?: string
          description?: string
          dispute_id?: string | null
          feature_flag_cohort?: string | null
          helpfulness_score?: number | null
          id?: string
          point_budget?: number
          point_quote?: number | null
          reviewed_at?: string | null
          service_agent_id?: string | null
          solved?: boolean | null
          status?: Database["public"]["Enums"]["job_status"]
          submitted_at?: string | null
          tools_used?: string[]
          zone_at_creation?: Database["public"]["Enums"]["zone_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "jobs_client_agent_id_fkey"
            columns: ["client_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_service_agent_id_fkey"
            columns: ["service_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      reputation_snapshots: {
        Row: {
          agent_id: string
          confidence_tier: Database["public"]["Enums"]["confidence_tier"]
          dispute_rate: number
          id: string
          last_updated: string
          recency_decay: number
          score: number
          solve_rate: number
          weighted_avg_rating: number
        }
        Insert: {
          agent_id: string
          confidence_tier?: Database["public"]["Enums"]["confidence_tier"]
          dispute_rate?: number
          id?: string
          last_updated?: string
          recency_decay?: number
          score?: number
          solve_rate?: number
          weighted_avg_rating?: number
        }
        Update: {
          agent_id?: string
          confidence_tier?: Database["public"]["Enums"]["confidence_tier"]
          dispute_rate?: number
          id?: string
          last_updated?: string
          recency_decay?: number
          score?: number
          solve_rate?: number
          weighted_avg_rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reputation_snapshots_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      sanctions: {
        Row: {
          agent_id: string
          dispute_id: string | null
          expires_at: string | null
          id: string
          issued_at: string
          issued_by: string
          reason: string
          type: Database["public"]["Enums"]["sanction_type"]
        }
        Insert: {
          agent_id: string
          dispute_id?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string
          issued_by: string
          reason: string
          type: Database["public"]["Enums"]["sanction_type"]
        }
        Update: {
          agent_id?: string
          dispute_id?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string
          issued_by?: string
          reason?: string
          type?: Database["public"]["Enums"]["sanction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "sanctions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sanctions_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sanctions_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          agent_id: string
          ai_tools_used: string[]
          avg_rating_for_skill: number
          category: Database["public"]["Enums"]["skill_category"]
          created_at: string
          description: string
          domain: string
          id: string
          jobs_completed_for_skill: number
          last_used_at: string | null
          name: string
          point_range_max: number
          point_range_min: number
          proficiency_level: Database["public"]["Enums"]["proficiency_level"]
          sample_deliverable_id: string | null
          search_vector: unknown
          tags: string[]
          updated_at: string
          verification_method: Database["public"]["Enums"]["verification_method"]
          verified: boolean
        }
        Insert: {
          agent_id: string
          ai_tools_used?: string[]
          avg_rating_for_skill?: number
          category: Database["public"]["Enums"]["skill_category"]
          created_at?: string
          description: string
          domain: string
          id?: string
          jobs_completed_for_skill?: number
          last_used_at?: string | null
          name: string
          point_range_max: number
          point_range_min: number
          proficiency_level?: Database["public"]["Enums"]["proficiency_level"]
          sample_deliverable_id?: string | null
          search_vector?: unknown
          tags?: string[]
          updated_at?: string
          verification_method?: Database["public"]["Enums"]["verification_method"]
          verified?: boolean
        }
        Update: {
          agent_id?: string
          ai_tools_used?: string[]
          avg_rating_for_skill?: number
          category?: Database["public"]["Enums"]["skill_category"]
          created_at?: string
          description?: string
          domain?: string
          id?: string
          jobs_completed_for_skill?: number
          last_used_at?: string | null
          name?: string
          point_range_max?: number
          point_range_min?: number
          proficiency_level?: Database["public"]["Enums"]["proficiency_level"]
          sample_deliverable_id?: string | null
          search_vector?: unknown
          tags?: string[]
          updated_at?: string
          verification_method?: Database["public"]["Enums"]["verification_method"]
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "skills_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_ledger: {
        Row: {
          agent_id: string
          amount: number
          balance_after: number
          created_at: string
          id: string
          idempotency_key: string
          job_id: string | null
          type: Database["public"]["Enums"]["ledger_type"]
        }
        Insert: {
          agent_id: string
          amount: number
          balance_after: number
          created_at?: string
          id?: string
          idempotency_key: string
          job_id?: string | null
          type: Database["public"]["Enums"]["ledger_type"]
        }
        Update: {
          agent_id?: string
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          idempotency_key?: string
          job_id?: string | null
          type?: Database["public"]["Enums"]["ledger_type"]
        }
        Relationships: [
          {
            foreignKeyName: "wallet_ledger_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_event_log: {
        Row: {
          attempts: number
          created_at: string
          delivered_at: string | null
          event_type: string
          id: string
          last_attempt_at: string | null
          payload: Json
          status: string
          subscription_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          delivered_at?: string | null
          event_type: string
          id?: string
          last_attempt_at?: string | null
          payload: Json
          status?: string
          subscription_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          delivered_at?: string | null
          event_type?: string
          id?: string
          last_attempt_at?: string | null
          payload?: Json
          status?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_event_log_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "webhook_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_subscriptions: {
        Row: {
          active: boolean
          agent_id: string
          created_at: string
          events: string[]
          id: string
          secret: string
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          agent_id: string
          created_at?: string
          events?: string[]
          id?: string
          secret: string
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          agent_id?: string
          created_at?: string
          events?: string[]
          id?: string
          secret?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_subscriptions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_config: {
        Row: {
          active: boolean
          id: string
          job_point_cap: number
          level_max: number
          level_min: number
          promotion_rules: Json
          unlock_criteria: Json
          updated_at: string
          visibility_rules: Json
          zone_name: Database["public"]["Enums"]["zone_enum"]
        }
        Insert: {
          active?: boolean
          id?: string
          job_point_cap: number
          level_max: number
          level_min: number
          promotion_rules?: Json
          unlock_criteria?: Json
          updated_at?: string
          visibility_rules?: Json
          zone_name: Database["public"]["Enums"]["zone_enum"]
        }
        Update: {
          active?: boolean
          id?: string
          job_point_cap?: number
          level_max?: number
          level_min?: number
          promotion_rules?: Json
          unlock_criteria?: Json
          updated_at?: string
          visibility_rules?: Json
          zone_name?: Database["public"]["Enums"]["zone_enum"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      grant_xp_and_check_promotion: {
        Args: {
          p_agent_id: string
          p_base_xp: number
          p_rating: number
          p_solved: boolean
        }
        Returns: Json
      }
      recalculate_reputation: { Args: { p_agent_id: string }; Returns: Json }
      wallet_escrow_lock: {
        Args: {
          p_amount: number
          p_client_agent_id: string
          p_idempotency_key: string
          p_job_id: string
        }
        Returns: Json
      }
      wallet_escrow_release: {
        Args: {
          p_idempotency_key: string
          p_job_id: string
          p_platform_fee_pct: number
          p_service_agent_id: string
        }
        Returns: Json
      }
      wallet_get_balance: { Args: { p_agent_id: string }; Returns: Json }
      wallet_grant_starter_bonus: {
        Args: {
          p_agent_id: string
          p_amount: number
          p_idempotency_key: string
        }
        Returns: Json
      }
      wallet_reconciliation_check: { Args: never; Returns: Json }
      wallet_refund: {
        Args: { p_idempotency_key: string; p_job_id: string }
        Returns: Json
      }
    }
    Enums: {
      agent_role: "client" | "service" | "admin" | "moderator"
      confidence_tier: "unrated" | "low" | "medium" | "high" | "very_high"
      dispute_priority: "low" | "normal" | "high" | "critical"
      dispute_status: "open" | "in_review" | "resolved" | "escalated"
      job_status:
        | "open"
        | "accepted"
        | "in_progress"
        | "submitted"
        | "under_review"
        | "completed"
        | "disputed"
        | "cancelled"
      ledger_type:
        | "credit"
        | "debit"
        | "escrow_lock"
        | "escrow_release"
        | "refund"
        | "platform_fee"
        | "starter_bonus"
      pricing_model:
        | "free"
        | "per_token"
        | "per_call"
        | "subscription"
        | "unknown"
      proficiency_level: "beginner" | "intermediate" | "advanced" | "expert"
      sanction_type: "warn" | "suspend" | "ban"
      scan_status: "pending" | "passed" | "failed" | "quarantined"
      skill_category:
        | "code_generation"
        | "data_analysis"
        | "content_creation"
        | "research"
        | "translation"
        | "devops"
        | "security_audit"
        | "design"
      suspension_status: "active" | "suspended" | "banned"
      tool_category:
        | "llm"
        | "code_assistant"
        | "image_gen"
        | "search"
        | "embedding"
        | "speech"
        | "custom"
      tool_verification_status: "pending" | "approved" | "stale" | "rejected"
      trust_tier: "new" | "bronze" | "silver" | "gold" | "platinum"
      verification_method:
        | "none"
        | "platform_test_job"
        | "peer_review"
        | "portfolio_sample"
      zone_enum: "starter" | "apprentice" | "journeyman" | "expert" | "master"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      iceberg_namespaces: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_namespaces_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      iceberg_tables: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          location: string
          name: string
          namespace_id: string
          remote_table_id: string | null
          shard_id: string | null
          shard_key: string | null
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          location: string
          name: string
          namespace_id: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          namespace_id?: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_tables_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iceberg_tables_namespace_id_fkey"
            columns: ["namespace_id"]
            isOneToOne: false
            referencedRelation: "iceberg_namespaces"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      agent_role: ["client", "service", "admin", "moderator"],
      confidence_tier: ["unrated", "low", "medium", "high", "very_high"],
      dispute_priority: ["low", "normal", "high", "critical"],
      dispute_status: ["open", "in_review", "resolved", "escalated"],
      job_status: [
        "open",
        "accepted",
        "in_progress",
        "submitted",
        "under_review",
        "completed",
        "disputed",
        "cancelled",
      ],
      ledger_type: [
        "credit",
        "debit",
        "escrow_lock",
        "escrow_release",
        "refund",
        "platform_fee",
        "starter_bonus",
      ],
      pricing_model: [
        "free",
        "per_token",
        "per_call",
        "subscription",
        "unknown",
      ],
      proficiency_level: ["beginner", "intermediate", "advanced", "expert"],
      sanction_type: ["warn", "suspend", "ban"],
      scan_status: ["pending", "passed", "failed", "quarantined"],
      skill_category: [
        "code_generation",
        "data_analysis",
        "content_creation",
        "research",
        "translation",
        "devops",
        "security_audit",
        "design",
      ],
      suspension_status: ["active", "suspended", "banned"],
      tool_category: [
        "llm",
        "code_assistant",
        "image_gen",
        "search",
        "embedding",
        "speech",
        "custom",
      ],
      tool_verification_status: ["pending", "approved", "stale", "rejected"],
      trust_tier: ["new", "bronze", "silver", "gold", "platinum"],
      verification_method: [
        "none",
        "platform_test_job",
        "peer_review",
        "portfolio_sample",
      ],
      zone_enum: ["starter", "apprentice", "journeyman", "expert", "master"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const

