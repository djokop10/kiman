import { app } from "./app";
import { config } from "./config";
import { queueService } from "./services/queue.service";

const PORT = config.port;

app.listen(PORT, () => {
  console.log("==================================================");
  console.log(`🐦 KICAU MANIA REST API RUNNING ON PORT: ${PORT}`);
  console.log(`📡 URL API: http://localhost:${PORT}/api`);
  console.log(`📁 Uploads Storage: ${config.storageDir}`);
  console.log("==================================================");

  // Mulai background worker queue Google Sheets
  setInterval(() => {
    queueService.processQueue().catch((err) => {
      console.error("[QueueWorker] Background processing error:", err);
    });
  }, 10000); // Cek antrean setiap 10 detik
});
