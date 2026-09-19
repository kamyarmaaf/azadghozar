'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  claimReferralReward,
  clearSession,
  completeSignup,
  createRoleChange,
  fetchCurrentUser,
  fetchMyRoleChanges,
  fetchReferralStats,
  passwordLogin,
  requestLoginOtp,
  requestSignupOtp,
  updateCurrentUserProfile,
  updateBusinessMedia,
  verifyLoginOtp,
  verifySignupOtp,
  type AuthUser,
  type ReferralRecord,
  type ReferralState,
  type RoleChangeRequest,
  type ProfileUpdateInput,
  type SignupCompleteInput,
  type UserRole,
} from '@/lib/account-api';
import { useFavorites } from '@/stores/favorites';

export type { AuthUser, ReferralRecord, ReferralState, UserRole };
export type PendingRoleChange = RoleChangeRequest;

export const roleLabels: Record<UserRole, string> = {
  buyer: 'خریدار',
  seller: 'فروشنده شخصی',
  gallery: 'نمایشگاه‌دار',
  agency: 'نمایندگی',
  expert: 'کارشناس خودرو',
  admin: 'مدیر سامانه',
  org: 'مدیریت سازمان منطقه آزاد',
  free_zone_supervisor: 'پنل نظارت منطقه آزاد',
  smart_id_operator: 'اپراتور شناسنامه هوشمند',
};

export const roleColors: Record<UserRole, string> = {
  buyer: 'text-blue-500',
  seller: 'text-green-500',
  gallery: 'text-purple-500',
  agency: 'text-indigo-500',
  expert: 'text-cyan-600',
  admin: 'text-red-500',
  org: 'text-amber-600',
  free_zone_supervisor: 'text-orange-600',
  smart_id_operator: 'text-teal-600',
};

const defaultReferralState: ReferralState = {
  referralCount: 0,
  totalEarnings: 0,
  availableCredit: 0,
  unclaimedRewards: 0,
  referralRecords: [],
};

interface AuthState {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;
  referral: ReferralState;
  pendingRoleChange: PendingRoleChange | null;
  setHasHydrated: () => void;
  requestRegistrationOtp: (
    phoneNumber: string,
    role: UserRole,
    referralCode?: string,
  ) => Promise<void>;
  confirmRegistrationOtp: (
    phoneNumber: string,
    otp: string,
  ) => Promise<AuthUser>;
  finishRegistration: (input: SignupCompleteInput) => Promise<AuthUser>;
  loginWithPassword: (
    identifier: string,
    password: string,
  ) => Promise<AuthUser>;
  requestSmsLogin: (phoneNumber: string) => Promise<void>;
  confirmSmsLogin: (
    phoneNumber: string,
    otp: string,
  ) => Promise<AuthUser>;
  refreshSession: () => Promise<AuthUser | null>;
  updateProfile: (input: ProfileUpdateInput) => Promise<AuthUser>;
  updateBusinessImages: (input: {
    businessLogo?: File;
    businessCover?: File;
  }) => Promise<AuthUser>;
  logout: () => void;
  updateRole: (newRole: UserRole) => void;
  setPendingRoleChange: (request: PendingRoleChange | null) => void;
  submitRoleChange: (
    toRole: UserRole,
    reason: string,
  ) => Promise<PendingRoleChange>;
  loadRoleChanges: () => Promise<PendingRoleChange | null>;
  loadReferralState: () => Promise<void>;
  claimReward: (recordId: string) => Promise<void>;
}

function authenticatedState(user: AuthUser) {
  return {
    currentUser: user,
    isAuthenticated: true,
    isLoading: false,
  };
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,
      referral: defaultReferralState,
      pendingRoleChange: null,

      setHasHydrated: () => set({ _hasHydrated: true }),

      requestRegistrationOtp: async (phoneNumber, role, referralCode) => {
        set({ isLoading: true });
        try {
          await requestSignupOtp({ phoneNumber, role, referralCode });
        } finally {
          set({ isLoading: false });
        }
      },

      confirmRegistrationOtp: async (phoneNumber, otp) => {
        set({ isLoading: true });
        try {
          const user = await verifySignupOtp(phoneNumber, otp);
          set(authenticatedState(user));
          return user;
        } finally {
          set({ isLoading: false });
        }
      },

      finishRegistration: async (input) => {
        set({ isLoading: true });
        try {
          const user = await completeSignup(input);
          set(authenticatedState(user));
          return user;
        } finally {
          set({ isLoading: false });
        }
      },

      loginWithPassword: async (identifier, password) => {
        set({ isLoading: true });
        try {
          const user = await passwordLogin(identifier, password);
          set(authenticatedState(user));
          void get().loadReferralState();
          void get().loadRoleChanges();
          return user;
        } finally {
          set({ isLoading: false });
        }
      },

      requestSmsLogin: async (phoneNumber) => {
        set({ isLoading: true });
        try {
          await requestLoginOtp(phoneNumber);
        } finally {
          set({ isLoading: false });
        }
      },

      confirmSmsLogin: async (phoneNumber, otp) => {
        set({ isLoading: true });
        try {
          const user = await verifyLoginOtp(phoneNumber, otp);
          set(authenticatedState(user));
          void get().loadReferralState();
          void get().loadRoleChanges();
          return user;
        } finally {
          set({ isLoading: false });
        }
      },

      refreshSession: async () => {
        try {
          const user = await fetchCurrentUser();
          set(authenticatedState(user));
          return user;
        } catch {
          clearSession();
          useFavorites.getState().reset();
          set({
            currentUser: null,
            isAuthenticated: false,
            isLoading: false,
            referral: defaultReferralState,
            pendingRoleChange: null,
          });
          return null;
        }
      },

      updateProfile: async (input) => {
        set({ isLoading: true });
        try {
          const user = await updateCurrentUserProfile(input);
          set(authenticatedState(user));
          return user;
        } finally {
          set({ isLoading: false });
        }
      },

      updateBusinessImages: async (input) => {
        set({ isLoading: true });
        try {
          const user = await updateBusinessMedia(input);
          set(authenticatedState(user));
          return user;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        clearSession();
        useFavorites.getState().reset();
        set({
          currentUser: null,
          isAuthenticated: false,
          referral: defaultReferralState,
          pendingRoleChange: null,
        });
      },

      updateRole: (newRole) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;
        set({ currentUser: { ...currentUser, role: newRole } });
      },

      setPendingRoleChange: (pendingRoleChange) => {
        set({ pendingRoleChange });
      },

      submitRoleChange: async (toRole, reason) => {
        const request = await createRoleChange({ toRole, reason });
        set({ pendingRoleChange: request });
        return request;
      },

      loadRoleChanges: async () => {
        if (!get().isAuthenticated) return null;
        const requests = await fetchMyRoleChanges();
        const latest = requests[0] || null;
        set({ pendingRoleChange: latest });
        if (latest?.status === 'approved') {
          await get().refreshSession();
        }
        return latest;
      },

      loadReferralState: async () => {
        if (!get().isAuthenticated) return;
        const referral = await fetchReferralStats();
        set({ referral });
      },

      claimReward: async (recordId) => {
        await claimReferralReward(recordId);
        await get().loadReferralState();
      },
    }),
    {
      name: 'azadgozar-auth',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated();
        if (state?.isAuthenticated) {
          void state.refreshSession();
        }
      },
    },
  ),
);
