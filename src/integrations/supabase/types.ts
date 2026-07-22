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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          active: boolean
          created_at: string
          cta_href: string | null
          cta_label: string | null
          id: string
          message: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          id?: string
          message: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          id?: string
          message?: string
          updated_at?: string
        }
        Relationships: []
      }
      bursary_applications: {
        Row: {
          admin_notes: string | null
          amount_requested: number
          created_at: string
          fee_structure_path: string | null
          id: string
          level: string
          reason: string | null
          result_slip_path: string | null
          school: string
          school_receipt_path: string | null
          status: Database["public"]["Enums"]["bursary_status"]
          student_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount_requested: number
          created_at?: string
          fee_structure_path?: string | null
          id?: string
          level: string
          reason?: string | null
          result_slip_path?: string | null
          school: string
          school_receipt_path?: string | null
          status?: Database["public"]["Enums"]["bursary_status"]
          student_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount_requested?: number
          created_at?: string
          fee_structure_path?: string | null
          id?: string
          level?: string
          reason?: string | null
          result_slip_path?: string | null
          school?: string
          school_receipt_path?: string | null
          status?: Database["public"]["Enums"]["bursary_status"]
          student_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      facilities: {
        Row: {
          assessment_notes: string | null
          assessment_score: number | null
          category: string
          created_at: string
          id: string
          last_assessed: string | null
          location: string | null
          name: string
          updated_at: string
          ward: string
        }
        Insert: {
          assessment_notes?: string | null
          assessment_score?: number | null
          category: string
          created_at?: string
          id?: string
          last_assessed?: string | null
          location?: string | null
          name: string
          updated_at?: string
          ward: string
        }
        Update: {
          assessment_notes?: string | null
          assessment_score?: number | null
          category?: string
          created_at?: string
          id?: string
          last_assessed?: string | null
          location?: string | null
          name?: string
          updated_at?: string
          ward?: string
        }
        Relationships: []
      }
      issue_reports: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          description: string
          id: string
          location: string | null
          photo_path: string | null
          status: Database["public"]["Enums"]["report_status"]
          title: string
          updated_at: string
          user_id: string
          ward: string | null
        }
        Insert: {
          admin_notes?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          location?: string | null
          photo_path?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          title: string
          updated_at?: string
          user_id: string
          ward?: string | null
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          location?: string | null
          photo_path?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          title?: string
          updated_at?: string
          user_id?: string
          ward?: string | null
        }
        Relationships: []
      }
      login_events: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          author_id: string | null
          body: string | null
          created_at: string
          id: string
          published: boolean
          summary: string
          tag: string | null
          title: string
          updated_at: string
          ward: string | null
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          published?: boolean
          summary: string
          tag?: string | null
          title: string
          updated_at?: string
          ward?: string | null
        }
        Update: {
          author_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          published?: boolean
          summary?: string
          tag?: string | null
          title?: string
          updated_at?: string
          ward?: string | null
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          apply_url: string | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          location: string | null
          organization: string
          published: boolean
          title: string
          type: Database["public"]["Enums"]["opportunity_type"]
          updated_at: string
        }
        Insert: {
          apply_url?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          location?: string | null
          organization: string
          published?: boolean
          title: string
          type: Database["public"]["Enums"]["opportunity_type"]
          updated_at?: string
        }
        Update: {
          apply_url?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          location?: string | null
          organization?: string
          published?: boolean
          title?: string
          type?: Database["public"]["Enums"]["opportunity_type"]
          updated_at?: string
        }
        Relationships: []
      }
      opportunity_applications: {
        Row: {
          additional_doc_path: string | null
          admin_notes: string | null
          applicant_name: string
          cover_letter: string | null
          created_at: string
          cv_path: string | null
          id: string
          opportunity_id: string
          phone: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_doc_path?: string | null
          admin_notes?: string | null
          applicant_name: string
          cover_letter?: string | null
          created_at?: string
          cv_path?: string | null
          id?: string
          opportunity_id: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_doc_path?: string | null
          admin_notes?: string | null
          applicant_name?: string
          cover_letter?: string | null
          created_at?: string
          cv_path?: string | null
          id?: string
          opportunity_id?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          national_id: string | null
          phone: string | null
          phone_verified: boolean
          residency_rejection_reason: string | null
          residency_reviewed_at: string | null
          residency_reviewed_by: string | null
          residency_status: Database["public"]["Enums"]["residency_status"]
          residency_submitted_at: string | null
          updated_at: string
          ward: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          national_id?: string | null
          phone?: string | null
          phone_verified?: boolean
          residency_rejection_reason?: string | null
          residency_reviewed_at?: string | null
          residency_reviewed_by?: string | null
          residency_status?: Database["public"]["Enums"]["residency_status"]
          residency_submitted_at?: string | null
          updated_at?: string
          ward?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          national_id?: string | null
          phone?: string | null
          phone_verified?: boolean
          residency_rejection_reason?: string | null
          residency_reviewed_at?: string | null
          residency_reviewed_by?: string | null
          residency_status?: Database["public"]["Enums"]["residency_status"]
          residency_submitted_at?: string | null
          updated_at?: string
          ward?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          progress: number
          published: boolean
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string
          ward: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          progress?: number
          published?: boolean
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at?: string
          ward: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          progress?: number
          published?: boolean
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          updated_at?: string
          ward?: string
        }
        Relationships: []
      }
      saved_opportunities: {
        Row: {
          created_at: string
          opportunity_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          opportunity_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          opportunity_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_opportunities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "resident"
      bursary_status: "pending" | "approved" | "rejected" | "disbursed"
      opportunity_type: "Job" | "Internship" | "Attachment" | "Tender"
      project_status: "Planning" | "Active" | "Completed"
      report_status: "pending" | "in_progress" | "resolved" | "rejected"
      residency_status: "unverified" | "pending" | "verified" | "rejected"
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
      app_role: ["admin", "resident"],
      bursary_status: ["pending", "approved", "rejected", "disbursed"],
      opportunity_type: ["Job", "Internship", "Attachment", "Tender"],
      project_status: ["Planning", "Active", "Completed"],
      report_status: ["pending", "in_progress", "resolved", "rejected"],
      residency_status: ["unverified", "pending", "verified", "rejected"],
    },
  },
} as const
