const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("km_token") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  // If body is FormData, delete Content-Type so browser sets boundary
  if (options.body instanceof FormData) {
    delete (headers as any)["Content-Type"];
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Terjadi kesalahan pada permintaan API");
  }

  return data;
}

export const api = {
  // Auth
  requestOtp: (noHp: string) => fetchApi("/auth/otp/request", { method: "POST", body: JSON.stringify({ noHp }) }),
  verifyOtp: (noHp: string, code: string) => fetchApi("/auth/otp/verify", { method: "POST", body: JSON.stringify({ noHp, code }) }),
  loginAdmin: (email: string, password: string) => fetchApi("/auth/admin/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  getMe: () => fetchApi("/auth/me"),

  // Public
  getActiveEvents: () => fetchApi("/public/events/active"),
  submitPendaftaran: (payload: { nama: string; noHp: string; namaBurung?: string; eventId: string; kelasLombaId: string }) =>
    fetchApi("/public/pendaftaran", { method: "POST", body: JSON.stringify(payload) }),

  // Peserta
  getMyPendaftaran: () => fetchApi("/peserta/pendaftaran"),
  getPendaftaranDetail: (id: string) => fetchApi(`/peserta/pendaftaran/${id}`),
  uploadBuktiTransfer: (id: string, formData: FormData) =>
    fetchApi(`/peserta/pendaftaran/${id}/upload-bukti`, { method: "POST", body: formData }),
  getMyNotifikasi: () => fetchApi("/peserta/notifikasi"),

  // Admin
  getAdminPendaftaran: (params?: { eventId?: string; kelasLombaId?: string; status?: string; search?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.eventId) q.append("eventId", params.eventId);
    if (params?.kelasLombaId) q.append("kelasLombaId", params.kelasLombaId);
    if (params?.status) q.append("status", params.status);
    if (params?.search) q.append("search", params.search);
    if (params?.page) q.append("page", params.page.toString());
    return fetchApi(`/admin/pendaftaran?${q.toString()}`);
  },
  getAdminPendaftaranDetail: (id: string) => fetchApi(`/admin/pendaftaran/${id}`),
  seleksiPeserta: (id: string, status: "LOLOS" | "TIDAK_LOLOS", catatan?: string) =>
    fetchApi(`/admin/pendaftaran/${id}/seleksi`, { method: "POST", body: JSON.stringify({ status, catatan }) }),
  verifikasiPembayaran: (id: string, status: "APPROVE" | "REJECT", catatan?: string) =>
    fetchApi(`/admin/pendaftaran/${id}/verifikasi`, { method: "POST", body: JSON.stringify({ status, catatan }) }),
  getAdminStats: (eventId?: string) => fetchApi(`/admin/stats${eventId ? `?eventId=${eventId}` : ""}`),

  // Superadmin
  getEvents: () => fetchApi("/superadmin/events"),
  createEvent: (payload: any) => fetchApi("/superadmin/events", { method: "POST", body: JSON.stringify(payload) }),
  updateEvent: (id: string, payload: any) => fetchApi(`/superadmin/events/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteEvent: (id: string) => fetchApi(`/superadmin/events/${id}`, { method: "DELETE" }),

  getKelas: (eventId?: string) => fetchApi(`/superadmin/kelas${eventId ? `?eventId=${eventId}` : ""}`),
  createKelas: (payload: any) => fetchApi("/superadmin/kelas", { method: "POST", body: JSON.stringify(payload) }),
  updateKelas: (id: string, payload: any) => fetchApi(`/superadmin/kelas/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteKelas: (id: string) => fetchApi(`/superadmin/kelas/${id}`, { method: "DELETE" }),

  getAdmins: () => fetchApi("/superadmin/admins"),
  createAdmin: (payload: any) => fetchApi("/superadmin/admins", { method: "POST", body: JSON.stringify(payload) }),
  deleteAdmin: (id: string) => fetchApi(`/superadmin/admins/${id}`, { method: "DELETE" }),

  getLaporan: (eventId?: string) => fetchApi(`/superadmin/laporan${eventId ? `?eventId=${eventId}` : ""}`),
  getSyncStatus: () => fetchApi("/superadmin/sync-sheet/status"),
  triggerSyncAll: () => fetchApi("/superadmin/sync-sheet/trigger", { method: "POST" })
};
