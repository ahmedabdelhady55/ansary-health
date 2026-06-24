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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          active: boolean
          created_at: string
          id: string
          image_url: string
          link: string
          sort_order: number
          text: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string
          link?: string
          sort_order?: number
          text?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string
          link?: string
          sort_order?: number
          text?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          name_en: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          name_en?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          name_en?: string
          sort_order?: number
        }
        Relationships: []
      }
      conversation_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          image_url: string | null
          message: string
          sender_type: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          message?: string
          sender_type?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          message?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
          user_name: string
          user_phone: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
          user_name?: string
          user_phone?: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
          user_name?: string
          user_phone?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          password_hash: string
          permissions: string[]
          phone: string
          role: string
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          name: string
          password_hash: string
          permissions?: string[]
          phone: string
          role?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          password_hash?: string
          permissions?: string[]
          phone?: string
          role?: string
        }
        Relationships: []
      }
      loyalty_rules: {
        Row: {
          category: string
          category_en: string
          id: string
          points_earned: number
          spend_amount: number
        }
        Insert: {
          category: string
          category_en?: string
          id?: string
          points_earned?: number
          spend_amount?: number
        }
        Update: {
          category?: string
          category_en?: string
          id?: string
          points_earned?: number
          spend_amount?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          price: number
          product_id: string | null
          product_name: string
          quantity: number
        }
        Insert: {
          id?: string
          order_id: string
          price?: number
          product_id?: string | null
          product_name: string
          quantity?: number
        }
        Update: {
          id?: string
          order_id?: string
          price?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_name: string
          customer_phone: string
          id: string
          order_number: number
          payment_confirmed: boolean
          payment_method: string
          payment_proof: string
          status: string
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          customer_phone: string
          id?: string
          order_number?: number
          payment_confirmed?: boolean
          payment_method?: string
          payment_proof?: string
          status?: string
          total?: number
          user_id: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          order_number?: number
          payment_confirmed?: boolean
          payment_method?: string
          payment_proof?: string
          status?: string
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      pending_cart_items: {
        Row: {
          category: string
          conversation_id: string | null
          created_at: string
          id: string
          image: string
          name: string
          name_en: string
          price: number
          status: string
          user_id: string
        }
        Insert: {
          category?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          image?: string
          name?: string
          name_en?: string
          price?: number
          status?: string
          user_id: string
        }
        Update: {
          category?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          image?: string
          name?: string
          name_en?: string
          price?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_cart_items_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          available: boolean
          category_id: string
          created_at: string
          description: string
          description_en: string
          discount: number
          discount_type: string
          id: string
          image: string
          name: string
          name_en: string
          price: number
        }
        Insert: {
          available?: boolean
          category_id: string
          created_at?: string
          description?: string
          description_en?: string
          discount?: number
          discount_type?: string
          id?: string
          image?: string
          name: string
          name_en?: string
          price?: number
        }
        Update: {
          available?: boolean
          category_id?: string
          created_at?: string
          description?: string
          description_en?: string
          discount?: number
          discount_type?: string
          id?: string
          image?: string
          name?: string
          name_en?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string
          created_at: string
          email: string
          id: string
          loyalty_points: number
          name: string
          phone: string
          total_purchases: number
        }
        Insert: {
          address?: string
          created_at?: string
          email?: string
          id: string
          loyalty_points?: number
          name: string
          phone: string
          total_purchases?: number
        }
        Update: {
          address?: string
          created_at?: string
          email?: string
          id?: string
          loyalty_points?: number
          name?: string
          phone?: string
          total_purchases?: number
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value?: string
        }
        Update: {
          key?: string
          value?: string
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
      employees_public: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          name: string | null
          permissions: string[] | null
          phone: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          name?: string | null
          permissions?: string[] | null
          phone?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          name?: string | null
          permissions?: string[] | null
          phone?: string | null
          role?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      bootstrap_first_admin: { Args: never; Returns: boolean }
      get_login_email_by_phone: { Args: { _phone: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      normalize_phone: { Args: { input: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
