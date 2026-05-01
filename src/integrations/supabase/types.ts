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
      audit_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          request_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          request_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          decided_at: string
          id: string
          notes: string | null
          outcome: Database["public"]["Enums"]["outcome_enum"]
          request_id: string
          reviewer_alias: string
        }
        Insert: {
          decided_at?: string
          id?: string
          notes?: string | null
          outcome: Database["public"]["Enums"]["outcome_enum"]
          request_id: string
          reviewer_alias: string
        }
        Update: {
          decided_at?: string
          id?: string
          notes?: string | null
          outcome?: Database["public"]["Enums"]["outcome_enum"]
          request_id?: string
          reviewer_alias?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      duplicate_links: {
        Row: {
          created_at: string
          duplicate_of: string
          id: string
          request_id: string
          similarity: number
          status: Database["public"]["Enums"]["dup_status_enum"]
        }
        Insert: {
          created_at?: string
          duplicate_of: string
          id?: string
          request_id: string
          similarity: number
          status?: Database["public"]["Enums"]["dup_status_enum"]
        }
        Update: {
          created_at?: string
          duplicate_of?: string
          id?: string
          request_id?: string
          similarity?: number
          status?: Database["public"]["Enums"]["dup_status_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "duplicate_links_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicate_links_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_scores: {
        Row: {
          confidence: Database["public"]["Enums"]["confidence_enum"]
          cost_avoidance: number
          feasibility: number
          generated_at: string
          id: string
          impact: number
          rationale: string
          request_id: string
          scale: number
          strategic_alignment: number
          total: number
        }
        Insert: {
          confidence: Database["public"]["Enums"]["confidence_enum"]
          cost_avoidance: number
          feasibility: number
          generated_at?: string
          id?: string
          impact: number
          rationale: string
          request_id: string
          scale: number
          strategic_alignment: number
          total: number
        }
        Update: {
          confidence?: Database["public"]["Enums"]["confidence_enum"]
          cost_avoidance?: number
          feasibility?: number
          generated_at?: string
          id?: string
          impact?: number
          rationale?: string
          request_id?: string
          scale?: number
          strategic_alignment?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "request_scores_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          ado_id: string | null
          classification: Database["public"]["Enums"]["classification_enum"]
          created_at: string
          description: string
          estimated_days: number | null
          id: string
          justification: string
          manual_rank: number | null
          requested_by: string
          reviewer_rating: number | null
          sbu: Database["public"]["Enums"]["sbu_enum"]
          source_ref: string | null
          status: Database["public"]["Enums"]["request_status_enum"]
          sxg_ado_id: string | null
          target_timeline: Database["public"]["Enums"]["timeline_enum"]
          title: string
          updated_at: string
          work_item_type: Database["public"]["Enums"]["work_item_type_enum"]
        }
        Insert: {
          ado_id?: string | null
          classification: Database["public"]["Enums"]["classification_enum"]
          created_at?: string
          description: string
          estimated_days?: number | null
          id?: string
          justification: string
          manual_rank?: number | null
          requested_by: string
          reviewer_rating?: number | null
          sbu: Database["public"]["Enums"]["sbu_enum"]
          source_ref?: string | null
          status?: Database["public"]["Enums"]["request_status_enum"]
          sxg_ado_id?: string | null
          target_timeline: Database["public"]["Enums"]["timeline_enum"]
          title: string
          updated_at?: string
          work_item_type: Database["public"]["Enums"]["work_item_type_enum"]
        }
        Update: {
          ado_id?: string | null
          classification?: Database["public"]["Enums"]["classification_enum"]
          created_at?: string
          description?: string
          estimated_days?: number | null
          id?: string
          justification?: string
          manual_rank?: number | null
          requested_by?: string
          reviewer_rating?: number | null
          sbu?: Database["public"]["Enums"]["sbu_enum"]
          source_ref?: string | null
          status?: Database["public"]["Enums"]["request_status_enum"]
          sxg_ado_id?: string | null
          target_timeline?: Database["public"]["Enums"]["timeline_enum"]
          title?: string
          updated_at?: string
          work_item_type?: Database["public"]["Enums"]["work_item_type_enum"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      classification_enum:
        | "Automation — Enhancement"
        | "Automation — New"
        | "Bug Fix"
        | "Data / Reporting"
        | "Infrastructure"
        | "Process Improvement"
        | "Tooling"
      confidence_enum: "high" | "medium" | "low"
      dup_status_enum: "suggested" | "confirmed" | "dismissed"
      outcome_enum: "approved" | "deferred" | "merged"
      request_status_enum:
        | "submitted"
        | "scored"
        | "in_review"
        | "approved"
        | "handed_off"
        | "deferred"
      sbu_enum: "MSS" | "SCIM" | "A&I" | "TPC"
      timeline_enum:
        | "FY27 Semester 1 — Sprint 1"
        | "FY27 Semester 1 — Sprint 2"
        | "FY27 Semester 1 — Sprint 3"
        | "FY27 Semester 2"
        | "Backlog"
      work_item_type_enum: "Feature" | "Bug" | "User Story" | "Task" | "Epic"
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
      classification_enum: [
        "Automation — Enhancement",
        "Automation — New",
        "Bug Fix",
        "Data / Reporting",
        "Infrastructure",
        "Process Improvement",
        "Tooling",
      ],
      confidence_enum: ["high", "medium", "low"],
      dup_status_enum: ["suggested", "confirmed", "dismissed"],
      outcome_enum: ["approved", "deferred", "merged"],
      request_status_enum: [
        "submitted",
        "scored",
        "in_review",
        "approved",
        "handed_off",
        "deferred",
      ],
      sbu_enum: ["MSS", "SCIM", "A&I", "TPC"],
      timeline_enum: [
        "FY27 Semester 1 — Sprint 1",
        "FY27 Semester 1 — Sprint 2",
        "FY27 Semester 1 — Sprint 3",
        "FY27 Semester 2",
        "Backlog",
      ],
      work_item_type_enum: ["Feature", "Bug", "User Story", "Task", "Epic"],
    },
  },
} as const
