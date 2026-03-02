export type IssueStatus = 'pending' | 'resolved' | 'escalated';

export interface Issue {
  id?: number;
  description: string;
  date: string;
  user_email: string;
  furniture_id: number;
  furniture_name?: string;
  furniture_reference?: string;
  furniture_image?: string;
  provider_name?: string;
  provider_id?: number;
  status?: IssueStatus;
  resolved_at?: string | null;
  resolved_by?: string | null;
  escalated_to_admin?: boolean;
}