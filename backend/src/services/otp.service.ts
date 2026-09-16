import { prisma } from "../lib/prisma";

export interface IOtpGateway {
  sendOtp(noHp: string, code: string): Promise<boolean>;
}

// Implementasi Mock/Console Gateway (Mudah diganti ke Provider WhatsApp seperti Wablas/Fonnte/Twilio)
export class ConsoleOtpGateway implements IOtpGateway {
  async sendOtp(noHp: string, code: string): Promise<boolean> {
    console.log("==================================================");
    console.log(`📱 [SIMULASI SMS/WA GATEWAY] Kirim OTP ke: ${noHp}`);
    console.log(`🔑 KODE OTP: ${code} (Berlaku 5 Menit)`);
    console.log("==================================================");
    return true;
  }
}

export class OtpService {
  private gateway: IOtpGateway;

  constructor(gateway?: IOtpGateway) {
    this.gateway = gateway || new ConsoleOtpGateway();
  }

  // Generate 6 digit random number
  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async requestOtp(noHp: string): Promise<{ success: boolean; message: string; code?: string }> {
    // Normalisasi No HP (contoh 08123... -> 08123...)
    const cleanNoHp = noHp.trim().replace(/\D/g, "");
    if (!cleanNoHp || cleanNoHp.length < 9) {
      throw new Error("Nomor HP tidak valid");
    }

    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 menit

    // Simpan ke DB
    await prisma.otpCode.create({
      data: {
        noHp: cleanNoHp,
        code,
        expiresAt,
        used: false
      }
    });

    // Kirim via gateway
    await this.gateway.sendOtp(cleanNoHp, code);

    return {
      success: true,
      message: `Kode OTP berhasil dikirim ke nomor ${cleanNoHp}`,
      code: process.env.NODE_ENV !== "production" ? code : undefined
    };
  }

  async verifyOtp(noHp: string, code: string): Promise<boolean> {
    const cleanNoHp = noHp.trim().replace(/\D/g, "");
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        noHp: cleanNoHp,
        code: code.trim(),
        used: false,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    if (!otpRecord) {
      return false;
    }

    // Tandai OTP telah digunakan
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true }
    });

    return true;
  }
}

export const otpService = new OtpService();
