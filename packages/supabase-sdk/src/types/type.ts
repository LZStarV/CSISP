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
      academic_config: {
        Row: {
          end_date: string;
          id: number;
          is_current: boolean;
          semester: number;
          start_date: string;
          status: number;
          year: string;
        };
        Insert: {
          end_date: string;
          id?: number;
          is_current?: boolean;
          semester: number;
          start_date: string;
          status?: number;
          year: string;
        };
        Update: {
          end_date?: string;
          id?: number;
          is_current?: boolean;
          semester?: number;
          start_date?: string;
          status?: number;
          year?: string;
        };
        Relationships: [];
      };
      attendance_record: {
        Row: {
          checkin_time: string;
          created_at: string;
          device_info: string | null;
          id: number;
          ip_address: string | null;
          status: string;
          task_id: number;
          updated_at: string;
          user_id: number;
        };
        Insert: {
          checkin_time: string;
          created_at?: string;
          device_info?: string | null;
          id?: number;
          ip_address?: string | null;
          status?: string;
          task_id: number;
          updated_at?: string;
          user_id: number;
        };
        Update: {
          checkin_time?: string;
          created_at?: string;
          device_info?: string | null;
          id?: number;
          ip_address?: string | null;
          status?: string;
          task_id?: number;
          updated_at?: string;
          user_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'attendance_record_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'attendance_task';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'attendance_record_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      attendance_task: {
        Row: {
          code: string | null;
          course_id: number;
          created_at: string;
          end_time: string;
          id: number;
          start_time: string;
          status: number;
          title: string;
          updated_at: string;
        };
        Insert: {
          code?: string | null;
          course_id: number;
          created_at?: string;
          end_time: string;
          id?: number;
          start_time: string;
          status?: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          code?: string | null;
          course_id?: number;
          created_at?: string;
          end_time?: string;
          id?: number;
          start_time?: string;
          status?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'attendance_task_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'course';
            referencedColumns: ['id'];
          },
        ];
      };
      class: {
        Row: {
          capacity: number;
          code: string;
          course_id: number;
          created_at: string;
          id: number;
          name: string;
          status: number;
          updated_at: string;
        };
        Insert: {
          capacity?: number;
          code: string;
          course_id: number;
          created_at?: string;
          id?: number;
          name: string;
          status?: number;
          updated_at?: string;
        };
        Update: {
          capacity?: number;
          code?: string;
          course_id?: number;
          created_at?: string;
          id?: number;
          name?: string;
          status?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'class_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'course';
            referencedColumns: ['id'];
          },
        ];
      };
      course: {
        Row: {
          academic_year: number;
          available_majors: Json | null;
          course_code: string;
          course_name: string;
          created_at: string;
          credit: number;
          department: string | null;
          description: string | null;
          id: number;
          semester: number;
          status: number;
          updated_at: string;
        };
        Insert: {
          academic_year: number;
          available_majors?: Json | null;
          course_code: string;
          course_name: string;
          created_at?: string;
          credit?: number;
          department?: string | null;
          description?: string | null;
          id?: number;
          semester: number;
          status?: number;
          updated_at?: string;
        };
        Update: {
          academic_year?: number;
          available_majors?: Json | null;
          course_code?: string;
          course_name?: string;
          created_at?: string;
          credit?: number;
          department?: string | null;
          description?: string | null;
          id?: number;
          semester?: number;
          status?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      course_rep: {
        Row: {
          class_id: number;
          created_at: string;
          id: number;
          updated_at: string;
          user_id: number;
        };
        Insert: {
          class_id: number;
          created_at?: string;
          id?: number;
          updated_at?: string;
          user_id: number;
        };
        Update: {
          class_id?: number;
          created_at?: string;
          id?: number;
          updated_at?: string;
          user_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'course_rep_class_id_fkey';
            columns: ['class_id'];
            isOneToOne: false;
            referencedRelation: 'class';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_rep_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      course_teacher: {
        Row: {
          class_id: number;
          created_at: string;
          id: number;
          is_primary: boolean;
          teacher_id: number;
          updated_at: string;
        };
        Insert: {
          class_id: number;
          created_at?: string;
          id?: number;
          is_primary?: boolean;
          teacher_id: number;
          updated_at?: string;
        };
        Update: {
          class_id?: number;
          created_at?: string;
          id?: number;
          is_primary?: boolean;
          teacher_id?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_teacher_class_id_fkey';
            columns: ['class_id'];
            isOneToOne: false;
            referencedRelation: 'class';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_teacher_teacher_id_fkey';
            columns: ['teacher_id'];
            isOneToOne: false;
            referencedRelation: 'teacher';
            referencedColumns: ['id'];
          },
        ];
      };
      homework: {
        Row: {
          class_id: number;
          content: string | null;
          created_at: string;
          deadline: string;
          id: number;
          status: number;
          title: string;
          updated_at: string;
        };
        Insert: {
          class_id: number;
          content?: string | null;
          created_at?: string;
          deadline: string;
          id?: number;
          status?: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          class_id?: number;
          content?: string | null;
          created_at?: string;
          deadline?: string;
          id?: number;
          status?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'homework_class_id_fkey';
            columns: ['class_id'];
            isOneToOne: false;
            referencedRelation: 'class';
            referencedColumns: ['id'];
          },
        ];
      };
      homework_file: {
        Row: {
          created_at: string;
          file_name: string;
          file_path: string;
          file_size: number;
          id: number;
          mime_type: string | null;
          target_id: number;
          target_type: string;
        };
        Insert: {
          created_at?: string;
          file_name: string;
          file_path: string;
          file_size: number;
          id?: number;
          mime_type?: string | null;
          target_id: number;
          target_type: string;
        };
        Update: {
          created_at?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number;
          id?: number;
          mime_type?: string | null;
          target_id?: number;
          target_type?: string;
        };
        Relationships: [];
      };
      homework_submission: {
        Row: {
          comment: string | null;
          content: string | null;
          homework_id: number;
          id: number;
          score: number | null;
          status: number;
          submitted_at: string;
          updated_at: string;
          user_id: number;
        };
        Insert: {
          comment?: string | null;
          content?: string | null;
          homework_id: number;
          id?: number;
          score?: number | null;
          status?: number;
          submitted_at?: string;
          updated_at?: string;
          user_id: number;
        };
        Update: {
          comment?: string | null;
          content?: string | null;
          homework_id?: number;
          id?: number;
          score?: number | null;
          status?: number;
          submitted_at?: string;
          updated_at?: string;
          user_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'homework_submission_homework_id_fkey';
            columns: ['homework_id'];
            isOneToOne: false;
            referencedRelation: 'homework';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'homework_submission_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
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
      notification: {
        Row: {
          content: string;
          created_at: string;
          id: number;
          sender_id: number;
          status: string;
          target_user_id: number;
          title: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: number;
          sender_id: number;
          status?: string;
          target_user_id: number;
          title: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: number;
          sender_id?: number;
          status?: string;
          target_user_id?: number;
          title?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_target_user_id_fkey';
            columns: ['target_user_id'];
            isOneToOne: false;
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
      password_resets: {
        Row: {
          created_at: string;
          expires_at: string;
          id: number;
          token_hash: string;
          updated_at: string;
          used: boolean;
          user_id: number;
        };
        Insert: {
          created_at?: string;
          expires_at: string;
          id?: number;
          token_hash: string;
          updated_at?: string;
          used?: boolean;
          user_id: number;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          id?: number;
          token_hash?: string;
          updated_at?: string;
          used?: boolean;
          user_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'password_resets_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      permission: {
        Row: {
          code: string;
          created_at: string;
          description: string | null;
          id: number;
          name: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          description?: string | null;
          id?: number;
          name: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string | null;
          id?: number;
          name?: string;
          updated_at?: string;
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
      role: {
        Row: {
          code: string;
          created_at: string;
          description: string | null;
          id: number;
          name: string;
          status: number;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          description?: string | null;
          id?: number;
          name: string;
          status?: number;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string | null;
          id?: number;
          name?: string;
          status?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      role_permission: {
        Row: {
          id: number;
          permission_id: number;
          role_id: number;
        };
        Insert: {
          id?: number;
          permission_id: number;
          role_id: number;
        };
        Update: {
          id?: number;
          permission_id?: number;
          role_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'role_permission_permission_id_fkey';
            columns: ['permission_id'];
            isOneToOne: false;
            referencedRelation: 'permission';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'role_permission_role_id_fkey';
            columns: ['role_id'];
            isOneToOne: false;
            referencedRelation: 'role';
            referencedColumns: ['id'];
          },
        ];
      };
      schedule: {
        Row: {
          class_id: number;
          id: number;
          location: string;
          room: string;
          time_slot_id: number;
          weekday: number;
        };
        Insert: {
          class_id: number;
          id?: number;
          location: string;
          room: string;
          time_slot_id: number;
          weekday: number;
        };
        Update: {
          class_id?: number;
          id?: number;
          location?: string;
          room?: string;
          time_slot_id?: number;
          weekday?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'schedule_class_id_fkey';
            columns: ['class_id'];
            isOneToOne: false;
            referencedRelation: 'class';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'schedule_time_slot_id_fkey';
            columns: ['time_slot_id'];
            isOneToOne: false;
            referencedRelation: 'time_slot';
            referencedColumns: ['id'];
          },
        ];
      };
      sub_course: {
        Row: {
          academic_year: number;
          course_id: number;
          id: number;
          status: number;
          sub_course_code: string;
          teacher_id: number;
        };
        Insert: {
          academic_year: number;
          course_id: number;
          id?: number;
          status?: number;
          sub_course_code: string;
          teacher_id: number;
        };
        Update: {
          academic_year?: number;
          course_id?: number;
          id?: number;
          status?: number;
          sub_course_code?: string;
          teacher_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'sub_course_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'course';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sub_course_teacher_id_fkey';
            columns: ['teacher_id'];
            isOneToOne: false;
            referencedRelation: 'teacher';
            referencedColumns: ['id'];
          },
        ];
      };
      teacher: {
        Row: {
          created_at: string;
          department: string;
          email: string;
          id: number;
          phone: string;
          real_name: string;
          status: number;
          title: string | null;
          updated_at: string;
          user_id: number | null;
        };
        Insert: {
          created_at?: string;
          department: string;
          email: string;
          id?: number;
          phone: string;
          real_name: string;
          status?: number;
          title?: string | null;
          updated_at?: string;
          user_id?: number | null;
        };
        Update: {
          created_at?: string;
          department?: string;
          email?: string;
          id?: number;
          phone?: string;
          real_name?: string;
          status?: number;
          title?: string | null;
          updated_at?: string;
          user_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'teacher_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      time_slot: {
        Row: {
          course_id: number;
          created_at: string;
          end_time: string;
          id: number;
          location: string | null;
          start_time: string;
          updated_at: string;
          week_day: number;
        };
        Insert: {
          course_id: number;
          created_at?: string;
          end_time: string;
          id?: number;
          location?: string | null;
          start_time: string;
          updated_at?: string;
          week_day: number;
        };
        Update: {
          course_id?: number;
          created_at?: string;
          end_time?: string;
          id?: number;
          location?: string | null;
          start_time?: string;
          updated_at?: string;
          week_day?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'time_slot_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'course';
            referencedColumns: ['id'];
          },
        ];
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
      user_class: {
        Row: {
          class_id: number;
          created_at: string;
          id: number;
          join_time: string;
          status: number;
          updated_at: string;
          user_id: number;
        };
        Insert: {
          class_id: number;
          created_at?: string;
          id?: number;
          join_time?: string;
          status?: number;
          updated_at?: string;
          user_id: number;
        };
        Update: {
          class_id?: number;
          created_at?: string;
          id?: number;
          join_time?: string;
          status?: number;
          updated_at?: string;
          user_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'user_class_class_id_fkey';
            columns: ['class_id'];
            isOneToOne: false;
            referencedRelation: 'class';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_class_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      user_role: {
        Row: {
          created_at: string;
          role_id: number;
          updated_at: string;
          user_id: number;
        };
        Insert: {
          created_at?: string;
          role_id: number;
          updated_at?: string;
          user_id: number;
        };
        Update: {
          created_at?: string;
          role_id?: number;
          updated_at?: string;
          user_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'user_role_role_id_fkey';
            columns: ['role_id'];
            isOneToOne: false;
            referencedRelation: 'role';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_role_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
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
