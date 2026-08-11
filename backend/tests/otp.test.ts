import { OtpService, IOtpGateway } from "../src/services/otp.service";
import { prisma } from "../src/lib/prisma";

class MockGateway implements IOtpGateway {
  public lastPhone = "";
  public lastCode = "";
  async sendOtp(noHp: string, code: string): Promise<boolean> {
    this.lastPhone = noHp;
    this.lastCode = code;
    return true;
  }
}

describe("OTP Service Unit Tests", () => {
  let mockGateway: MockGateway;
  let otpService: OtpService;

  beforeAll(async () => {
    mockGateway = new MockGateway();
    otpService = new OtpService(mockGateway);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("harus menolak nomor HP tidak valid (kurang dari 9 digit)", async () => {
    await expect(otpService.requestOtp("0812")).rejects.toThrow("Nomor HP tidak valid");
  });

  it("harus berhasil meminta OTP dan mengirim kode 6 digit via gateway", async () => {
    const res = await otpService.requestOtp("0812-3456-7890");
    expect(res.success).toBe(true);
    expect(mockGateway.lastPhone).toBe("081234567890");
    expect(mockGateway.lastCode).toMatch(/^\d{6}$/);
  });

  it("harus berhasil memverifikasi kode OTP yang valid", async () => {
    const phone = "08987654321";
    await otpService.requestOtp(phone);
    const validCode = mockGateway.lastCode;

    const isValid = await otpService.verifyOtp(phone, validCode);
    expect(isValid).toBe(true);

    // Kode yang sudah digunakan tidak boleh dapat dipakai lagi
    const reuseAttempt = await otpService.verifyOtp(phone, validCode);
    expect(reuseAttempt).toBe(false);
  });

  it("harus gagal jika kode OTP salah", async () => {
    const phone = "08555444333";
    await otpService.requestOtp(phone);

    const isValid = await otpService.verifyOtp(phone, "999999");
    expect(isValid).toBe(false);
  });
});
