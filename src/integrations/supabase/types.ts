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
      admin_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invitation_token: string
          invited_by: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invitation_token: string
          invited_by: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: Json
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          permissions?: Json
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: Json
        }
        Relationships: []
      }
      associations: {
        Row: {
          address: string | null
          city: string | null
          contact_person: string | null
          created_at: string
          ice_number: string | null
          id: string
          name: string
          updated_at: string
          verification_status: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          created_at?: string
          ice_number?: string | null
          id?: string
          name: string
          updated_at?: string
          verification_status?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          created_at?: string
          ice_number?: string | null
          id?: string
          name?: string
          updated_at?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          accompanists_count: number | null
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
          students_count: number | null
          total_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accompanists_count?: number | null
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
          students_count?: number | null
          total_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accompanists_count?: number | null
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
          students_count?: number | null
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
      documents: {
        Row: {
          booking_id: string
          created_at: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_url: string
          id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_url: string
          id?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string
          file_url?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_booking_id_fkey"
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
          ice: string | null
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
          ice?: string | null
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
          ice?: string | null
          id?: string
          max_free_tickets?: number | null
          name?: string
          type?: Database["public"]["Enums"]["organization_type"]
          updated_at?: string
          verification_status?: boolean | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          id: string
          method: string
          status: Database["public"]["Enums"]["payment_status"] | null
          transaction_reference: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          id?: string
          method: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          transaction_reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          method?: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          transaction_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          admin_permissions: Json | null
          admin_role: string | null
          association_id: string | null
          city: string | null
          consent_date: string | null
          contact_person: string | null
          created_at: string
          email: string
          email_consent: boolean | null
          first_name: string | null
          full_name: string | null
          ice_number: string | null
          id: string
          is_verified: boolean | null
          last_name: string | null
          name: string | null
          organization_id: string | null
          phone: string | null
          privacy_accepted: boolean | null
          professional_email: string | null
          school_id: string | null
          season_verified_at: string | null
          terms_accepted: boolean | null
          updated_at: string
          user_id: string
          verification_documents: string[] | null
          verification_status: string | null
          whatsapp: string | null
          whatsapp_consent: boolean | null
        }
        Insert: {
          address?: string | null
          admin_permissions?: Json | null
          admin_role?: string | null
          association_id?: string | null
          city?: string | null
          consent_date?: string | null
          contact_person?: string | null
          created_at?: string
          email: string
          email_consent?: boolean | null
          first_name?: string | null
          full_name?: string | null
          ice_number?: string | null
          id?: string
          is_verified?: boolean | null
          last_name?: string | null
          name?: string | null
          organization_id?: string | null
          phone?: string | null
          privacy_accepted?: boolean | null
          professional_email?: string | null
          school_id?: string | null
          season_verified_at?: string | null
          terms_accepted?: boolean | null
          updated_at?: string
          user_id: string
          verification_documents?: string[] | null
          verification_status?: string | null
          whatsapp?: string | null
          whatsapp_consent?: boolean | null
        }
        Update: {
          address?: string | null
          admin_permissions?: Json | null
          admin_role?: string | null
          association_id?: string | null
          city?: string | null
          consent_date?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string
          email_consent?: boolean | null
          first_name?: string | null
          full_name?: string | null
          ice_number?: string | null
          id?: string
          is_verified?: boolean | null
          last_name?: string | null
          name?: string | null
          organization_id?: string | null
          phone?: string | null
          privacy_accepted?: boolean | null
          professional_email?: string | null
          school_id?: string | null
          season_verified_at?: string | null
          terms_accepted?: boolean | null
          updated_at?: string
          user_id?: string
          verification_documents?: string[] | null
          verification_status?: string | null
          whatsapp?: string | null
          whatsapp_consent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          domain: string | null
          ice_number: string | null
          id: string
          name: string
          school_type: string
          updated_at: string
          verification_status: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          domain?: string | null
          ice_number?: string | null
          id?: string
          name: string
          school_type: string
          updated_at?: string
          verification_status?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          domain?: string | null
          ice_number?: string | null
          id?: string
          name?: string
          school_type?: string
          updated_at?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          b2c_capacity: number
          city: string | null
          created_at: string
          datetime: string | null
          id: string
          is_active: boolean | null
          partner_quota: number | null
          price_mad: number
          session_date: string
          session_time: string
          session_type: string | null
          spectacle_id: string
          status: string | null
          total_capacity: number
          updated_at: string
          venue: string
        }
        Insert: {
          b2c_capacity: number
          city?: string | null
          created_at?: string
          datetime?: string | null
          id?: string
          is_active?: boolean | null
          partner_quota?: number | null
          price_mad?: number
          session_date: string
          session_time: string
          session_type?: string | null
          spectacle_id: string
          status?: string | null
          total_capacity: number
          updated_at?: string
          venue: string
        }
        Update: {
          b2c_capacity?: number
          city?: string | null
          created_at?: string
          datetime?: string | null
          id?: string
          is_active?: boolean | null
          partner_quota?: number | null
          price_mad?: number
          session_date?: string
          session_time?: string
          session_type?: string | null
          spectacle_id?: string
          status?: string | null
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
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          level_range: string | null
          poster_url: string | null
          price: number | null
          title: string
          updated_at: string
        }
        Insert: {
          age_range_max?: number | null
          age_range_min?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          level_range?: string | null
          poster_url?: string | null
          price?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          age_range_max?: number | null
          age_range_min?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          level_range?: string | null
          poster_url?: string | null
          price?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          assigned_to: string | null
          association_name: string | null
          booking_id: string
          created_at: string
          holder_name: string | null
          id: string
          partner_name: string | null
          pdf_url: string | null
          qr_code: string
          seat_number: string | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          ticket_number: string
          updated_at: string
          used_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          association_name?: string | null
          booking_id: string
          created_at?: string
          holder_name?: string | null
          id?: string
          partner_name?: string | null
          pdf_url?: string | null
          qr_code: string
          seat_number?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          ticket_number: string
          updated_at?: string
          used_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          association_name?: string | null
          booking_id?: string
          created_at?: string
          holder_name?: string | null
          id?: string
          partner_name?: string | null
          pdf_url?: string | null
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
      has_admin_permission: {
        Args: { permission_name: string }
        Returns: boolean
      }
      verify_api_key: {
        Args: { api_key_input: string }
        Returns: {
          is_valid: boolean
          key_id: string
          permissions: Json
        }[]
      }
    }
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "awaiting_verification"
        | "approved"
        | "rejected"
      communication_status: "pending" | "sent" | "delivered" | "failed"
      communication_type: "email" | "whatsapp" | "sms"
      document_type: "devis" | "invoice" | "ticket"
      organization_type:
        | "private_school"
        | "public_school"
        | "association"
        | "partner"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      ticket_status: "active" | "used" | "cancelled"
      user_role:
        | "b2c_user"
        | "teacher_private"
        | "teacher_public"
        | "association"
        | "partner"
        | "admin_spectacles"
        | "admin_schools"
        | "admin_partners"
        | "admin_support"
        | "admin_notifications"
        | "admin_editor"
        | "admin_full"
        | "super_admin"
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
      booking_status: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "awaiting_verification",
        "approved",
        "rejected",
      ],
      communication_status: ["pending", "sent", "delivered", "failed"],
      communication_type: ["email", "whatsapp", "sms"],
      document_type: ["devis", "invoice", "ticket"],
      organization_type: [
        "private_school",
        "public_school",
        "association",
        "partner",
      ],
      payment_status: ["pending", "completed", "failed", "refunded"],
      ticket_status: ["active", "used", "cancelled"],
      user_role: [
        "b2c_user",
        "teacher_private",
        "teacher_public",
        "association",
        "partner",
        "admin_spectacles",
        "admin_schools",
        "admin_partners",
        "admin_support",
        "admin_notifications",
        "admin_editor",
        "admin_full",
        "super_admin",
      ],
    },
  },
} as const
