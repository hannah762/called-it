// Generated types for the Called It! database schema.
// Once Supabase is connected, regenerate with:
//   npx supabase gen types typescript --project-id <your-project-id> > src/lib/supabase/types.ts

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          phone: string | null;
          display_name: string;
          avatar_url: string | null;
          coin_balance: number;
          streak_current: number;
          streak_best: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          phone?: string | null;
          display_name: string;
          avatar_url?: string | null;
          coin_balance?: number;
          streak_current?: number;
          streak_best?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          phone?: string | null;
          display_name?: string;
          avatar_url?: string | null;
          coin_balance?: number;
          streak_current?: number;
          streak_best?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "users_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      bets: {
        Row: {
          id: string;
          creator_id: string;
          question: string;
          stakes: string | null;
          status: "open" | "locked" | "resolved" | "expired";
          deadline: string;
          winning_option_id: string | null;
          join_code: string;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          question: string;
          stakes?: string | null;
          status?: "open" | "locked" | "resolved" | "expired";
          deadline: string;
          winning_option_id?: string | null;
          join_code?: string;
          resolved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          question?: string;
          stakes?: string | null;
          status?: "open" | "locked" | "resolved" | "expired";
          deadline?: string;
          winning_option_id?: string | null;
          join_code?: string;
          resolved_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bets_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bets_winning_option_id_fkey";
            columns: ["winning_option_id"];
            isOneToOne: false;
            referencedRelation: "options";
            referencedColumns: ["id"];
          },
        ];
      };
      options: {
        Row: {
          id: string;
          bet_id: string;
          label: string;
          is_wild_card: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          bet_id: string;
          label: string;
          is_wild_card?: boolean;
          sort_order?: number;
        };
        Update: {
          id?: string;
          bet_id?: string;
          label?: string;
          is_wild_card?: boolean;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "options_bet_id_fkey";
            columns: ["bet_id"];
            isOneToOne: false;
            referencedRelation: "bets";
            referencedColumns: ["id"];
          },
        ];
      };
      wagers: {
        Row: {
          id: string;
          bet_id: string;
          user_id: string;
          option_id: string;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          bet_id: string;
          user_id: string;
          option_id: string;
          amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          bet_id?: string;
          user_id?: string;
          option_id?: string;
          amount?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wagers_bet_id_fkey";
            columns: ["bet_id"];
            isOneToOne: false;
            referencedRelation: "bets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wagers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wagers_option_id_fkey";
            columns: ["option_id"];
            isOneToOne: false;
            referencedRelation: "options";
            referencedColumns: ["id"];
          },
        ];
      };
      payouts: {
        Row: {
          id: string;
          bet_id: string;
          user_id: string;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          bet_id: string;
          user_id: string;
          amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          bet_id?: string;
          user_id?: string;
          amount?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payouts_bet_id_fkey";
            columns: ["bet_id"];
            isOneToOne: false;
            referencedRelation: "bets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payouts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      bet_participants: {
        Row: {
          bet_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          bet_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          bet_id?: string;
          user_id?: string;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bet_participants_bet_id_fkey";
            columns: ["bet_id"];
            isOneToOne: false;
            referencedRelation: "bets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bet_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Convenience types
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Bet = Database["public"]["Tables"]["bets"]["Row"];
export type Option = Database["public"]["Tables"]["options"]["Row"];
export type Wager = Database["public"]["Tables"]["wagers"]["Row"];
export type Payout = Database["public"]["Tables"]["payouts"]["Row"];
export type BetParticipant =
  Database["public"]["Tables"]["bet_participants"]["Row"];

// Bet with joined relations (for UI)
export type BetWithOptions = Bet & {
  options: Option[];
};

export type BetFull = Bet & {
  options: Option[];
  wagers: Wager[];
  creator: User;
  participant_count: number;
};
