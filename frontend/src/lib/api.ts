import axiosInstance from "./axios";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from "@/types/user";
import type {
  Subject,
  SubjectWithMaterials,
  Material,
} from "@/types/subject";
import type {
  DifficultyTrendPoint,
  TopicDistributionItem,
  UnitDistributionItem,
  DifficultyDistributionItem,
  RepeatedQuestion,
  AnalyticsSummary,
} from "@/types/analytics";
import type { AskRequest, AskResponse, ChatSession } from "@/types/material";

// ===============================
// AUTH
// ===============================
export const auth = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const formData = new URLSearchParams();
    formData.append("username", data.email);
    formData.append("password", data.password);

    const res = await axiosInstance.post<AuthResponse>(
      "/auth/login",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return res.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const res = await axiosInstance.post<AuthResponse>(
      "/auth/register",
      data
    );
    return res.data;
  },

  me: async (): Promise<User> => {
    const res = await axiosInstance.get<User>("/auth/me");
    return res.data;
  },

  updateMe: async (data: UpdateProfileRequest): Promise<User> => {
    const res = await axiosInstance.patch<User>("/auth/me", data);
    return res.data;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
    const res = await axiosInstance.post<{ message: string }>("/auth/change-password", data);
    return res.data;
  },

  logout: async (): Promise<void> => {
    // JWT is stateless
    localStorage.removeItem("token");
  },
};

// ===============================
// SUBJECTS
// ===============================
export const subjects = {
  getAll: async (): Promise<Subject[]> => {
    const res = await axiosInstance.get<Subject[]>("/subjects");
    return res.data;
  },

  getById: async (subjectId: string): Promise<SubjectWithMaterials> => {
    const res = await axiosInstance.get<SubjectWithMaterials>(
      `/subjects/${subjectId}`
    );
    return res.data;
  },

  create: async (
    data: { name: string; year: number }
  ): Promise<Subject> => {
    const res = await axiosInstance.post<Subject>("/subjects", data);
    return res.data;
  },

  getMaterials: async (subjectId: string): Promise<Material[]> => {
    const res = await axiosInstance.get<Material[]>(
      `/subjects/${subjectId}/materials`
    );
    return res.data;
  },

  uploadMaterial: async (
    subjectId: string,
    formData: FormData
  ): Promise<Material> => {
    const res = await axiosInstance.post<Material>(
      `/subjects/${subjectId}/materials`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return res.data;
  },
};

// ===============================
// ANALYTICS
// ===============================
export const analytics = {
  getDifficultyTrend: async (
    subjectId: string
  ): Promise<DifficultyTrendPoint[]> => {
    const res = await axiosInstance.get<DifficultyTrendPoint[]>(
      "/analytics/difficulty-trend",
      { params: { subject_id: subjectId } }
    );
    return res.data;
  },

  getTopicDistribution: async (
    subjectId: string
  ): Promise<TopicDistributionItem[]> => {
    const res = await axiosInstance.get<TopicDistributionItem[]>(
      "/analytics/topic-distribution",
      { params: { subject_id: subjectId } }
    );
    return res.data;
  },

  getUnitDistribution: async (
    subjectId: string
  ): Promise<UnitDistributionItem[]> => {
    const res = await axiosInstance.get<UnitDistributionItem[]>(
      "/analytics/unit-distribution",
      { params: { subject_id: subjectId } }
    );
    return res.data;
  },

  getDifficultyDistribution: async (
    subjectId: string
  ): Promise<DifficultyDistributionItem[]> => {
    const res = await axiosInstance.get<DifficultyDistributionItem[]>(
      "/analytics/difficulty-distribution",
      { params: { subject_id: subjectId } }
    );
    return res.data;
  },

  getRepeatedQuestions: async (
    subjectId: string
  ): Promise<RepeatedQuestion[]> => {
    const res = await axiosInstance.get<RepeatedQuestion[]>(
      "/analytics/repeated-questions",
      { params: { subject_id: subjectId } }
    );
    return res.data;
  },

  getSummary: async (
    subjectId?: string
  ): Promise<AnalyticsSummary> => {
    const res = await axiosInstance.get<AnalyticsSummary>(
      "/analytics/summary",
      {
        params: subjectId
          ? { subject_id: subjectId }
          : undefined,
      }
    );
    return res.data;
  },
};

// ===============================
// ASK AI
// ===============================
export const ask = {
  sendQuestion: async (data: { question: string; subject_id: string; session_id?: string }): Promise<AskResponse> => {
    const res = await axiosInstance.post<AskResponse>(
      "/ask",
      data
    );
    return res.data;
  },

  getSessions: async (): Promise<ChatSession[]> => {
    const res = await axiosInstance.get<ChatSession[]>(
      "/ask/sessions"
    );
    return res.data;
  },

  getSession: async (
    sessionId: string
  ): Promise<ChatSession> => {
    const res = await axiosInstance.get<ChatSession>(
      `/ask/sessions/${sessionId}`
    );
    return res.data;
  },

  deleteSession: async (
    sessionId: string
  ): Promise<void> => {
    await axiosInstance.delete(`/ask/sessions/${sessionId}`);
  },
};
