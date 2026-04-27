export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.4';
  };
  public: {
    Tables: {
      mfa_settings: {
        Row: {
          created_at: string;
          email_enabled: boolean;
          fido2_enabled: boolean;
          id: number;
          otp_enabled: boolean;
          otp_secret: string | null;
          phone_number: string | null;
          required: boolean;
          sms_enabled: boolean;
          updated_at: string;
          user_id: number;
        };
        Insert: {
          created_at?: string;
          email_enabled?: boolean;
          fido2_enabled?: boolean;
          id?: number;
          otp_enabled?: boolean;
          otp_secret?: string | null;
          phone_number?: string | null;
          required?: boolean;
          sms_enabled?: boolean;
          updated_at?: string;
          user_id: number;
        };
        Update: {
          created_at?: string;
          email_enabled?: boolean;
          fido2_enabled?: boolean;
          id?: number;
          otp_enabled?: boolean;
          otp_secret?: string | null;
          phone_number?: string | null;
          required?: boolean;
          sms_enabled?: boolean;
          updated_at?: string;
          user_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'mfa_settings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      oidc_clients: {
        Row: {
          allowed_redirect_uris: Json;
          client_id: string;
          client_secret: string | null;
          created_at: string;
          name: string | null;
          scopes: Json | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          allowed_redirect_uris: Json;
          client_id: string;
          client_secret?: string | null;
          created_at?: string;
          name?: string | null;
          scopes?: Json | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          allowed_redirect_uris?: Json;
          client_id?: string;
          client_secret?: string | null;
          created_at?: string;
          name?: string | null;
          scopes?: Json | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      oidc_keys: {
        Row: {
          alg: string;
          created_at: string;
          kid: string;
          kty: string;
          private_pem_enc: string;
          public_pem: string;
          status: string;
          use: string;
        };
        Insert: {
          alg: string;
          created_at?: string;
          kid: string;
          kty: string;
          private_pem_enc: string;
          public_pem: string;
          status?: string;
          use: string;
        };
        Update: {
          alg?: string;
          created_at?: string;
          kid?: string;
          kty?: string;
          private_pem_enc?: string;
          public_pem?: string;
          status?: string;
          use?: string;
        };
        Relationships: [];
      };
      refresh_tokens: {
        Row: {
          client_id: string;
          created_at: string;
          id: number;
          last_used_at: string | null;
          prev_id: number | null;
          rt_hash: string;
          status: string;
          sub_hash: string;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          id?: number;
          last_used_at?: string | null;
          prev_id?: number | null;
          rt_hash: string;
          status?: string;
          sub_hash: string;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          id?: number;
          last_used_at?: string | null;
          prev_id?: number | null;
          rt_hash?: string;
          status?: string;
          sub_hash?: string;
        };
        Relationships: [];
      };
      trusted_frontends: {
        Row: {
          created_at: string;
          enabled: boolean;
          id: number;
          notes: string | null;
          origin: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          enabled?: boolean;
          id?: number;
          notes?: string | null;
          origin: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          enabled?: boolean;
          id?: number;
          notes?: string | null;
          origin?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      user: {
        Row: {
          auth_user_id: string | null;
          enrollment_year: number | null;
          id: number;
          major: string | null;
          roles: Json | null;
          status: number | null;
          student_id: string;
        };
        Insert: {
          auth_user_id?: string | null;
          enrollment_year?: number | null;
          id?: number;
          major?: string | null;
          roles?: Json | null;
          status?: number | null;
          student_id: string;
        };
        Update: {
          auth_user_id?: string | null;
          enrollment_year?: number | null;
          id?: number;
          major?: string | null;
          roles?: Json | null;
          status?: number | null;
          student_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      auth_issue_refresh_token: {
        Args: {
          p_client_id: string;
          p_prev_id: number;
          p_rt_hash: string;
          p_sub: string;
        };
        Returns: number;
      };
      auth_mark_rt_used: {
        Args: { p_id: number; p_used_at: string };
        Returns: undefined;
      };
      auth_reset_password: {
        Args: { p_new_hash: string; p_student_id: string };
        Returns: undefined;
      };
      auth_revoke_client_rt: {
        Args: { p_client_id: string; p_sub: string };
        Returns: number;
      };
      auth_revoke_rt_by_id: { Args: { p_id: number }; Returns: undefined };
      auth_revoke_rt_by_sub: { Args: { p_sub: string }; Returns: number };
      bff_get_trusted_frontends_duplicate: { Args: never; Returns: Json };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
