export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      browsing_history: {
        Row: {
          id: string
          tool_id: string | null
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          id?: string
          tool_id?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          id?: string
          tool_id?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "browsing_history_tool_id_fkey"
            columns: ["tool_id"]
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "browsing_history_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number | null
          tool_count: number | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
          tool_count?: number | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          tool_count?: number | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string | null
          demand_id: string | null
          developer_id: string
          id: string
          last_message_at: string | null
          quote_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          demand_id?: string | null
          developer_id: string
          id?: string
          last_message_at?: string | null
          quote_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          demand_id?: string | null
          developer_id?: string
          id?: string
          last_message_at?: string | null
          quote_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_demand_id_fkey"
            columns: ["demand_id"]
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_developer_id_fkey"
            columns: ["developer_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_quote_id_fkey"
            columns: ["quote_id"]
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message_type: string | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          likes_count: number | null
          parent_id: string | null
          tool_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          tool_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          tool_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_tool_id_fkey"
            columns: ["tool_id"]
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_withdrawals: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          payment_account: string | null
          payment_method: string | null
          processed_at: string | null
          promoter_id: string | null
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          payment_account?: string | null
          payment_method?: string | null
          processed_at?: string | null
          promoter_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          payment_account?: string | null
          payment_method?: string | null
          processed_at?: string | null
          promoter_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_withdrawals_promoter_id_fkey"
            columns: ["promoter_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          created_at: string | null
          demand_id: string
          developer_id: string
          id: string
          quote_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          demand_id: string
          developer_id: string
          id?: string
          quote_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          demand_id?: string
          developer_id?: string
          id?: string
          quote_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_demand_id_fkey"
            columns: ["demand_id"]
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_quote_id_fkey"
            columns: ["quote_id"]
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_boosts: {
        Row: {
          amount: number
          boost_type: string
          created_at: string | null
          demand_id: string
          duration_days: number
          end_at: string | null
          id: string
          paid_at: string | null
          start_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          boost_type: string
          created_at?: string | null
          demand_id: string
          duration_days: number
          end_at?: string | null
          id?: string
          paid_at?: string | null
          start_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          boost_type?: string
          created_at?: string | null
          demand_id?: string
          duration_days?: number
          end_at?: string | null
          id?: string
          paid_at?: string | null
          start_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_boosts_demand_id_fkey"
            columns: ["demand_id"]
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_boosts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      demands: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          budget_type: string
          category: string
          contact_info: string | null
          created_at: string | null
          description: string
          id: string
          period: string
          quote_count: number | null
          status: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          budget_type?: string
          category: string
          contact_info?: string | null
          created_at?: string | null
          description: string
          id?: string
          period: string
          quote_count?: number | null
          status?: string
          title: string
          type: string
          updated_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          budget_type?: string
          category?: string
          contact_info?: string | null
          created_at?: string | null
          description?: string
          id?: string
          period?: string
          quote_count?: number | null
          status?: string
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      developer_applications: {
        Row: {
          applied_at: string | null
          bio: string | null
          company_name: string | null
          contact_name: string
          contact_phone: string | null
          id: string
          portfolio_url: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          bio?: string | null
          company_name?: string | null
          contact_name: string
          contact_phone?: string | null
          id?: string
          portfolio_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          bio?: string | null
          company_name?: string | null
          contact_name?: string
          contact_phone?: string | null
          id?: string
          portfolio_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      developer_reputation: {
        Row: {
          completed_orders: number | null
          created_at: string | null
          developer_id: string
          id: string
          level: number | null
          on_time_rate: number | null
          rating: number | null
          response_rate: number | null
          score: number | null
          total_orders: number | null
          updated_at: string | null
        }
        Insert: {
          completed_orders?: number | null
          created_at?: string | null
          developer_id: string
          id?: string
          level?: number | null
          on_time_rate?: number | null
          rating?: number | null
          response_rate?: number | null
          score?: number | null
          total_orders?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_orders?: number | null
          created_at?: string | null
          developer_id?: string
          id?: string
          level?: number | null
          on_time_rate?: number | null
          rating?: number | null
          response_rate?: number | null
          score?: number | null
          total_orders?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "developer_reputation_developer_id_fkey"
            columns: ["developer_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          tool_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          tool_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          tool_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_tool_id_fkey"
            columns: ["tool_id"]
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_verifications: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string
          id: string
          phone: string
          used: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          phone: string
          used?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          phone?: string
          used?: boolean | null
        }
        Relationships: []
      }
      platform_dependencies: {
        Row: {
          created_at: string | null
          dependency_type: string | null
          depends_on: string
          id: string
          is_required: boolean | null
          platform: string
        }
        Insert: {
          created_at?: string | null
          dependency_type?: string | null
          depends_on: string
          id?: string
          is_required?: boolean | null
          platform: string
        }
        Update: {
          created_at?: string | null
          dependency_type?: string | null
          depends_on?: string
          id?: string
          is_required?: boolean | null
          platform?: string
        }
        Relationships: []
      }
      platform_groups: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          failover_enabled: boolean | null
          id: string
          name: string
          platforms: string[]
          primary_platform: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          failover_enabled?: boolean | null
          id?: string
          name: string
          platforms: string[]
          primary_platform: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          failover_enabled?: boolean | null
          id?: string
          name?: string
          platforms?: string[]
          primary_platform?: string
        }
        Relationships: []
      }
      platform_health_logs: {
        Row: {
          check_type: string
          checked_at: string | null
          current_status: string | null
          error_message: string | null
          http_status: number | null
          id: string
          is_healthy: boolean
          platform: string
          previous_status: string | null
          response_time: number | null
          status_changed: boolean | null
        }
        Insert: {
          check_type: string
          checked_at?: string | null
          current_status?: string | null
          error_message?: string | null
          http_status?: number | null
          id?: string
          is_healthy: boolean
          platform: string
          previous_status?: string | null
          response_time?: number | null
          status_changed?: boolean | null
        }
        Update: {
          check_type?: string
          checked_at?: string | null
          current_status?: string | null
          error_message?: string | null
          http_status?: number | null
          id?: string
          is_healthy?: boolean
          platform?: string
          previous_status?: string | null
          response_time?: number | null
          status_changed?: boolean | null
        }
        Relationships: []
      }
      platform_health_status: {
        Row: {
          alternative_platform: string | null
          api_endpoint: string | null
          avg_response_time: number | null
          category: string
          consecutive_failures: number | null
          consecutive_successes: number | null
          created_at: string | null
          failure_threshold: number | null
          fallback_strategy: string | null
          health_check_endpoint: string | null
          id: string
          is_active: boolean | null
          last_check_at: string | null
          last_failure_at: string | null
          last_success_at: string | null
          platform: string
          platform_name: string
          priority: number | null
          recovery_timeout: number | null
          status: string | null
          success_threshold: number | null
          total_failures: number | null
          total_requests: number | null
          updated_at: string | null
        }
        Insert: {
          alternative_platform?: string | null
          api_endpoint?: string | null
          avg_response_time?: number | null
          category: string
          consecutive_failures?: number | null
          consecutive_successes?: number | null
          created_at?: string | null
          failure_threshold?: number | null
          fallback_strategy?: string | null
          health_check_endpoint?: string | null
          id?: string
          is_active?: boolean | null
          last_check_at?: string | null
          last_failure_at?: string | null
          last_success_at?: string | null
          platform: string
          platform_name: string
          priority?: number | null
          recovery_timeout?: number | null
          status?: string | null
          success_threshold?: number | null
          total_failures?: number | null
          total_requests?: number | null
          updated_at?: string | null
        }
        Update: {
          alternative_platform?: string | null
          api_endpoint?: string | null
          avg_response_time?: number | null
          category?: string
          consecutive_failures?: number | null
          consecutive_successes?: number | null
          created_at?: string | null
          failure_threshold?: number | null
          fallback_strategy?: string | null
          health_check_endpoint?: string | null
          id?: string
          is_active?: boolean | null
          last_check_at?: string | null
          last_failure_at?: string | null
          last_success_at?: string | null
          platform?: string
          platform_name?: string
          priority?: number | null
          recovery_timeout?: number | null
          status?: string | null
          success_threshold?: number | null
          total_failures?: number | null
          total_requests?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: string
          phone: string | null
          phone_verified: boolean | null
          role: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id: string
          phone?: string | null
          phone_verified?: boolean | null
          role?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          phone?: string | null
          phone_verified?: boolean | null
          role?: string | null
          username?: string | null
        }
        Relationships: []
      }
      promoter_demand_links: {
        Row: {
          click_count: number | null
          code: string
          commission_earned: number | null
          connected_count: number | null
          created_at: string | null
          demand_id: string
          id: string
          promoter_id: string
          quote_count: number | null
        }
        Insert: {
          click_count?: number | null
          code: string
          commission_earned?: number | null
          connected_count?: number | null
          created_at?: string | null
          demand_id: string
          id?: string
          promoter_id: string
          quote_count?: number | null
        }
        Update: {
          click_count?: number | null
          code?: string
          commission_earned?: number | null
          connected_count?: number | null
          created_at?: string | null
          demand_id?: string
          id?: string
          promoter_id?: string
          quote_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promoter_demand_links_demand_id_fkey"
            columns: ["demand_id"]
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_demand_links_promoter_id_fkey"
            columns: ["promoter_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      promoters: {
        Row: {
          bio: string | null
          commission_rate: number | null
          contact_info: string | null
          content_category: string | null
          follower_count: number | null
          id: string
          is_public: boolean | null
          joined_at: string | null
          platform: string | null
          platform_username: string | null
          status: string
          total_earned: number | null
          total_withdrawn: number | null
          user_id: string
        }
        Insert: {
          bio?: string | null
          commission_rate?: number | null
          contact_info?: string | null
          content_category?: string | null
          follower_count?: number | null
          id?: string
          is_public?: boolean | null
          joined_at?: string | null
          platform?: string | null
          platform_username?: string | null
          status?: string
          total_earned?: number | null
          total_withdrawn?: number | null
          user_id: string
        }
        Update: {
          bio?: string | null
          commission_rate?: number | null
          contact_info?: string | null
          content_category?: string | null
          follower_count?: number | null
          id?: string
          is_public?: boolean | null
          joined_at?: string | null
          platform?: string | null
          platform_username?: string | null
          status?: string
          total_earned?: number | null
          total_withdrawn?: number | null
          user_id?: string
        }
        Relationships: []
      }
      promotion_assets: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          name: string | null
          tags: string[] | null
          type: string | null
          url: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          tags?: string[] | null
          type?: string | null
          url?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          tags?: string[] | null
          type?: string | null
          url?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      promotion_clicks: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          link_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          link_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          link_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotion_clicks_link_id_fkey"
            columns: ["link_id"]
            referencedRelation: "promotion_links"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_contents: {
        Row: {
          category: string | null
          content: Json
          created_at: string | null
          id: string
          images: string[] | null
          published_at: string | null
          scheduled_at: string | null
          source_id: string | null
          source_type: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          videos: string[] | null
        }
        Insert: {
          category?: string | null
          content?: Json
          created_at?: string | null
          id?: string
          images?: string[] | null
          published_at?: string | null
          scheduled_at?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          videos?: string[] | null
        }
        Update: {
          category?: string | null
          content?: Json
          created_at?: string | null
          id?: string
          images?: string[] | null
          published_at?: string | null
          scheduled_at?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          videos?: string[] | null
        }
        Relationships: []
      }
      promotion_landing_clicks: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          link_id: string
          promoter_id: string | null
          referrer: string | null
          tool_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          link_id: string
          promoter_id?: string | null
          referrer?: string | null
          tool_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          link_id?: string
          promoter_id?: string | null
          referrer?: string | null
          tool_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotion_landing_clicks_link_id_fkey"
            columns: ["link_id"]
            referencedRelation: "promotion_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_landing_clicks_promoter_id_fkey"
            columns: ["promoter_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_landing_clicks_tool_id_fkey"
            columns: ["tool_id"]
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_links: {
        Row: {
          click_count: number | null
          code: string
          commission_earned: number | null
          conversion_count: number | null
          created_at: string | null
          id: string
          landing_page_views: number | null
          promoter_id: string | null
          tool_id: string | null
          valid_conversions: number | null
        }
        Insert: {
          click_count?: number | null
          code: string
          commission_earned?: number | null
          conversion_count?: number | null
          created_at?: string | null
          id?: string
          landing_page_views?: number | null
          promoter_id?: string | null
          tool_id?: string | null
          valid_conversions?: number | null
        }
        Update: {
          click_count?: number | null
          code?: string
          commission_earned?: number | null
          conversion_count?: number | null
          created_at?: string | null
          id?: string
          landing_page_views?: number | null
          promoter_id?: string | null
          tool_id?: string | null
          valid_conversions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promotion_links_promoter_id_fkey"
            columns: ["promoter_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_links_tool_id_fkey"
            columns: ["tool_id"]
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_publish_logs: {
        Row: {
          content_id: string
          created_at: string | null
          error_message: string | null
          error_type: string | null
          executed_at: string | null
          id: string
          platform: string
          platform_post_id: string | null
          platform_url: string | null
          retry_count: number | null
          scheduled_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string | null
          error_message?: string | null
          error_type?: string | null
          executed_at?: string | null
          id?: string
          platform: string
          platform_post_id?: string | null
          platform_url?: string | null
          retry_count?: number | null
          scheduled_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string | null
          error_message?: string | null
          error_type?: string | null
          executed_at?: string | null
          id?: string
          platform?: string
          platform_post_id?: string | null
          platform_url?: string | null
          retry_count?: number | null
          scheduled_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_publish_logs_content_id_fkey"
            columns: ["content_id"]
            referencedRelation: "promotion_contents"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_settlements: {
        Row: {
          amount: number
          created_at: string | null
          developer_cost: number
          developer_id: string
          id: string
          link_id: string
          paid_at: string | null
          platform_fee: number
          promoter_earning: number
          promoter_id: string
          settlement_type: string
          status: string | null
          tool_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          developer_cost: number
          developer_id: string
          id?: string
          link_id: string
          paid_at?: string | null
          platform_fee: number
          promoter_earning: number
          promoter_id: string
          settlement_type: string
          status?: string | null
          tool_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          developer_cost?: number
          developer_id?: string
          id?: string
          link_id?: string
          paid_at?: string | null
          platform_fee?: number
          promoter_earning?: number
          promoter_id?: string
          settlement_type?: string
          status?: string | null
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_settlements_developer_id_fkey"
            columns: ["developer_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_settlements_link_id_fkey"
            columns: ["link_id"]
            referencedRelation: "promotion_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_settlements_promoter_id_fkey"
            columns: ["promoter_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_settlements_tool_id_fkey"
            columns: ["tool_id"]
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_tasks: {
        Row: {
          created_at: string | null
          current_clicks: number
          developer_id: string
          end_date: string
          id: string
          reward_amount: number
          spent_amount: number
          start_date: string
          status: string
          target_clicks: number
          tool_id: string
          total_budget: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_clicks?: number
          developer_id: string
          end_date: string
          id?: string
          reward_amount?: number
          spent_amount?: number
          start_date?: string
          status?: string
          target_clicks?: number
          tool_id: string
          total_budget: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_clicks?: number
          developer_id?: string
          end_date?: string
          id?: string
          reward_amount?: number
          spent_amount?: number
          start_date?: string
          status?: string
          target_clicks?: number
          tool_id?: string
          total_budget?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotion_tasks_developer_id_fkey"
            columns: ["developer_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_tasks_tool_id_fkey"
            columns: ["tool_id"]
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          platforms: string[] | null
          usage_count: number | null
          user_id: string | null
          variables: Json | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          platforms?: string[] | null
          usage_count?: number | null
          user_id?: string | null
          variables?: Json | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          platforms?: string[] | null
          usage_count?: number | null
          user_id?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      publish_task_queue: {
        Row: {
          completed_at: string | null
          content_id: string
          created_at: string | null
          executed_at: string | null
          id: string
          last_error: string | null
          last_error_type: string | null
          max_retries: number | null
          next_retry_at: string | null
          platform: string
          platform_post_id: string | null
          platform_url: string | null
          priority: number | null
          retry_count: number | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          content_id: string
          created_at?: string | null
          executed_at?: string | null
          id?: string
          last_error?: string | null
          last_error_type?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          platform: string
          platform_post_id?: string | null
          platform_url?: string | null
          priority?: number | null
          retry_count?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          content_id?: string
          created_at?: string | null
          executed_at?: string | null
          id?: string
          last_error?: string | null
          last_error_type?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          platform?: string
          platform_post_id?: string | null
          platform_url?: string | null
          priority?: number | null
          retry_count?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          amount: number
          created_at: string | null
          demand_id: string
          developer_id: string
          id: string
          period: string
          remark: string | null
          status: string
          updated_at: string | null
          viewed_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          demand_id: string
          developer_id: string
          id?: string
          period: string
          remark?: string | null
          status?: string
          updated_at?: string | null
          viewed_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          demand_id?: string
          developer_id?: string
          id?: string
          period?: string
          remark?: string | null
          status?: string
          updated_at?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_demand_id_fkey"
            columns: ["demand_id"]
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          content: string | null
          created_at: string | null
          demand_id: string | null
          developer_id: string
          id: string
          is_public: boolean | null
          rating: number
          reviewer_id: string
          tags: string[] | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          demand_id?: string | null
          developer_id: string
          id?: string
          is_public?: boolean | null
          rating: number
          reviewer_id: string
          tags?: string[] | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          demand_id?: string | null
          developer_id?: string
          id?: string
          is_public?: boolean | null
          rating?: number
          reviewer_id?: string
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_demand_id_fkey"
            columns: ["demand_id"]
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_developer_id_fkey"
            columns: ["developer_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_certificates: {
        Row: {
          certificate_code: string
          certificate_url: string | null
          created_at: string | null
          hash_value: string
          id: string
          timestamp: string
          tool_id: string | null
        }
        Insert: {
          certificate_code: string
          certificate_url?: string | null
          created_at?: string | null
          hash_value: string
          id?: string
          timestamp: string
          tool_id?: string | null
        }
        Update: {
          certificate_code?: string
          certificate_url?: string | null
          created_at?: string | null
          hash_value?: string
          id?: string
          timestamp?: string
          tool_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_certificates_tool_id_fkey"
            columns: ["tool_id"]
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_platform_links: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          platform: string
          platform_name: string
          qr_code_url: string | null
          sort_order: number | null
          tool_id: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          platform: string
          platform_name: string
          qr_code_url?: string | null
          sort_order?: number | null
          tool_id: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string
          platform_name?: string
          qr_code_url?: string | null
          sort_order?: number | null
          tool_id?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_platform_links_tool_id_fkey"
            columns: ["tool_id"]
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_promotion_settings: {
        Row: {
          created_at: string | null
          daily_budget: number | null
          developer_id: string
          id: string
          is_active: boolean | null
          max_promoter_reward: number | null
          min_promoter_reward: number | null
          pay_per_conversion: number | null
          pay_per_landing_view: number | null
          platform_fee_percentage: number | null
          promoter_fee_percentage: number | null
          promotion_type: string
          spent_amount: number | null
          tool_id: string
          total_budget: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          daily_budget?: number | null
          developer_id: string
          id?: string
          is_active?: boolean | null
          max_promoter_reward?: number | null
          min_promoter_reward?: number | null
          pay_per_conversion?: number | null
          pay_per_landing_view?: number | null
          platform_fee_percentage?: number | null
          promoter_fee_percentage?: number | null
          promotion_type: string
          spent_amount?: number | null
          tool_id: string
          total_budget?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          daily_budget?: number | null
          developer_id?: string
          id?: string
          is_active?: boolean | null
          max_promoter_reward?: number | null
          min_promoter_reward?: number | null
          pay_per_conversion?: number | null
          pay_per_landing_view?: number | null
          platform_fee_percentage?: number | null
          promoter_fee_percentage?: number | null
          promotion_type?: string
          spent_amount?: number | null
          tool_id?: string
          total_budget?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_promotion_settings_developer_id_fkey"
            columns: ["developer_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_promotion_settings_tool_id_fkey"
            columns: ["tool_id"]
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          developer_id: string | null
          developer_story: string | null
          icon_url: string | null
          id: string
          is_premium: boolean | null
          jump_count: number | null
          jump_type: string
          jump_url: string
          name: string
          screenshots: string[] | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          view_count: number | null
          offline_reason: string | null
          offline_reason_type: string | null
          rejection_reason: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          developer_id?: string | null
          developer_story?: string | null
          icon_url?: string | null
          id?: string
          is_premium?: boolean | null
          jump_count?: number | null
          jump_type: string
          jump_url: string
          name: string
          screenshots?: string[] | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          view_count?: number | null
          offline_reason?: string | null
          offline_reason_type?: string | null
          rejection_reason?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          developer_id?: string | null
          developer_story?: string | null
          icon_url?: string | null
          id?: string
          is_premium?: boolean | null
          jump_count?: number | null
          jump_type?: string
          jump_url?: string
          name?: string
          screenshots?: string[] | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          view_count?: number | null
          offline_reason?: string | null
          offline_reason_type?: string | null
          rejection_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tools_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tools_developer_id_fkey"
            columns: ["developer_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_operation_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_platform_auth: {
        Row: {
          access_token: string | null
          config: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          platform: string
          platform_user_id: string | null
          platform_username: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          platform: string
          platform_user_id?: string | null
          platform_username?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          platform?: string
          platform_user_id?: string | null
          platform_username?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_rdsvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      increment_demand_quote_count: {
        Args: { demand_id: string }
        Returns: undefined
      }
      increment_demand_view: {
        Args: { demand_id: string }
        Returns: undefined
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      rds_float_normalize_i16: {
        Args: { "": unknown }
        Returns: unknown
      }
      rds_vector_norm: {
        Args: { "": string }
        Returns: number
      }
      record_promotion_conversion: {
        Args: {
          promotion_code: string
          tool_id: string
          promoter_id: string
          ip_address: string
          user_agent: string
        }
        Returns: undefined
      }
      record_promotion_landing_view: {
        Args: {
          promotion_code: string
          tool_id: string
          ip_address: string
          user_agent: string
        }
        Returns: undefined
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
