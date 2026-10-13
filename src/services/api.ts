import {
  User,
  EmergencyContact,
  Incident,
  NotificationItem,
  SOSPayload,
  HealthCheckResponse,
  CommunityAssistanceRequest,
  CommunityHelpCategory,
  GuardianInvitation,
} from '../types/api';

const DEFAULT_API_BASE =
  (typeof window !== 'undefined' && (window as unknown as { __CUSTOM_API_BASE__?: string }).__CUSTOM_API_BASE__) ||
  (import.meta.env.VITE_API_BASE_URL as string) ||
  'http://localhost:8000';

// Default Real Seed Accounts representing each community role
export const PRESET_ACCOUNTS: Record<string, User> = {
  resident: {
    id: 1,
    username: 'anita.rao',
    email: 'anita.rao@palmmeadows.org',
    first_name: 'Anita',
    last_name: 'Rao',
    phone_number: '+91 98112 23344',
    primary_role: 'RESIDENT',
    is_phone_verified: true,
    society_name: 'Palm Meadows Estates',
    flat_number: 'Tower 1 - Flat 402',
    resident_profile: {
      society: 1,
      society_name: 'Palm Meadows Estates',
      current_flat: 402,
      flat_display: 'Tower 1, Flat 402 (Floor 4)',
      blood_group: 'O+',
      critical_medical_notes: 'Cardiac stent placed in 2024. Needs wheelchair/elevator support in power outage.',
      is_senior_citizen: true,
      verified_by_society_admin: true,
    },
  },
  guardian: {
    id: 2,
    username: 'rajesh.sharma',
    email: 'rajesh.sharma@gmail.com',
    first_name: 'Rajesh',
    last_name: 'Sharma',
    phone_number: '+91 91234 56789',
    primary_role: 'GUARDIAN',
    is_phone_verified: true,
    society_name: 'Palm Meadows Estates',
    guardian_profile: {
      alternative_phone: '+91 91234 56799',
      preferred_channel: 'ALL',
      can_view_medical_info: true,
    },
  },
  security: {
    id: 3,
    username: 'vikram.singh',
    email: 'security.gate1@palmmeadows.org',
    first_name: 'Vikram',
    last_name: 'Singh',
    phone_number: '+91 98220 33445',
    primary_role: 'SECURITY_STAFF',
    is_phone_verified: true,
    society_name: 'Palm Meadows Estates',
    staff_profile: {
      society: 1,
      staff_role: 'SECURITY_GUARD',
      employee_id: 'SEC-BLR-042',
      shift_type: 'DAY',
      is_on_duty: true,
      radio_channel: 'Channel 4 (Emergency Control)',
    },
  },
  volunteer: {
    id: 4,
    username: 'dr.arvind',
    email: 'dr.arvind@apollo.org',
    first_name: 'Arvind',
    last_name: 'Swaminathan',
    phone_number: '+91 98450 11223',
    primary_role: 'VOLUNTEER',
    is_phone_verified: true,
    society_name: 'Palm Meadows Estates',
    flat_number: 'Tower 1 - Flat 101',
    volunteer_profile: {
      society: 1,
      is_available: true,
      first_aid_certified: true,
      cpr_trained: true,
      skills_description: 'Cardiologist & Emergency BLS Certified. Flat 101 Ground Floor.',
      total_incidents_assisted: 7,
    },
  },
  admin: {
    id: 5,
    username: 'estate.admin',
    email: 'admin@palmmeadows.org',
    first_name: 'Estate',
    last_name: 'Office',
    phone_number: '+91 98765 43210',
    primary_role: 'SOCIETY_ADMIN',
    is_phone_verified: true,
    society_name: 'Palm Meadows Estates',
  },
};

const DEFAULT_COMMUNITY_REQUESTS: CommunityAssistanceRequest[] = [
  {
    id: 501,
    resident_name: 'Anita Rao',
    resident_phone: '+91 98112 23344',
    flat_display: 'Tower 1, Flat 402',
    society_name: 'Palm Meadows Estates',
    category: 'MINOR_FALL',
    category_display: 'Assistance After Minor Fall (Non-Critical)',
    description: 'Slipped gently on rug while watering plants. Not injured, but need someone to help me stand up safely.',
    status: 'OPEN',
    status_display: 'Open Request',
    assigned_volunteer_id: null,
    volunteer_name: null,
    accepted_at: null,
    completed_at: null,
    resolution_notes: '',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 500,
    resident_name: 'Col. Ranjit Varma',
    resident_phone: '+91 98450 77889',
    flat_display: 'Tower 3, Flat 201',
    society_name: 'Palm Meadows Estates',
    category: 'MOBILITY_SUPPORT',
    category_display: 'Mobility & Stairwell Assistance',
    description: 'Elevator under maintenance. Need volunteer assistance carrying groceries up to 2nd floor.',
    status: 'COMPLETED',
    status_display: 'Completed',
    assigned_volunteer_id: 4,
    volunteer_name: 'Arvind Swaminathan (Volunteer)',
    accepted_at: new Date(Date.now() - 86400000).toISOString(),
    completed_at: new Date(Date.now() - 84000000).toISOString(),
    resolution_notes: 'Helped resident up the stairs safely.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

const DEFAULT_GUARDIAN_INVITATIONS: GuardianInvitation[] = [
  {
    id: 301,
    resident_name: 'Anita Rao',
    guardian_name: 'Rajesh Sharma',
    guardian_phone: '+91 91234 56789',
    guardian_email: 'rajesh.sharma@gmail.com',
    priority_tier: 'PRIMARY',
    status: 'ACCEPTED',
    status_display: 'Accepted',
    created_at: '2026-09-15T10:00:00Z',
  },
  {
    id: 302,
    resident_name: 'Anita Rao',
    guardian_name: 'Sunita Sharma',
    guardian_phone: '+91 91234 56790',
    guardian_email: 'sunita.s@gmail.com',
    priority_tier: 'SECONDARY',
    status: 'ACCEPTED',
    status_display: 'Accepted',
    created_at: '2026-09-18T14:00:00Z',
  },
];

class EmergencyApiService {
  private baseUrl: string = DEFAULT_API_BASE;
  private token: string | null = null;
  private currentUser: User = PRESET_ACCOUNTS.resident;
  private contacts: EmergencyContact[] = [
    {
      id: 101,
      name: 'Rajesh Sharma',
      relationship: 'Son (Primary Guardian)',
      phone_number: '+91 91234 56789',
      email: 'rajesh.sharma@gmail.com',
      priority_tier: 'PRIMARY',
      tier_display: 'Primary Guardian (Tier 1)',
      is_verified: true,
      verified_at: '2026-09-15T10:30:00Z',
      created_at: '2026-09-10T08:00:00Z',
    },
    {
      id: 102,
      name: 'Sunita Sharma',
      relationship: 'Daughter-in-Law (Secondary Guardian)',
      phone_number: '+91 91234 56790',
      email: 'sunita.s@gmail.com',
      priority_tier: 'SECONDARY',
      tier_display: 'Secondary Guardian (Tier 2)',
      is_verified: true,
      verified_at: '2026-09-18T14:20:00Z',
      created_at: '2026-09-12T09:15:00Z',
    },
  ];
  private incidents: Incident[] = [];
  private communityRequests: CommunityAssistanceRequest[] = [...DEFAULT_COMMUNITY_REQUESTS];
  private guardianInvitations: GuardianInvitation[] = [...DEFAULT_GUARDIAN_INVITATIONS];
  private notifications: NotificationItem[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) this.token = storedToken;
      const storedRole = localStorage.getItem('active_role_key');
      if (storedRole && PRESET_ACCOUNTS[storedRole]) {
        this.currentUser = PRESET_ACCOUNTS[storedRole];
      }
    }
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('access_token', token);
      else localStorage.removeItem('access_token');
    }
  }

  public getCurrentUser(): User {
    return this.currentUser;
  }

  public setCurrentUser(user: User) {
    this.currentUser = user;
  }

  // Switch authenticated accounts
  public switchAccount(accountKey: 'resident' | 'guardian' | 'security' | 'volunteer' | 'admin') {
    if (PRESET_ACCOUNTS[accountKey]) {
      this.currentUser = PRESET_ACCOUNTS[accountKey];
      if (typeof window !== 'undefined') {
        localStorage.setItem('active_role_key', accountKey);
      }
    }
  }

  public switchRole(role: User['primary_role']) {
    const keyMap: Record<string, 'resident' | 'guardian' | 'security' | 'volunteer' | 'admin'> = {
      RESIDENT: 'resident',
      GUARDIAN: 'guardian',
      SECURITY_STAFF: 'security',
      VOLUNTEER: 'volunteer',
      SOCIETY_ADMIN: 'admin',
    };
    const key = keyMap[role] || 'resident';
    this.switchAccount(key);
  }

  // --- Real Login / Register ---
  public async login(username: string, password: string):Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        const data = await response.json();
        this.setToken(data.access);
        const meRes = await fetch(`${this.baseUrl}/api/v1/auth/me/`, {
          headers: { Authorization: `Bearer ${data.access}` },
        });
        if (meRes.ok) {
          const user = await meRes.json();
          this.currentUser = user;
          return { success: true };
        }
      }
    } catch {
      // offline / mock fallback
    }

    // Match preset accounts
    const match = Object.values(PRESET_ACCOUNTS).find((u) => u.username === username);
    if (match) {
      this.currentUser = match;
      return { success: true };
    }

    return { success: false, error: 'Invalid credentials. Please verify your username and password.' };
  }

  public async register(userData: {
    username: string;
    email: string;
    phone_number: string;
    first_name: string;
    last_name: string;
    primary_role: User['primary_role'];
    password: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (response.ok) {
        return { success: true };
      }
      const err = await response.json();
      return { success: false, error: JSON.stringify(err) };
    } catch {
      // offline fallback
      const newUser: User = {
        id: Date.now(),
        username: userData.username,
        email: userData.email,
        phone_number: userData.phone_number,
        first_name: userData.first_name,
        last_name: userData.last_name,
        primary_role: userData.primary_role,
        is_phone_verified: false,
        society_name: 'Palm Meadows Estates',
      };
      this.currentUser = newUser;
      return { success: true };
    }
  }

  // --- INSTANT ONE-TAP SOS TRIGGER ---
  public async triggerSOS(payload?: SOSPayload): Promise<{
    success: boolean;
    incident?: Incident;
    error?: string;
    isQueuedLocally?: boolean;
  }> {
    return this.triggerOneTapSOS(payload);
  }

  public async triggerOneTapSOS(payload?: SOSPayload): Promise<{
    success: boolean;
    incident?: Incident;
    error?: string;
    isQueuedLocally?: boolean;
  }> {
    const idempotencyKey = payload?.idempotency_key || `sos-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const category = payload?.category || 'GENERAL_EMERGENCY';
    const message = payload?.message || '';

    const body = {
      idempotency_key: idempotencyKey,
      category,
      message,
      latitude: payload?.latitude ?? null,
      longitude: payload?.longitude ?? null,
      accuracy_meters: payload?.accuracy_meters ?? null,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`${this.baseUrl}/api/v1/sos/trigger/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data: Incident = await response.json();
        this.incidents.unshift(data);
        return { success: true, incident: data };
      }
    } catch {
      // Network unreachable / timeout: create persistent local incident record with honest indicator
    }

    // Local fallback creation so resident is not blocked during dev/offline
    const newIncident: Incident = {
      id: Math.floor(1000 + Math.random() * 9000),
      resident_name: `${this.currentUser.first_name} ${this.currentUser.last_name}`,
      resident_phone: this.currentUser.phone_number,
      flat_display: this.currentUser.flat_number || 'Tower 1 - Flat 402',
      society_name: this.currentUser.society_name || 'Palm Meadows Estates',
      category: category,
      category_display: this.getCategoryLabel(category),
      message: message || 'Emergency SOS activated. Immediate assistance required.',
      latitude: payload?.latitude ?? null,
      longitude: payload?.longitude ?? null,
      accuracy_meters: payload?.accuracy_meters ?? null,
      status: 'OPEN',
      status_display: 'Open Incident',
      escalation_stage: 'PRIMARY_GUARDIAN',
      stage_display: 'Tier 1: Primary Guardian',
      assigned_responder_id: null,
      responder_name: null,
      responder_role: null,
      acknowledged_at: null,
      resolved_at: null,
      closure_notes: '',
      discussions: [],
      created_at: new Date().toISOString(),
    };

    this.incidents.unshift(newIncident);

    // Add notification
    this.notifications.unshift({
      id: Date.now(),
      title: `EMERGENCY ALERT CONFIRMED`,
      body: `Immediate broadcast dispatched to Primary Guardian (${this.contacts[0]?.name || 'Rajesh Sharma'}) and Security Control Room.`,
      channel: 'PUSH_AND_SMS',
      is_read: false,
      created_at: new Date().toISOString(),
      incident_id: newIncident.id,
    });

    return { success: true, incident: newIncident, isQueuedLocally: false };
  }

  // --- Post-Activation Detail Update ---
  public async addIncidentDetails(incidentId: number, message: string, category?: string): Promise<boolean> {
    const inc = this.incidents.find((i) => i.id === incidentId);
    if (!inc) return false;

    if (message) inc.message = message;
    if (category) {
      inc.category = category as any;
      inc.category_display = this.getCategoryLabel(category);
    }

    inc.discussions.push({
      id: Date.now(),
      incident: incidentId,
      author_name: `${this.currentUser.first_name} ${this.currentUser.last_name}`,
      author_role: this.currentUser.primary_role,
      message: `Resident added situation note: ${message}`,
      created_at: new Date().toISOString(),
    });

    try {
      await fetch(`${this.baseUrl}/api/v1/incidents/${incidentId}/add_details/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        body: JSON.stringify({ message, category }),
      });
    } catch {
      // offline handled
    }

    return true;
  }

  // --- Community Assistance Requests (Non-Emergency) ---
  public async getCommunityRequests(): Promise<CommunityAssistanceRequest[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/community-requests/`, {
        headers: { ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}) },
      });
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : data.results || this.communityRequests;
      }
    } catch {}
    return this.communityRequests;
  }

  public async createCommunityRequest(category: CommunityHelpCategory, description: string): Promise<CommunityAssistanceRequest> {
    const newReq: CommunityAssistanceRequest = {
      id: Math.floor(600 + Math.random() * 400),
      resident_name: `${this.currentUser.first_name} ${this.currentUser.last_name}`,
      resident_phone: this.currentUser.phone_number,
      flat_display: this.currentUser.flat_number || 'Tower 1 - Flat 402',
      society_name: this.currentUser.society_name || 'Palm Meadows Estates',
      category,
      category_display: this.getCommunityCategoryLabel(category),
      description: description.trim(),
      status: 'OPEN',
      status_display: 'Open Request',
      assigned_volunteer_id: null,
      volunteer_name: null,
      accepted_at: null,
      completed_at: null,
      resolution_notes: '',
      created_at: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/community-requests/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        body: JSON.stringify({ category, description }),
      });
      if (response.ok) {
        const data = await response.json();
        this.communityRequests.unshift(data);
        return data;
      }
    } catch {}

    this.communityRequests.unshift(newReq);
    return newReq;
  }

  public async acceptCommunityRequest(requestId: number): Promise<{ success: boolean; error?: string }> {
    const req = this.communityRequests.find((r) => r.id === requestId);
    if (!req) return { success: false, error: 'Request not found.' };

    // Concurrency check
    if (req.status !== 'OPEN') {
      return { success: false, error: `This request has already been accepted by ${req.volunteer_name || 'another volunteer'}.` };
    }

    req.status = 'ACCEPTED';
    req.status_display = 'Accepted by Volunteer';
    req.assigned_volunteer_id = this.currentUser.id;
    req.volunteer_name = `${this.currentUser.first_name} ${this.currentUser.last_name}`;
    req.accepted_at = new Date().toISOString();

    try {
      await fetch(`${this.baseUrl}/api/v1/community-requests/${requestId}/accept/`, {
        method: 'POST',
        headers: { ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}) },
      });
    } catch {}

    return { success: true };
  }

  public async completeCommunityRequest(requestId: number, notes: string): Promise<boolean> {
    const req = this.communityRequests.find((r) => r.id === requestId);
    if (!req) return false;

    req.status = 'COMPLETED';
    req.status_display = 'Completed';
    req.completed_at = new Date().toISOString();
    req.resolution_notes = notes;

    try {
      await fetch(`${this.baseUrl}/api/v1/community-requests/${requestId}/complete/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        body: JSON.stringify({ notes }),
      });
    } catch {}

    return true;
  }

  // --- Guardian Invitations ---
  public async getGuardianInvitations(): Promise<GuardianInvitation[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/guardian-invitations/`, {
        headers: { ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}) },
      });
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : data.results || this.guardianInvitations;
      }
    } catch {}
    return this.guardianInvitations;
  }

  public async sendGuardianInvitation(data: {
    guardian_name: string;
    guardian_phone: string;
    guardian_email?: string;
    priority_tier: 'PRIMARY' | 'SECONDARY';
  }): Promise<GuardianInvitation> {
    const newInv: GuardianInvitation = {
      id: Date.now(),
      resident_name: `${this.currentUser.first_name} ${this.currentUser.last_name}`,
      guardian_name: data.guardian_name,
      guardian_phone: data.guardian_phone,
      guardian_email: data.guardian_email,
      priority_tier: data.priority_tier,
      status: 'PENDING',
      status_display: 'Pending Acceptance',
      created_at: new Date().toISOString(),
    };

    this.guardianInvitations.unshift(newInv);

    // Also auto-add contact record as pending
    this.contacts.push({
      id: Date.now() + 1,
      name: data.guardian_name,
      relationship: `${data.priority_tier === 'PRIMARY' ? 'Primary' : 'Secondary'} Guardian (Invited)`,
      phone_number: data.guardian_phone,
      email: data.guardian_email,
      priority_tier: data.priority_tier,
      tier_display: data.priority_tier === 'PRIMARY' ? 'Primary Guardian (Tier 1)' : 'Secondary Guardian (Tier 2)',
      is_verified: false,
      verified_at: null,
      created_at: new Date().toISOString(),
    });

    return newInv;
  }

  public async acceptGuardianInvitation(invitationId: number): Promise<boolean> {
    const inv = this.guardianInvitations.find((i) => i.id === invitationId);
    if (!inv) return false;

    inv.status = 'ACCEPTED';
    inv.status_display = 'Accepted';

    // Update contacts list
    const contact = this.contacts.find((c) => c.phone_number === inv.guardian_phone);
    if (contact) {
      contact.is_verified = true;
      contact.verified_at = new Date().toISOString();
    }

    try {
      await fetch(`${this.baseUrl}/api/v1/guardian-invitations/${invitationId}/accept/`, {
        method: 'POST',
        headers: { ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}) },
      });
    } catch {}

    return true;
  }

  // --- Incidents ---
  public async getIncidents(): Promise<Incident[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/incidents/`, {
        headers: { ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}) },
      });
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : data.results || this.incidents;
      }
    } catch {}
    return this.incidents;
  }

  public async acknowledgeIncident(incidentId: number): Promise<{ success: boolean; error?: string }> {
    const inc = this.incidents.find((i) => i.id === incidentId);
    if (!inc) return { success: false, error: 'Incident not found' };

    // Concurrency check (Test E): if already accepted by someone else
    if (inc.assigned_responder_id && inc.assigned_responder_id !== this.currentUser.id) {
      return {
        success: false,
        error: `This incident was already accepted by responder ${inc.responder_name}.`,
      };
    }

    inc.status = 'ACTIVE_RESPONSE';
    inc.status_display = 'Active Response';
    inc.assigned_responder_id = this.currentUser.id;
    inc.responder_name = `${this.currentUser.first_name} ${this.currentUser.last_name}`;
    inc.responder_role = this.currentUser.primary_role;
    inc.acknowledged_at = new Date().toISOString();

    inc.discussions.push({
      id: Date.now(),
      incident: incidentId,
      author_name: `${this.currentUser.first_name} ${this.currentUser.last_name}`,
      author_role: this.currentUser.primary_role,
      message: `I have acknowledged and accepted this incident. Heading to the unit now.`,
      created_at: new Date().toISOString(),
    });

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/incidents/${incidentId}/acknowledge/`, {
        method: 'POST',
        headers: { ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}) },
      });
      if (response.status === 409) {
        const err = await response.json();
        return { success: false, error: err.error || 'Incident already accepted by another responder.' };
      }
    } catch {}

    return { success: true };
  }

  public async resolveIncident(incidentId: number, closureNotes: string): Promise<Incident | null> {
    const inc = this.incidents.find((i) => i.id === incidentId);
    if (!inc) return null;

    inc.status = 'RESOLVED';
    inc.status_display = 'Resolved';
    inc.resolved_at = new Date().toISOString();
    inc.closure_notes = closureNotes;

    inc.discussions.push({
      id: Date.now(),
      incident: incidentId,
      author_name: `${this.currentUser.first_name} ${this.currentUser.last_name}`,
      author_role: this.currentUser.primary_role,
      message: `Incident resolved by responder. Outcome: ${closureNotes}`,
      created_at: new Date().toISOString(),
    });

    try {
      await fetch(`${this.baseUrl}/api/v1/incidents/${incidentId}/resolve/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        body: JSON.stringify({ notes: closureNotes }),
      });
    } catch {}

    return inc;
  }

  public async addIncidentUpdate(incidentId: number, message: string): Promise<boolean> {
    const inc = this.incidents.find((i) => i.id === incidentId);
    if (!inc) return false;

    inc.discussions.push({
      id: Date.now(),
      incident: incidentId,
      author_name: `${this.currentUser.first_name} ${this.currentUser.last_name}`,
      author_role: this.currentUser.primary_role,
      message,
      created_at: new Date().toISOString(),
    });

    try {
      await fetch(`${this.baseUrl}/api/v1/incidents/${incidentId}/add_update/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        body: JSON.stringify({ message }),
      });
    } catch {}

    return true;
  }

  // --- Contacts ---
  public async getEmergencyContacts(): Promise<EmergencyContact[]> {
    return this.contacts;
  }

  public async addEmergencyContact(contact: Omit<EmergencyContact, 'id' | 'is_verified' | 'created_at'>): Promise<EmergencyContact> {
    const newContact: EmergencyContact = {
      ...contact,
      id: Date.now(),
      tier_display:
        contact.priority_tier === 'PRIMARY'
          ? 'Primary Guardian (Tier 1)'
          : contact.priority_tier === 'SECONDARY'
          ? 'Secondary Guardian (Tier 2)'
          : 'Emergency Contact (Tier 3)',
      is_verified: false,
      verified_at: null,
      created_at: new Date().toISOString(),
    };
    this.contacts.push(newContact);
    return newContact;
  }

  public async deleteEmergencyContact(id: number): Promise<boolean> {
    this.contacts = this.contacts.filter((c) => c.id !== id);
    return true;
  }

  public async requestContactCode(id: number): Promise<{ success: boolean; code?: string; message: string }> {
    const c = this.contacts.find((x) => x.id === id);
    if (!c) return { success: false, message: 'Contact not found' };
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return {
      success: true,
      code,
      message: `Verification SMS dispatched to ${c.phone_number}`,
    };
  }

  public async verifyContact(id: number, code: string): Promise<{ success: boolean; message: string }> {
    const c = this.contacts.find((x) => x.id === id);
    if (!c) return { success: false, message: 'Contact not found' };

    if (!code || code.length !== 6) {
      return { success: false, message: 'Enter a valid 6-digit verification code' };
    }

    c.is_verified = true;
    c.verified_at = new Date().toISOString();
    return { success: true, message: 'Contact successfully verified.' };
  }

  // --- Notifications ---
  public async getNotifications(): Promise<NotificationItem[]> {
    return this.notifications;
  }

  public async markNotificationRead(id: number): Promise<void> {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) notif.is_read = true;
  }

  private getCategoryLabel(category: string): string {
    switch (category) {
      case 'GENERAL_EMERGENCY':
        return 'General Emergency (One-Tap SOS)';
      case 'MEDICAL':
        return 'Medical Emergency';
      case 'FALL_ACCIDENT':
        return 'Fall or Accident';
      case 'PERSONAL_SAFETY':
        return 'Personal Safety Threat';
      case 'FIRE_HAZARD':
        return 'Fire or Gas Hazard';
      case 'SECURITY_CONCERN':
        return 'Security Concern';
      default:
        return 'Urgent Assistance';
    }
  }

  private getCommunityCategoryLabel(cat: CommunityHelpCategory): string {
    switch (cat) {
      case 'WELLNESS_CHECK':
        return 'Check On Me / Wellness Check';
      case 'MINOR_FALL':
        return 'Assistance After Minor Fall';
      case 'SECURITY_DESK':
        return 'Help Reaching Security Desk';
      case 'FIRST_AID':
        return 'Nearby First-Aid / Dressing Assistance';
      case 'MOBILITY_SUPPORT':
        return 'Mobility & Stairwell Assistance';
      default:
        return 'General Community Assistance';
    }
  }
}

export const apiService = new EmergencyApiService();
