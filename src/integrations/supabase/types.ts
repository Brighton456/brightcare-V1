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
          branch_id: string | null
          created_at: string | null
          details: string | null
          hospital_id: string | null
          id: string
          ip_address: string | null
          module: string | null
          staff_id: string | null
        }
        Insert: {
          action: string
          branch_id?: string | null
          created_at?: string | null
          details?: string | null
          hospital_id?: string | null
          id?: string
          ip_address?: string | null
          module?: string | null
          staff_id?: string | null
        }
        Update: {
          action?: string
          branch_id?: string | null
          created_at?: string | null
          details?: string | null
          hospital_id?: string | null
          id?: string
          ip_address?: string | null
          module?: string | null
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions: {
        Row: {
          admission_no: string
          admission_type: string | null
          admitted_at: string | null
          bed_id: string | null
          created_at: string | null
          diagnosis: string | null
          discharge_summary: string | null
          discharged_at: string | null
          doctor_id: string | null
          hospital_id: string | null
          id: string
          notes: string | null
          patient_id: string
          reason: string | null
          status: string | null
        }
        Insert: {
          admission_no: string
          admission_type?: string | null
          admitted_at?: string | null
          bed_id?: string | null
          created_at?: string | null
          diagnosis?: string | null
          discharge_summary?: string | null
          discharged_at?: string | null
          doctor_id?: string | null
          hospital_id?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          reason?: string | null
          status?: string | null
        }
        Update: {
          admission_no?: string
          admission_type?: string | null
          admitted_at?: string | null
          bed_id?: string | null
          created_at?: string | null
          diagnosis?: string | null
          discharge_summary?: string | null
          discharged_at?: string | null
          doctor_id?: string | null
          hospital_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          reason?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admissions_bed_id_fkey"
            columns: ["bed_id"]
            isOneToOne: false
            referencedRelation: "beds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          background_color: string | null
          created_at: string
          created_by: string | null
          created_by_name: string | null
          created_by_role: string | null
          expires_at: string | null
          hospital_id: string | null
          icon: string | null
          id: string
          is_active: boolean
          message: string
          priority: string
          target_roles: string[]
          title: string
        }
        Insert: {
          background_color?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          created_by_role?: string | null
          expires_at?: string | null
          hospital_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          message: string
          priority?: string
          target_roles?: string[]
          title: string
        }
        Update: {
          background_color?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          created_by_role?: string | null
          expires_at?: string | null
          hospital_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          message?: string
          priority?: string
          target_roles?: string[]
          title?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          branch_id: string | null
          created_at: string | null
          doctor_id: string
          hospital_id: string | null
          id: string
          notes: string | null
          patient_id: string
          reason: string | null
          status: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          branch_id?: string | null
          created_at?: string | null
          doctor_id: string
          hospital_id?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          reason?: string | null
          status?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          branch_id?: string | null
          created_at?: string | null
          doctor_id?: string
          hospital_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          reason?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      beds: {
        Row: {
          bed_number: string
          bed_type: string | null
          created_at: string | null
          daily_rate: number | null
          hospital_id: string | null
          id: string
          notes: string | null
          status: string | null
          ward_id: string
        }
        Insert: {
          bed_number: string
          bed_type?: string | null
          created_at?: string | null
          daily_rate?: number | null
          hospital_id?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          ward_id: string
        }
        Update: {
          bed_number?: string
          bed_type?: string | null
          created_at?: string | null
          daily_rate?: number | null
          hospital_id?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          ward_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beds_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beds_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_items: {
        Row: {
          bill_id: string
          branch_id: string | null
          description: string
          hospital_id: string | null
          id: string
          item_type: string
          quantity: number | null
          total: number
          unit_price: number
        }
        Insert: {
          bill_id: string
          branch_id?: string | null
          description: string
          hospital_id?: string | null
          id?: string
          item_type: string
          quantity?: number | null
          total: number
          unit_price: number
        }
        Update: {
          bill_id?: string
          branch_id?: string | null
          description?: string
          hospital_id?: string | null
          id?: string
          item_type?: string
          quantity?: number | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "bill_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_items_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_items_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_settings: {
        Row: {
          auto_bill_on_discharge: boolean | null
          auto_verify_insurance: boolean | null
          billing_mode: string | null
          checkin_required: boolean | null
          cumulative_threshold: number | null
          hospital_id: string | null
          id: string
          notification_expiry_hours: number | null
          require_payment_confirmation: boolean | null
          updated_at: string | null
        }
        Insert: {
          auto_bill_on_discharge?: boolean | null
          auto_verify_insurance?: boolean | null
          billing_mode?: string | null
          checkin_required?: boolean | null
          cumulative_threshold?: number | null
          hospital_id?: string | null
          id?: string
          notification_expiry_hours?: number | null
          require_payment_confirmation?: boolean | null
          updated_at?: string | null
        }
        Update: {
          auto_bill_on_discharge?: boolean | null
          auto_verify_insurance?: boolean | null
          billing_mode?: string | null
          checkin_required?: boolean | null
          cumulative_threshold?: number | null
          hospital_id?: string | null
          id?: string
          notification_expiry_hours?: number | null
          require_payment_confirmation?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_settings_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          amount_paid: number | null
          bill_no: string
          branch_id: string | null
          cashier_id: string | null
          consultation_id: string | null
          created_at: string | null
          discount: number | null
          hospital_id: string | null
          id: string
          mpesa_transaction_id: string | null
          notes: string | null
          paid_at: string | null
          patient_id: string
          payment_method: string | null
          status: string | null
          subtotal: number | null
          tax: number | null
          total: number | null
        }
        Insert: {
          amount_paid?: number | null
          bill_no: string
          branch_id?: string | null
          cashier_id?: string | null
          consultation_id?: string | null
          created_at?: string | null
          discount?: number | null
          hospital_id?: string | null
          id?: string
          mpesa_transaction_id?: string | null
          notes?: string | null
          paid_at?: string | null
          patient_id: string
          payment_method?: string | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
        }
        Update: {
          amount_paid?: number | null
          bill_no?: string
          branch_id?: string | null
          cashier_id?: string | null
          consultation_id?: string | null
          created_at?: string | null
          discount?: number | null
          hospital_id?: string | null
          id?: string
          mpesa_transaction_id?: string | null
          notes?: string | null
          paid_at?: string | null
          patient_id?: string
          payment_method?: string | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bills_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          branch_code: string
          created_at: string
          created_by: string | null
          hospital_id: string
          id: string
          is_active: boolean
          is_main: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          branch_code: string
          created_at?: string
          created_by?: string | null
          hospital_id: string
          id?: string
          is_active?: boolean
          is_main?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          branch_code?: string
          created_at?: string
          created_by?: string | null
          hospital_id?: string
          id?: string
          is_active?: boolean
          is_main?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours: {
        Row: {
          close_time: string
          day_of_week: number
          hospital_id: string | null
          id: string
          is_active: boolean | null
          open_time: string
          updated_at: string | null
        }
        Insert: {
          close_time?: string
          day_of_week: number
          hospital_id?: string | null
          id?: string
          is_active?: boolean | null
          open_time?: string
          updated_at?: string | null
        }
        Update: {
          close_time?: string
          day_of_week?: number
          hospital_id?: string | null
          id?: string
          is_active?: boolean | null
          open_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          branch_id: string | null
          chief_complaint: string | null
          completed_at: string | null
          consultation_fee: number | null
          consultation_no: string
          created_at: string | null
          diagnosis: string | null
          diagnosis_code: string | null
          doctor_id: string
          doctor_notes: string | null
          follow_up_date: string | null
          hospital_id: string | null
          id: string
          patient_id: string
          status: string | null
          symptoms: string | null
          treatment_plan: string | null
          visit_type: string | null
          vitals: Json | null
        }
        Insert: {
          branch_id?: string | null
          chief_complaint?: string | null
          completed_at?: string | null
          consultation_fee?: number | null
          consultation_no: string
          created_at?: string | null
          diagnosis?: string | null
          diagnosis_code?: string | null
          doctor_id: string
          doctor_notes?: string | null
          follow_up_date?: string | null
          hospital_id?: string | null
          id?: string
          patient_id: string
          status?: string | null
          symptoms?: string | null
          treatment_plan?: string | null
          visit_type?: string | null
          vitals?: Json | null
        }
        Update: {
          branch_id?: string | null
          chief_complaint?: string | null
          completed_at?: string | null
          consultation_fee?: number | null
          consultation_no?: string
          created_at?: string | null
          diagnosis?: string | null
          diagnosis_code?: string | null
          doctor_id?: string
          doctor_notes?: string | null
          follow_up_date?: string | null
          hospital_id?: string | null
          id?: string
          patient_id?: string
          status?: string | null
          symptoms?: string | null
          treatment_plan?: string | null
          visit_type?: string | null
          vitals?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_sales: {
        Row: {
          amount_credited: number
          amount_paid: number
          bill_id: string | null
          buyer_name: string
          buyer_phone: string | null
          created_at: string
          due_date: string | null
          hospital_id: string | null
          id: string
          notes: string | null
          sale_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_credited?: number
          amount_paid?: number
          bill_id?: string | null
          buyer_name: string
          buyer_phone?: string | null
          created_at?: string
          due_date?: string | null
          hospital_id?: string | null
          id?: string
          notes?: string | null
          sale_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_credited?: number
          amount_paid?: number
          bill_id?: string | null
          buyer_name?: string
          buyer_phone?: string | null
          created_at?: string
          due_date?: string | null
          hospital_id?: string | null
          id?: string
          notes?: string | null
          sale_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_sales_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string | null
          description: string | null
          head_name: string | null
          hospital_id: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          head_name?: string | null
          hospital_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          head_name?: string | null
          hospital_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      dropdown_options: {
        Row: {
          category: string
          created_at: string | null
          hospital_id: string | null
          id: string
          is_active: boolean | null
          label: string
          sort_order: number | null
          value: string
        }
        Insert: {
          category: string
          created_at?: string | null
          hospital_id?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          sort_order?: number | null
          value: string
        }
        Update: {
          category?: string
          created_at?: string | null
          hospital_id?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          sort_order?: number | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "dropdown_options_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_settlements: {
        Row: {
          account_total: number | null
          card_total: number | null
          cash_total: number | null
          created_at: string | null
          credit_total: number | null
          gift_total: number | null
          grand_total: number | null
          hospital_id: string | null
          id: string
          mpesa_total: number | null
          notes: string | null
          period_end: string
          period_start: string
          period_type: string
          staff_id: string | null
          status: string | null
          submitted_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          account_total?: number | null
          card_total?: number | null
          cash_total?: number | null
          created_at?: string | null
          credit_total?: number | null
          gift_total?: number | null
          grand_total?: number | null
          hospital_id?: string | null
          id?: string
          mpesa_total?: number | null
          notes?: string | null
          period_end: string
          period_start: string
          period_type?: string
          staff_id?: string | null
          status?: string | null
          submitted_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          account_total?: number | null
          card_total?: number | null
          cash_total?: number | null
          created_at?: string | null
          credit_total?: number | null
          gift_total?: number | null
          grand_total?: number | null
          hospital_id?: string | null
          id?: string
          mpesa_total?: number | null
          notes?: string | null
          period_end?: string
          period_start?: string
          period_type?: string
          staff_id?: string | null
          status?: string | null
          submitted_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_settlements_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_settlements_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_settlements_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_addons: {
        Row: {
          addon_name: string
          addon_type: string
          created_at: string | null
          hospital_id: string
          id: string
          is_active: boolean | null
          price: number | null
          quantity: number | null
          stripe_subscription_item_id: string | null
        }
        Insert: {
          addon_name: string
          addon_type: string
          created_at?: string | null
          hospital_id: string
          id?: string
          is_active?: boolean | null
          price?: number | null
          quantity?: number | null
          stripe_subscription_item_id?: string | null
        }
        Update: {
          addon_name?: string
          addon_type?: string
          created_at?: string | null
          hospital_id?: string
          id?: string
          is_active?: boolean | null
          price?: number | null
          quantity?: number | null
          stripe_subscription_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hospital_addons_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          default_consultation_fee: number | null
          default_emergency_fee: number | null
          default_followup_fee: number | null
          email: string | null
          facility_type: string
          grace_period_days: number | null
          id: string
          invoice_prefix: string | null
          is_active: boolean | null
          license_expires_at: string | null
          license_key: string | null
          license_package_id: string | null
          license_payment_mode: string
          license_started_at: string | null
          license_status: string
          logo_url: string | null
          maintenance_due_at: string | null
          maintenance_last_paid_at: string | null
          maintenance_warning_days: number
          name: string
          phone: string | null
          receipt_prefix: string | null
          settings: Json | null
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tax_rate: number | null
          trial_ends_at: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          default_consultation_fee?: number | null
          default_emergency_fee?: number | null
          default_followup_fee?: number | null
          email?: string | null
          facility_type?: string
          grace_period_days?: number | null
          id?: string
          invoice_prefix?: string | null
          is_active?: boolean | null
          license_expires_at?: string | null
          license_key?: string | null
          license_package_id?: string | null
          license_payment_mode?: string
          license_started_at?: string | null
          license_status?: string
          logo_url?: string | null
          maintenance_due_at?: string | null
          maintenance_last_paid_at?: string | null
          maintenance_warning_days?: number
          name: string
          phone?: string | null
          receipt_prefix?: string | null
          settings?: Json | null
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tax_rate?: number | null
          trial_ends_at?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          default_consultation_fee?: number | null
          default_emergency_fee?: number | null
          default_followup_fee?: number | null
          email?: string | null
          facility_type?: string
          grace_period_days?: number | null
          id?: string
          invoice_prefix?: string | null
          is_active?: boolean | null
          license_expires_at?: string | null
          license_key?: string | null
          license_package_id?: string | null
          license_payment_mode?: string
          license_started_at?: string | null
          license_status?: string
          logo_url?: string | null
          maintenance_due_at?: string | null
          maintenance_last_paid_at?: string | null
          maintenance_warning_days?: number
          name?: string
          phone?: string | null
          receipt_prefix?: string | null
          settings?: Json | null
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tax_rate?: number | null
          trial_ends_at?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hospitals_license_package_id_fkey"
            columns: ["license_package_id"]
            isOneToOne: false
            referencedRelation: "license_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      inactive_days: {
        Row: {
          created_at: string | null
          date: string
          hospital_id: string | null
          id: string
          marked_by: string | null
          reason: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          hospital_id?: string | null
          id?: string
          marked_by?: string | null
          reason?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          hospital_id?: string | null
          id?: string
          marked_by?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inactive_days_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inactive_days_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_messages: {
        Row: {
          created_at: string | null
          expires_at: string | null
          hospital_id: string | null
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          recipient_department: string
          sender_department: string
          sender_staff_id: string | null
          subject: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          hospital_id?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          recipient_department: string
          sender_department: string
          sender_staff_id?: string | null
          subject: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          hospital_id?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          recipient_department?: string
          sender_department?: string
          sender_staff_id?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_messages_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_messages_sender_staff_id_fkey"
            columns: ["sender_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          batch_no: string | null
          branch_id: string | null
          discount: number | null
          expiry_date: string | null
          hospital_id: string | null
          id: string
          invoice_id: string
          medicine_id: string | null
          medicine_name: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          batch_no?: string | null
          branch_id?: string | null
          discount?: number | null
          expiry_date?: string | null
          hospital_id?: string | null
          id?: string
          invoice_id: string
          medicine_id?: string | null
          medicine_name: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Update: {
          batch_no?: string | null
          branch_id?: string | null
          discount?: number | null
          expiry_date?: string | null
          hospital_id?: string | null
          id?: string
          invoice_id?: string
          medicine_id?: string | null
          medicine_name?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          branch_id: string | null
          created_at: string | null
          created_by: string | null
          discount: number | null
          hospital_id: string | null
          id: string
          invoice_date: string
          invoice_no: string
          notes: string | null
          status: string
          subtotal: number | null
          supplier_name: string
          tax: number | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          discount?: number | null
          hospital_id?: string | null
          id?: string
          invoice_date?: string
          invoice_no: string
          notes?: string | null
          status?: string
          subtotal?: number | null
          supplier_name: string
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          discount?: number | null
          hospital_id?: string | null
          id?: string
          invoice_date?: string
          invoice_no?: string
          notes?: string | null
          status?: string
          subtotal?: number | null
          supplier_name?: string
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_consumables: {
        Row: {
          category: string | null
          cost_per_unit: number | null
          created_at: string | null
          hospital_id: string | null
          id: string
          is_active: boolean | null
          name: string
          reorder_level: number | null
          size_or_type: string | null
          stock: number | null
          unit: string | null
        }
        Insert: {
          category?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          hospital_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          reorder_level?: number | null
          size_or_type?: string | null
          stock?: number | null
          unit?: string | null
        }
        Update: {
          category?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          hospital_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          reorder_level?: number | null
          size_or_type?: string | null
          stock?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_consumables_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_service_bundles: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          hospital_id: string | null
          id: string
          is_active: boolean | null
          price: number
          service_code: string
          service_name: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          hospital_id?: string | null
          id?: string
          is_active?: boolean | null
          price?: number
          service_code: string
          service_name: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          hospital_id?: string | null
          id?: string
          is_active?: boolean | null
          price?: number
          service_code?: string
          service_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_service_bundles_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_service_consumables: {
        Row: {
          consumable_id: string | null
          consumable_name: string
          created_at: string | null
          hospital_id: string | null
          id: string
          quantity_required: number
          service_bundle_id: string
        }
        Insert: {
          consumable_id?: string | null
          consumable_name: string
          created_at?: string | null
          hospital_id?: string | null
          id?: string
          quantity_required?: number
          service_bundle_id: string
        }
        Update: {
          consumable_id?: string | null
          consumable_name?: string
          created_at?: string | null
          hospital_id?: string | null
          id?: string
          quantity_required?: number
          service_bundle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_service_consumables_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "lab_consumables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_service_consumables_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_service_consumables_service_bundle_id_fkey"
            columns: ["service_bundle_id"]
            isOneToOne: false
            referencedRelation: "lab_service_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_test_consumables: {
        Row: {
          consumable_id: string | null
          created_at: string | null
          hospital_id: string | null
          id: string
          quantity_per_test: number | null
          test_name: string
        }
        Insert: {
          consumable_id?: string | null
          created_at?: string | null
          hospital_id?: string | null
          id?: string
          quantity_per_test?: number | null
          test_name: string
        }
        Update: {
          consumable_id?: string | null
          created_at?: string | null
          hospital_id?: string | null
          id?: string
          quantity_per_test?: number | null
          test_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_test_consumables_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "lab_consumables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_test_consumables_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_tests: {
        Row: {
          completed_at: string | null
          consultation_id: string | null
          fee: number | null
          hospital_id: string | null
          id: string
          is_abnormal: boolean | null
          normal_range: string | null
          notes: string | null
          patient_id: string
          performed_by: string | null
          requested_at: string | null
          requested_by: string
          result_file_url: string | null
          results: string | null
          status: string | null
          test_category: string | null
          test_name: string
          test_no: string
        }
        Insert: {
          completed_at?: string | null
          consultation_id?: string | null
          fee?: number | null
          hospital_id?: string | null
          id?: string
          is_abnormal?: boolean | null
          normal_range?: string | null
          notes?: string | null
          patient_id: string
          performed_by?: string | null
          requested_at?: string | null
          requested_by: string
          result_file_url?: string | null
          results?: string | null
          status?: string | null
          test_category?: string | null
          test_name: string
          test_no: string
        }
        Update: {
          completed_at?: string | null
          consultation_id?: string | null
          fee?: number | null
          hospital_id?: string | null
          id?: string
          is_abnormal?: boolean | null
          normal_range?: string | null
          notes?: string | null
          patient_id?: string
          performed_by?: string | null
          requested_at?: string | null
          requested_by?: string
          result_file_url?: string | null
          results?: string | null
          status?: string | null
          test_category?: string | null
          test_name?: string
          test_no?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_tests_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_tests_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_tests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_tests_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_tests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      license_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: string | null
          hospital_id: string
          id: string
          new_package: string | null
          old_package: string | null
          performed_by: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: string | null
          hospital_id: string
          id?: string
          new_package?: string | null
          old_package?: string | null
          performed_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: string | null
          hospital_id?: string
          id?: string
          new_package?: string | null
          old_package?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "license_audit_log_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      license_keys: {
        Row: {
          activated_at: string | null
          created_at: string | null
          duration_months: number
          expires_at: string | null
          generated_by: string | null
          hospital_id: string | null
          id: string
          license_key: string
          notes: string | null
          package_id: string | null
          status: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string | null
          duration_months?: number
          expires_at?: string | null
          generated_by?: string | null
          hospital_id?: string | null
          id?: string
          license_key: string
          notes?: string | null
          package_id?: string | null
          status?: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string | null
          duration_months?: number
          expires_at?: string | null
          generated_by?: string | null
          hospital_id?: string | null
          id?: string
          license_key?: string
          notes?: string | null
          package_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_keys_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_keys_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "license_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      license_packages: {
        Row: {
          allowed_modules: string[]
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          maintenance_monthly: number | null
          max_patients: number | null
          max_staff: number | null
          name: string
          price_lifetime: number | null
          price_monthly: number
          price_yearly: number | null
          sort_order: number | null
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
        }
        Insert: {
          allowed_modules?: string[]
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          maintenance_monthly?: number | null
          max_patients?: number | null
          max_staff?: number | null
          name: string
          price_lifetime?: number | null
          price_monthly?: number
          price_yearly?: number | null
          sort_order?: number | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
        }
        Update: {
          allowed_modules?: string[]
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          maintenance_monthly?: number | null
          max_patients?: number | null
          max_staff?: number | null
          name?: string
          price_lifetime?: number | null
          price_monthly?: number
          price_yearly?: number | null
          sort_order?: number | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
        }
        Relationships: []
      }
      medicines: {
        Row: {
          barcode: string | null
          batch_no: string | null
          brand: string | null
          category: string | null
          cost_price: number | null
          created_at: string | null
          expiry_date: string | null
          generic_name: string | null
          hospital_id: string | null
          id: string
          is_active: boolean | null
          last_ordered_at: string | null
          lead_time_days: number | null
          name: string
          price: number
          reorder_level: number | null
          requires_prescription: boolean | null
          shelf_location: string | null
          stock: number | null
          supplier: string | null
          unit: string | null
        }
        Insert: {
          barcode?: string | null
          batch_no?: string | null
          brand?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          expiry_date?: string | null
          generic_name?: string | null
          hospital_id?: string | null
          id?: string
          is_active?: boolean | null
          last_ordered_at?: string | null
          lead_time_days?: number | null
          name: string
          price?: number
          reorder_level?: number | null
          requires_prescription?: boolean | null
          shelf_location?: string | null
          stock?: number | null
          supplier?: string | null
          unit?: string | null
        }
        Update: {
          barcode?: string | null
          batch_no?: string | null
          brand?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          expiry_date?: string | null
          generic_name?: string | null
          hospital_id?: string | null
          id?: string
          is_active?: boolean | null
          last_ordered_at?: string | null
          lead_time_days?: number | null
          name?: string
          price?: number
          reorder_level?: number | null
          requires_prescription?: boolean | null
          shelf_location?: string | null
          stock?: number | null
          supplier?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicines_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      module_settings: {
        Row: {
          category: string
          description: string | null
          hospital_id: string | null
          id: string
          is_enabled: boolean
          module_key: string
          module_name: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          description?: string | null
          hospital_id?: string | null
          id?: string
          is_enabled?: boolean
          module_key: string
          module_name: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          description?: string | null
          hospital_id?: string | null
          id?: string
          is_enabled?: boolean
          module_key?: string
          module_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_settings_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          expires_at: string | null
          hospital_id: string | null
          id: string
          is_read: boolean | null
          message: string
          module: string | null
          read_at: string | null
          recipient_staff_id: string | null
          reference_id: string | null
          sender_staff_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          hospital_id?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          module?: string | null
          read_at?: string | null
          recipient_staff_id?: string | null
          reference_id?: string | null
          sender_staff_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          hospital_id?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          module?: string | null
          read_at?: string | null
          recipient_staff_id?: string | null
          reference_id?: string | null
          sender_staff_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_staff_id_fkey"
            columns: ["recipient_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_staff_id_fkey"
            columns: ["sender_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      nursing_notes: {
        Row: {
          admission_id: string
          content: string
          created_at: string | null
          hospital_id: string | null
          id: string
          note_type: string | null
          nurse_id: string | null
          shift: string | null
        }
        Insert: {
          admission_id: string
          content: string
          created_at?: string | null
          hospital_id?: string | null
          id?: string
          note_type?: string | null
          nurse_id?: string | null
          shift?: string | null
        }
        Update: {
          admission_id?: string
          content?: string
          created_at?: string | null
          hospital_id?: string | null
          id?: string
          note_type?: string | null
          nurse_id?: string | null
          shift?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nursing_notes_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nursing_notes_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nursing_notes_nurse_id_fkey"
            columns: ["nurse_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          allergies: string[] | null
          blood_type: string | null
          branch_id: string | null
          chronic_conditions: string[] | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          gender: string | null
          hospital_id: string | null
          id: string
          id_number: string | null
          insurance_number: string | null
          insurance_provider: string | null
          is_active: boolean | null
          last_name: string
          notes: string | null
          patient_no: string
          phone: string | null
          photo_url: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          allergies?: string[] | null
          blood_type?: string | null
          branch_id?: string | null
          chronic_conditions?: string[] | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          gender?: string | null
          hospital_id?: string | null
          id?: string
          id_number?: string | null
          insurance_number?: string | null
          insurance_provider?: string | null
          is_active?: boolean | null
          last_name: string
          notes?: string | null
          patient_no: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          allergies?: string[] | null
          blood_type?: string | null
          branch_id?: string | null
          chronic_conditions?: string[] | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          gender?: string | null
          hospital_id?: string | null
          id?: string
          id_number?: string | null
          insurance_number?: string | null
          insurance_provider?: string | null
          is_active?: boolean | null
          last_name?: string
          notes?: string | null
          patient_no?: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_method_permissions: {
        Row: {
          hospital_id: string | null
          id: string
          is_allowed: boolean | null
          payment_method: string
          role_name: string
        }
        Insert: {
          hospital_id?: string | null
          id?: string
          is_allowed?: boolean | null
          payment_method: string
          role_name: string
        }
        Update: {
          hospital_id?: string | null
          id?: string
          is_allowed?: boolean | null
          payment_method?: string
          role_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_method_permissions_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_sale_items: {
        Row: {
          branch_id: string | null
          discount: number | null
          hospital_id: string | null
          id: string
          medicine_id: string | null
          medicine_name: string
          quantity: number
          sale_id: string
          total: number
          unit_price: number
        }
        Insert: {
          branch_id?: string | null
          discount?: number | null
          hospital_id?: string | null
          id?: string
          medicine_id?: string | null
          medicine_name: string
          quantity: number
          sale_id: string
          total: number
          unit_price: number
        }
        Update: {
          branch_id?: string | null
          discount?: number | null
          hospital_id?: string | null
          id?: string
          medicine_id?: string | null
          medicine_name?: string
          quantity?: number
          sale_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_sale_items_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_sale_items_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_sale_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_sales: {
        Row: {
          amount_paid: number | null
          branch_id: string | null
          cashier_id: string | null
          change_amount: number | null
          created_at: string | null
          customer_name: string | null
          discount: number | null
          hospital_id: string | null
          id: string
          mpesa_transaction_id: string | null
          patient_id: string | null
          payment_method: string | null
          prescription_id: string | null
          receipt_no: string
          status: string | null
          subtotal: number | null
          tax: number | null
          total: number | null
        }
        Insert: {
          amount_paid?: number | null
          branch_id?: string | null
          cashier_id?: string | null
          change_amount?: number | null
          created_at?: string | null
          customer_name?: string | null
          discount?: number | null
          hospital_id?: string | null
          id?: string
          mpesa_transaction_id?: string | null
          patient_id?: string | null
          payment_method?: string | null
          prescription_id?: string | null
          receipt_no: string
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
        }
        Update: {
          amount_paid?: number | null
          branch_id?: string | null
          cashier_id?: string | null
          change_amount?: number | null
          created_at?: string | null
          customer_name?: string | null
          discount?: number | null
          hospital_id?: string | null
          id?: string
          mpesa_transaction_id?: string | null
          patient_id?: string | null
          payment_method?: string | null
          prescription_id?: string | null
          receipt_no?: string
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_sales_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_sales_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_sales_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_sales_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_sales_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          value?: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      prescription_items: {
        Row: {
          branch_id: string | null
          dispensed_qty: number | null
          dosage: string
          duration: string
          frequency: string
          hospital_id: string | null
          id: string
          instructions: string | null
          item_type: string
          medicine_id: string | null
          medicine_name: string
          prescription_id: string
          quantity: number
          service_bundle_id: string | null
          unit_price: number | null
        }
        Insert: {
          branch_id?: string | null
          dispensed_qty?: number | null
          dosage: string
          duration: string
          frequency: string
          hospital_id?: string | null
          id?: string
          instructions?: string | null
          item_type?: string
          medicine_id?: string | null
          medicine_name: string
          prescription_id: string
          quantity?: number
          service_bundle_id?: string | null
          unit_price?: number | null
        }
        Update: {
          branch_id?: string | null
          dispensed_qty?: number | null
          dosage?: string
          duration?: string
          frequency?: string
          hospital_id?: string | null
          id?: string
          instructions?: string | null
          item_type?: string
          medicine_id?: string | null
          medicine_name?: string
          prescription_id?: string
          quantity?: number
          service_bundle_id?: string | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prescription_items_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_items_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_items_service_bundle_id_fkey"
            columns: ["service_bundle_id"]
            isOneToOne: false
            referencedRelation: "lab_service_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          branch_id: string | null
          consultation_id: string
          created_at: string | null
          doctor_id: string
          hospital_id: string | null
          id: string
          notes: string | null
          patient_id: string
          prescription_no: string
          status: string | null
        }
        Insert: {
          branch_id?: string | null
          consultation_id: string
          created_at?: string | null
          doctor_id: string
          hospital_id?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          prescription_no: string
          status?: string | null
        }
        Update: {
          branch_id?: string | null
          consultation_id?: string
          created_at?: string | null
          doctor_id?: string
          hospital_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          prescription_no?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          feature_key: string
          hospital_id: string | null
          id: string
          is_enabled: boolean | null
          role_name: string
          updated_at: string | null
        }
        Insert: {
          feature_key: string
          hospital_id?: string | null
          id?: string
          is_enabled?: boolean | null
          role_name: string
          updated_at?: string | null
        }
        Update: {
          feature_key?: string
          hospital_id?: string | null
          id?: string
          is_enabled?: boolean | null
          role_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          branch_id: string | null
          created_at: string | null
          department_id: string | null
          email: string | null
          failed_attempts: number | null
          first_name: string
          hospital_id: string | null
          id: string
          is_active: boolean | null
          is_hidden: boolean
          last_login_at: string | null
          last_name: string
          license_number: string | null
          locked_until: string | null
          must_change_password: boolean | null
          password_hash: string | null
          phone: string | null
          plain_password: string | null
          role: string
          session_token: string | null
          specialization: string | null
          staff_no: string
          user_id: string | null
          username: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string | null
          failed_attempts?: number | null
          first_name: string
          hospital_id?: string | null
          id?: string
          is_active?: boolean | null
          is_hidden?: boolean
          last_login_at?: string | null
          last_name: string
          license_number?: string | null
          locked_until?: string | null
          must_change_password?: boolean | null
          password_hash?: string | null
          phone?: string | null
          plain_password?: string | null
          role: string
          session_token?: string | null
          specialization?: string | null
          staff_no: string
          user_id?: string | null
          username: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string | null
          failed_attempts?: number | null
          first_name?: string
          hospital_id?: string | null
          id?: string
          is_active?: boolean | null
          is_hidden?: boolean
          last_login_at?: string | null
          last_name?: string
          license_number?: string | null
          locked_until?: string | null
          must_change_password?: boolean | null
          password_hash?: string | null
          phone?: string | null
          plain_password?: string | null
          role?: string
          session_token?: string | null
          specialization?: string | null
          staff_no?: string
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_checkins: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          date: string
          hospital_id: string | null
          id: string
          notes: string | null
          staff_id: string
          status: string | null
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          date?: string
          hospital_id?: string | null
          id?: string
          notes?: string | null
          staff_id: string
          status?: string | null
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          date?: string
          hospital_id?: string | null
          id?: string
          notes?: string | null
          staff_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_checkins_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_checkins_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_salaries: {
        Row: {
          allowances: number | null
          base_salary: number | null
          deductions: number | null
          effective_from: string | null
          hospital_id: string | null
          id: string
          net_salary: number | null
          pay_frequency: string | null
          staff_id: string
          updated_at: string | null
        }
        Insert: {
          allowances?: number | null
          base_salary?: number | null
          deductions?: number | null
          effective_from?: string | null
          hospital_id?: string | null
          id?: string
          net_salary?: number | null
          pay_frequency?: string | null
          staff_id: string
          updated_at?: string | null
        }
        Update: {
          allowances?: number | null
          base_salary?: number | null
          deductions?: number | null
          effective_from?: string | null
          hospital_id?: string | null
          id?: string
          net_salary?: number | null
          pay_frequency?: string | null
          staff_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_salaries_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_salaries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_batches: {
        Row: {
          batch_no: string
          branch_id: string
          cost_price: number
          created_at: string
          created_by: string | null
          expiry_date: string | null
          hospital_id: string
          id: string
          medicine_id: string
          qty_received: number
          qty_remaining: number
          received_at: string
          supplier_name: string | null
        }
        Insert: {
          batch_no: string
          branch_id: string
          cost_price?: number
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          hospital_id: string
          id?: string
          medicine_id: string
          qty_received?: number
          qty_remaining?: number
          received_at?: string
          supplier_name?: string | null
        }
        Update: {
          batch_no?: string
          branch_id?: string
          cost_price?: number
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          hospital_id?: string
          id?: string
          medicine_id?: string
          qty_received?: number
          qty_remaining?: number
          received_at?: string
          supplier_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_batches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_batches_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_batches_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          batch_id: string | null
          branch_id: string
          created_at: string
          destination_branch_id: string | null
          hospital_id: string
          id: string
          medicine_id: string
          movement_type: string
          new_quantity: number
          performed_by: string | null
          previous_quantity: number
          quantity: number
          reason: string
          reference_id: string | null
          reference_type: string | null
          source_branch_id: string | null
        }
        Insert: {
          batch_id?: string | null
          branch_id: string
          created_at?: string
          destination_branch_id?: string | null
          hospital_id: string
          id?: string
          medicine_id: string
          movement_type: string
          new_quantity: number
          performed_by?: string | null
          previous_quantity: number
          quantity: number
          reason: string
          reference_id?: string | null
          reference_type?: string | null
          source_branch_id?: string | null
        }
        Update: {
          batch_id?: string | null
          branch_id?: string
          created_at?: string
          destination_branch_id?: string | null
          hospital_id?: string
          id?: string
          medicine_id?: string
          movement_type?: string
          new_quantity?: number
          performed_by?: string | null
          previous_quantity?: number
          quantity?: number
          reason?: string
          reference_id?: string | null
          reference_type?: string | null
          source_branch_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "stock_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_destination_branch_id_fkey"
            columns: ["destination_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_source_branch_id_fkey"
            columns: ["source_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfer_items: {
        Row: {
          batch_id: string | null
          created_at: string
          hospital_id: string
          id: string
          medicine_id: string
          quantity: number
          transfer_id: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          hospital_id: string
          id?: string
          medicine_id: string
          quantity: number
          transfer_id: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          hospital_id?: string
          id?: string
          medicine_id?: string
          quantity?: number
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfer_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "stock_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfer_items_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfer_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfer_items_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "stock_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfers: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          destination_branch_id: string
          dispatched_at: string | null
          dispatched_by: string | null
          hospital_id: string
          id: string
          notes: string | null
          received_at: string | null
          received_by: string | null
          requested_at: string
          requested_by: string
          source_branch_id: string
          status: string
          transfer_no: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          destination_branch_id: string
          dispatched_at?: string | null
          dispatched_by?: string | null
          hospital_id: string
          id?: string
          notes?: string | null
          received_at?: string | null
          received_by?: string | null
          requested_at?: string
          requested_by: string
          source_branch_id: string
          status?: string
          transfer_no: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          destination_branch_id?: string
          dispatched_at?: string | null
          dispatched_by?: string | null
          hospital_id?: string
          id?: string
          notes?: string | null
          received_at?: string | null
          received_by?: string | null
          requested_at?: string
          requested_by?: string
          source_branch_id?: string
          status?: string
          transfer_no?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfers_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_destination_branch_id_fkey"
            columns: ["destination_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_dispatched_by_fkey"
            columns: ["dispatched_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_source_branch_id_fkey"
            columns: ["source_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      vitals_records: {
        Row: {
          admission_id: string
          blood_pressure: string | null
          blood_sugar: number | null
          height: number | null
          hospital_id: string | null
          id: string
          notes: string | null
          pain_level: number | null
          patient_id: string
          pulse: number | null
          recorded_at: string | null
          recorded_by: string | null
          respiratory_rate: number | null
          spo2: number | null
          temperature: number | null
          weight: number | null
        }
        Insert: {
          admission_id: string
          blood_pressure?: string | null
          blood_sugar?: number | null
          height?: number | null
          hospital_id?: string | null
          id?: string
          notes?: string | null
          pain_level?: number | null
          patient_id: string
          pulse?: number | null
          recorded_at?: string | null
          recorded_by?: string | null
          respiratory_rate?: number | null
          spo2?: number | null
          temperature?: number | null
          weight?: number | null
        }
        Update: {
          admission_id?: string
          blood_pressure?: string | null
          blood_sugar?: number | null
          height?: number | null
          hospital_id?: string | null
          id?: string
          notes?: string | null
          pain_level?: number | null
          patient_id?: string
          pulse?: number | null
          recorded_at?: string | null
          recorded_by?: string | null
          respiratory_rate?: number | null
          spo2?: number | null
          temperature?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vitals_records_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vitals_records_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vitals_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vitals_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      wards: {
        Row: {
          created_at: string | null
          floor: string | null
          hospital_id: string | null
          id: string
          is_active: boolean | null
          name: string
          total_beds: number | null
          ward_type: string | null
        }
        Insert: {
          created_at?: string | null
          floor?: string | null
          hospital_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          total_beds?: number | null
          ward_type?: string | null
        }
        Update: {
          created_at?: string | null
          floor?: string | null
          hospital_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          total_beds?: number | null
          ward_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wards_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      hash_password: { Args: { raw_password: string }; Returns: string }
      verify_password: {
        Args: { hashed: string; raw_password: string }
        Returns: boolean
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
    Enums: {},
  },
} as const
