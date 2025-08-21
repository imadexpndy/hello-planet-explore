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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_type: string
          confirmation_deadline: string | null
          created_at: string
          devis_url: string | null
          id: string
          notes: string | null
          number_of_tickets: number
          organization_id: string | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          session_id: string
          status: Database["public"]["Enums"]["booking_status"] | null
          total_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_type: string
          confirmation_deadline?: string | null
          created_at?: string
          devis_url?: string | null
          id?: string
          notes?: string | null
          number_of_tickets: number
          organization_id?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          session_id: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_type?: string
          confirmation_deadline?: string | null
          created_at?: string
          devis_url?: string | null
          id?: string
          notes?: string | null
          number_of_tickets?: number
          organization_id?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          session_id?: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          booking_id: string | null
          content: string
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          recipient: string
          sent_at: string | null
          status: Database["public"]["Enums"]["communication_status"] | null
          subject: string | null
          template_name: string | null
          type: Database["public"]["Enums"]["communication_type"]
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          content: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          recipient: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["communication_status"] | null
          subject?: string | null
          template_name?: string | null
          type: Database["public"]["Enums"]["communication_type"]
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          content?: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          recipient?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["communication_status"] | null
          subject?: string | null
          template_name?: string | null
          type?: Database["public"]["Enums"]["communication_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          max_free_tickets: number | null
          name: string
          type: Database["public"]["Enums"]["organization_type"]
          updated_at: string
          verification_status: boolean | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          max_free_tickets?: number | null
          name: string
          type: Database["public"]["Enums"]["organization_type"]
          updated_at?: string
          verification_status?: boolean | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          max_free_tickets?: number | null
          name?: string
          type?: Database["public"]["Enums"]["organization_type"]
          updated_at?: string
          verification_status?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_verified: boolean | null
          last_name: string | null
          organization_id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          is_verified?: boolean | null
          last_name?: string | null
          organization_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_verified?: boolean | null
          last_name?: string | null
          organization_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          b2c_capacity: number
          created_at: string
          id: string
          is_active: boolean | null
          partner_quota: number | null
          price_mad: number
          session_date: string
          session_time: string
          spectacle_id: string
          total_capacity: number
          updated_at: string
          venue: string
        }
        Insert: {
          b2c_capacity: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          partner_quota?: number | null
          price_mad?: number
          session_date: string
          session_time: string
          spectacle_id: string
          total_capacity: number
          updated_at?: string
          venue: string
        }
        Update: {
          b2c_capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          partner_quota?: number | null
          price_mad?: number
          session_date?: string
          session_time?: string
          spectacle_id?: string
          total_capacity?: number
          updated_at?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_spectacle_id_fkey"
            columns: ["spectacle_id"]
            isOneToOne: false
            referencedRelation: "spectacles"
            referencedColumns: ["id"]
          },
        ]
      }
      spectacles: {
        Row: {
          age_range_max: number | null
          age_range_min: number | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          poster_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          age_range_max?: number | null
          age_range_min?: number | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          poster_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          age_range_max?: number | null
          age_range_min?: number | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          poster_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          booking_id: string
          created_at: string
          holder_name: string | null
          id: string
          qr_code: string
          seat_number: string | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          ticket_number: string
          updated_at: string
          used_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          holder_name?: string | null
          id?: string
          qr_code: string
          seat_number?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          ticket_number: string
          updated_at?: string
          used_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          holder_name?: string | null
          id?: string
          qr_code?: string
          seat_number?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          ticket_number?: string
          updated_at?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      communication_status: "pending" | "sent" | "delivered" | "failed"
      communication_type: "email" | "whatsapp" | "sms"
      organization_type:
        | "private_school"
        | "public_school"
        | "association"
        | "partner"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      ticket_status: "active" | "used" | "cancelled"
      user_role:
        | "admin"
        | "teacher_private"
        | "teacher_public"
        | "association"
        | "partner"
        | "b2c_user"
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
  public: {
    Enums: {
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      communication_status: ["pending", "sent", "delivered", "failed"],
      communication_type: ["email", "whatsapp", "sms"],
      organization_type: [
        "private_school",
        "public_school",
        "association",
        "partner",
      ],
      payment_status: ["pending", "completed", "failed", "refunded"],
      ticket_status: ["active", "used", "cancelled"],
      user_role: [
        "admin",
        "teacher_private",
        "teacher_public",
        "association",
        "partner",
        "b2c_user",
      ],
    },
  },
} as const
