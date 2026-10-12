export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_usage: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          quota_period: string
          usage_type: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          quota_period?: string
          usage_type?: string
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          quota_period?: string
          usage_type?: string
          user_id?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          attachment_link: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          message: string
          opportunity_id: string
          status: string
          user_id: string
        }
        Insert: {
          attachment_link?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string
          opportunity_id: string
          status?: string
          user_id?: string
        }
        Update: {
          attachment_link?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string
          opportunity_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      book_links: {
        Row: {
          book_id: string
          external_link: string
        }
        Insert: {
          book_id: string
          external_link: string
        }
        Update: {
          book_id?: string
          external_link?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_links_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: true
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author: string | null
          cover_path: string | null
          created_at: string
          currency: string
          domain: string
          file_path: string | null
          id: string
          page_count: number | null
          price_usd: number | null
          publication_date: string | null
          publication_place: string | null
          publisher: string | null
          status: string
          subtitle: string | null
          summary: string
          summary_generated: boolean
          summary_validated: boolean
          title: string
          user_id: string | null
        }
        Insert: {
          author?: string | null
          cover_path?: string | null
          created_at?: string
          currency?: string
          domain: string
          file_path?: string | null
          id?: string
          page_count?: number | null
          price_usd?: number | null
          publication_date?: string | null
          publication_place?: string | null
          publisher?: string | null
          status?: string
          subtitle?: string | null
          summary?: string
          summary_generated?: boolean
          summary_validated?: boolean
          title: string
          user_id?: string | null
        }
        Update: {
          author?: string | null
          cover_path?: string | null
          created_at?: string
          currency?: string
          domain?: string
          file_path?: string | null
          id?: string
          page_count?: number | null
          price_usd?: number | null
          publication_date?: string | null
          publication_place?: string | null
          publisher?: string | null
          status?: string
          subtitle?: string | null
          summary?: string
          summary_generated?: boolean
          summary_validated?: boolean
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string
          created_at: string
          doc_type: string
          id: string
          order_id: string | null
          sent: boolean
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content?: string
          created_at?: string
          doc_type?: string
          id?: string
          order_id?: string | null
          sent?: boolean
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          doc_type?: string
          id?: string
          order_id?: string | null
          sent?: boolean
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          conditions: string | null
          contact_email: string
          created_at: string
          deadline: string | null
          description: string
          documents: string | null
          domain: string
          external_link: string | null
          id: string
          kind: string
          location: string | null
          organisation: string
          qualifications: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conditions?: string | null
          contact_email: string
          created_at?: string
          deadline?: string | null
          description?: string
          documents?: string | null
          domain?: string
          external_link?: string | null
          id?: string
          kind?: string
          location?: string | null
          organisation: string
          qualifications?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          conditions?: string | null
          contact_email?: string
          created_at?: string
          deadline?: string | null
          description?: string
          documents?: string | null
          domain?: string
          external_link?: string | null
          id?: string
          kind?: string
          location?: string | null
          organisation?: string
          qualifications?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          attachment_link: string | null
          book_id: string | null
          created_at: string
          details: string | null
          email: string | null
          full_name: string
          id: string
          item: string
          kind: string
          modality: string | null
          paid: boolean
          payment_method: string | null
          payment_ref: string | null
          phone: string
          price_usd: number | null
          status: string
          user_id: string
        }
        Insert: {
          attachment_link?: string | null
          book_id?: string | null
          created_at?: string
          details?: string | null
          email?: string | null
          full_name: string
          id?: string
          item: string
          kind?: string
          modality?: string | null
          paid?: boolean
          payment_method?: string | null
          payment_ref?: string | null
          phone: string
          price_usd?: number | null
          status?: string
          user_id?: string
        }
        Update: {
          attachment_link?: string | null
          book_id?: string | null
          created_at?: string
          details?: string | null
          email?: string | null
          full_name?: string
          id?: string
          item?: string
          kind?: string
          modality?: string | null
          paid?: boolean
          payment_method?: string | null
          payment_ref?: string | null
          phone?: string
          price_usd?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          marital_status: string | null
          phone: string | null
          physical_address: string | null
          post_nom: string | null
          research_domain: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id: string
          last_name: string
          marital_status?: string | null
          phone?: string | null
          physical_address?: string | null
          post_nom?: string | null
          research_domain?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          marital_status?: string | null
          phone?: string | null
          physical_address?: string | null
          post_nom?: string | null
          research_domain?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          currency: string
          daily_conversation_limit: number
          duration_months: number
          features: string[]
          id: string
          is_active: boolean
          plan_code: string
          plan_name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          daily_conversation_limit: number
          duration_months: number
          features?: string[]
          id?: string
          is_active?: boolean
          plan_code: string
          plan_name: string
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          daily_conversation_limit?: number
          duration_months?: number
          features?: string[]
          id?: string
          is_active?: boolean
          plan_code?: string
          plan_name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          duration_months: number
          expires_at: string | null
          id: string
          payment_provider: string | null
          payment_reference: string | null
          plan_code: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          duration_months: number
          expires_at?: string | null
          id?: string
          payment_provider?: string | null
          payment_reference?: string | null
          plan_code: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          duration_months?: number
          expires_at?: string | null
          id?: string
          payment_provider?: string | null
          payment_reference?: string | null
          plan_code?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_docs: {
        Row: {
          category: string
          content: string
          created_at: string
          favorite: boolean
          id: string
          tags: string[]
          title: string
          updated_at: string
          user_id: string
          word_count: number
        }
        Insert: {
          category?: string
          content?: string
          created_at?: string
          favorite?: boolean
          id?: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
          word_count?: number
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          favorite?: boolean
          id?: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
          word_count?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_book: { Args: { _book: string }; Returns: boolean }
      consume_ai_quota: { Args: never; Returns: Json }
      current_daily_limit: { Args: { _user: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
