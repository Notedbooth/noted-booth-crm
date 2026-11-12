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
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          changes: Json
          created_at: string
          customer_id: string | null
          entity_id: string | null
          entity_label: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          changes?: Json
          created_at?: string
          customer_id?: string | null
          entity_id?: string | null
          entity_label?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          changes?: Json
          created_at?: string
          customer_id?: string | null
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_requests: {
        Row: {
          city: string | null
          converted_customer_id: string | null
          converted_lead_id: string | null
          created_at: string
          created_by: string | null
          email: string | null
          event_date: string | null
          event_type: string | null
          external_ref: string | null
          full_name: string
          guests: number | null
          id: string
          message: string | null
          package_name: string | null
          payload: Json | null
          phone: string | null
          source: string
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          updated_by: string | null
          venue: string | null
        }
        Insert: {
          city?: string | null
          converted_customer_id?: string | null
          converted_lead_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          event_date?: string | null
          event_type?: string | null
          external_ref?: string | null
          full_name: string
          guests?: number | null
          id?: string
          message?: string | null
          package_name?: string | null
          payload?: Json | null
          phone?: string | null
          source?: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          updated_by?: string | null
          venue?: string | null
        }
        Update: {
          city?: string | null
          converted_customer_id?: string | null
          converted_lead_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          event_date?: string | null
          event_type?: string | null
          external_ref?: string | null
          full_name?: string
          guests?: number | null
          id?: string
          message?: string | null
          package_name?: string | null
          payload?: Json | null
          phone?: string | null
          source?: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          updated_by?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_converted_customer_id_fkey"
            columns: ["converted_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_converted_lead_id_fkey"
            columns: ["converted_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          assigned_to: string | null
          booking_number: string
          city: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          end_time: string | null
          event_date: string
          event_type: string | null
          external_ref: string | null
          guests: number | null
          id: string
          lead_id: string | null
          operational_notes: string | null
          package_id: string | null
          source: string
          start_time: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_value: number | null
          updated_at: string
          updated_by: string | null
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          assigned_to?: string | null
          booking_number?: string
          city?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          end_time?: string | null
          event_date: string
          event_type?: string | null
          external_ref?: string | null
          guests?: number | null
          id?: string
          lead_id?: string | null
          operational_notes?: string | null
          package_id?: string | null
          source?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_value?: number | null
          updated_at?: string
          updated_by?: string | null
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          assigned_to?: string | null
          booking_number?: string
          city?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          end_time?: string | null
          event_date?: string
          event_type?: string | null
          external_ref?: string | null
          guests?: number | null
          id?: string
          lead_id?: string | null
          operational_notes?: string | null
          package_id?: string | null
          source?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_value?: number | null
          updated_at?: string
          updated_by?: string | null
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_interactions: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          lead_id: string | null
          occurred_at: string
          type: Database["public"]["Enums"]["interaction_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          lead_id?: string | null
          occurred_at?: string
          type?: Database["public"]["Enums"]["interaction_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          lead_id?: string | null
          occurred_at?: string
          type?: Database["public"]["Enums"]["interaction_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_interactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_interactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_interactions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          city: string | null
          company: string | null
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          source: string | null
          updated_at: string
          updated_by: string | null
          whatsapp: string | null
        }
        Insert: {
          city?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          updated_at?: string
          updated_by?: string | null
          whatsapp?: string | null
        }
        Update: {
          city?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          updated_at?: string
          updated_by?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          estimated_value: number | null
          event_date: string | null
          event_type: string | null
          guests: number | null
          id: string
          lost_reason: string | null
          notes: string | null
          package_id: string | null
          source: string | null
          stage: Database["public"]["Enums"]["lead_stage"]
          stage_changed_at: string
          title: string
          updated_at: string
          updated_by: string | null
          venue: string | null
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          estimated_value?: number | null
          event_date?: string | null
          event_type?: string | null
          guests?: number | null
          id?: string
          lost_reason?: string | null
          notes?: string | null
          package_id?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          stage_changed_at?: string
          title: string
          updated_at?: string
          updated_by?: string | null
          venue?: string | null
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          estimated_value?: number | null
          event_date?: string | null
          event_type?: string | null
          guests?: number | null
          id?: string
          lost_reason?: string | null
          notes?: string | null
          package_id?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          stage_changed_at?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_hours: number | null
          id: string
          is_active: boolean
          name: string
          price: number | null
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_active?: boolean
          name: string
          price?: number | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "packages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packages_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          booking_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assigned_to?: string | null
          booking_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assigned_to?: string | null
          booking_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      setup_required: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "sales" | "operations"
      booking_status:
        | "tentative"
        | "confirmed"
        | "in_preparation"
        | "in_progress"
        | "completed"
        | "cancelled"
      interaction_type: "call" | "whatsapp" | "email" | "meeting" | "note"
      lead_stage:
        | "new_lead"
        | "contacted"
        | "interested"
        | "quote_sent"
        | "negotiation"
        | "confirmed"
        | "in_execution"
        | "completed"
        | "lost"
      request_status: "new" | "converted" | "rejected"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "open" | "in_progress" | "done" | "cancelled"
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
      app_role: ["admin", "manager", "sales", "operations"],
      booking_status: [
        "tentative",
        "confirmed",
        "in_preparation",
        "in_progress",
        "completed",
        "cancelled",
      ],
      interaction_type: ["call", "whatsapp", "email", "meeting", "note"],
      lead_stage: [
        "new_lead",
        "contacted",
        "interested",
        "quote_sent",
        "negotiation",
        "confirmed",
        "in_execution",
        "completed",
        "lost",
      ],
      request_status: ["new", "converted", "rejected"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["open", "in_progress", "done", "cancelled"],
    },
  },
} as const
