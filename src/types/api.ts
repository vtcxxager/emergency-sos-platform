export type UserRole =
  | 'RESIDENT'
  | 'GUARDIAN'
  | 'VOLUNTEER'
  | 'SECURITY_STAFF'
  | 'SOCIETY_ADMIN'
  | 'PLATFORM_ADMIN';

export interface ResidentProfile {
  society: number;
  society_name?: string;
  current_flat?: number;
  flat_display?: string;
  blood_group: string;
  critical_medical_notes: string;
  is_senior_citizen: boolean;
  verified_by_society_admin: boolean;
}

export interface GuardianProfile {
  alternative_phone: string;
  preferred_channel: string;
  can_view_medical_info: boolean;
}

export interface StaffProfile {
  society: number;
  society_name?: string;
  staff_role: string;
  employee_id: string;
  shift_type: string;
  is_on_duty: boolean;
  radio_channel: string;
}

export interface VolunteerProfile {
  society: number;
  society_name?: string;
  is_available: boolean;
  first_aid_certified: boolean;
  cpr_trained: boolean;
  skills_description: string;
  total_incidents_assisted: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  primary_role: UserRole;
  is_phone_verified: boolean;
  society_name?: string;
  flat_number?: string;
  resident_profile?: ResidentProfile;
  guardian_profile?: GuardianProfile;
  staff_profile?: StaffProfile;
  volunteer_profile?: VolunteerProfile;
}

export type PriorityTier = 'PRIMARY' | 'SECONDARY' | 'EMERGENCY';

export interface EmergencyContact {
  id: number;
  name: string;
  relationship: string;
  phone_number: string;
  email?: string;
  priority_tier: PriorityTier;
  tier_display?: string;
  is_verified: boolean;
  verified_at?: string | null;
  created_at: string;
}

export type EmergencyCategory =
  | 'GENERAL_EMERGENCY'
  | 'MEDICAL'
  | 'FALL_ACCIDENT'
  | 'PERSONAL_SAFETY'
  | 'FIRE_HAZARD'
  | 'SECURITY_CONCERN'
  | 'GENERAL_ASSISTANCE';

export interface SOSPayload {
  category?: EmergencyCategory;
  message?: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy_meters?: number | null;
  idempotency_key?: string;
}

export type IncidentStatus =
  | 'OPEN'
  | 'ACKNOWLEDGED'
  | 'ACCEPTED'
  | 'ACTIVE_RESPONSE'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'CANCELLED';

export type EscalationStage =
  | 'PRIMARY_GUARDIAN'
  | 'SECONDARY_GUARDIAN'
  | 'COMMUNITY_BROADCAST';

export interface IncidentDiscussion {
  id: number;
  incident: number;
  author_name: string;
  author_role: string;
  message: string;
  created_at: string;
}

export interface Incident {
  id: number;
  sos_alert_id?: string;
  resident_name: string;
  resident_phone: string;
  flat_display: string;
  society_name: string;
  category: EmergencyCategory;
  category_display: string;
  message: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy_meters?: number | null;
  status: IncidentStatus;
  status_display: string;
  escalation_stage: EscalationStage;
  stage_display: string;
  assigned_responder_id?: number | null;
  responder_name?: string | null;
  responder_role?: string | null;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
  closure_notes?: string;
  discussions: IncidentDiscussion[];
  created_at: string;
}

export type CommunityHelpCategory =
  | 'WELLNESS_CHECK'
  | 'MINOR_FALL'
  | 'SECURITY_DESK'
  | 'FIRST_AID'
  | 'MOBILITY_SUPPORT'
  | 'GENERAL_SUPPORT';

export interface CommunityAssistanceRequest {
  id: number;
  resident_name: string;
  resident_phone: string;
  flat_display: string;
  society_name: string;
  category: CommunityHelpCategory;
  category_display: string;
  description: string;
  status: 'OPEN' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';
  status_display: string;
  assigned_volunteer_id?: number | null;
  volunteer_name?: string | null;
  accepted_at?: string | null;
  completed_at?: string | null;
  resolution_notes?: string;
  created_at: string;
}

export interface GuardianInvitation {
  id: number;
  resident_name: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email?: string;
  priority_tier: 'PRIMARY' | 'SECONDARY';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  status_display: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  body: string;
  channel: string;
  is_read: boolean;
  created_at: string;
  incident_id?: number | null;
}

export interface DatabaseHealth {
  status: 'connected' | 'disconnected' | 'error';
  vendor: string;
  database_name: string;
  latency_ms?: number | null;
  server_version?: string | null;
  error?: string | null;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  platform: string;
  version: string;
  timestamp: string;
  environment: string;
  database: DatabaseHealth;
  services: {
    rest_framework: string;
    celery_broker: string;
    notification_dispatcher: string;
    escalation_scheduler: string;
    [key: string]: string;
  };
}
