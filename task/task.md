# Discord Game Alarm Bot — Task Management

## 📌 THÔNG TIN DỰ ÁN
- **Dự án**: Discord Game Alarm Bot (Game Schedule Assistant)
- **Version**: V1.0
- **Reference UX**: Hoyo Buddy (`hb.seria.moe`)
- **Ngôn ngữ & Nền tảng**: Node.js, TypeScript (Strict Mode), discord.js v14, SQLite, Docker
- **Repository**: `https://github.com/shaikowannasleep/MyDiscordBot`
- **GitHub User**: `shaikowannasleep`

---

## 🎯 TIẾN ĐỘ THỰC HIỆN CÁC GIAI ĐOẠN

### Phase 1 — Nền tảng & Cấu hình (Foundation)
- [x] Kết nối Git local với remote `shaikowannasleep/MyDiscordBot`, cấu hình user `shaikowannasleep`.
- [x] Tạo bộ tài liệu quản lý công việc: `task/task.md`, `task/TASK_ERROR_ENCOUNTER.md`, `task/TASK_FIX_SOLUTION.md`.
- [x] Thiết lập file nguyên tắc `AGENTS.md` theo đặc tả mục 34.
- [x] Tạo `package.json`, `tsconfig.json`, `.gitignore`, `.env.example`.
- [x] Cài đặt các dependencies cần thiết (discord.js, @discordjs/voice, node:sqlite, luxon, ...).
- [x] Tạo cấu trúc thư mục source code (`src/bot`, `src/commands`, `src/interactions`, `src/domain`, `src/scheduler`, `src/notification`, `src/voice`, `src/database`, `src/utils`).

### Phase 2 — Database & Xử lý thời gian (Timezone & Persistence)
- [x] Xây dựng Database schema (`users`, `alarms`, `events`, `voice_sessions`).
- [x] Hiện thực `TimeParser.ts` (xử lý `20s`, `20m`, `1h`, `2h30m`).
- [x] Hiện thực `DateUtils.ts` (múi giờ mặc định `Asia/Ho_Chi_Minh`, xử lý `09:00` hôm nay/ngày mai).
- [x] Hiện thực Database repository lưu trữ persistent.

### Phase 3 — Scheduler & Notification Engine
- [x] Xây dựng `AlarmScheduler.ts` và `EventScheduler.ts`.
- [x] Phục hồi (Restore) persistent alarms/events khi bot khởi động lại (không duplicate).
- [x] Xây dựng `NotificationService.ts`: Discord Channel, DM Notification, Voice notification.

### Phase 4 — Slash Commands & Hoyo Buddy UX Interactions
- [x] Hiện thực `CommandRegistry.ts` và `InteractionRouter.ts`.
- [x] Command `/alarm`: Dashboard tổng quan (Quick Timer, Schedule, Game, My Alarms, Settings).
- [x] Command `/set <duration>`: Đặt timer nhanh với embed và format chuẩn.
- [x] Command `/sethour <time>`: Đặt alarm theo giờ cụ thể.
- [x] Command `/event` & `/event create`: Modal tạo sự kiện lặp lại (Daily, Weekly) kèm chọn phương thức thông báo (DM / Discord).
- [x] Command `/boss <duration> [name]`: Boss respawn timer kèm giao diện đếm ngược.
- [x] Command `/list`: Hiển thị danh sách báo thức có phân trang (Pagination) và nút tương tác Delete/Edit.
- [x] Command `/cancel <id>` & `/cancelall`: Hủy báo thức có popup xác nhận.

### Phase 5 — Voice Mode & Session Management
- [x] Command `/alarm join`: Kiểm tra user trong voice channel và kết nối bot vào voice.
- [x] Command `/exit`: Ngắt kết nối voice, tự động dọn dẹp các temporary alarms thuộc session, giữ nguyên persistent events.
- [x] `VoiceManager.ts`: Quản lý kết nối voice và phát âm báo/TTS.

### Phase 6 — Testing, Docker, CI & Chiến lược Git
- [x] Viết unit tests cho TimeParser và Scheduler (7/7 tests passed).
- [x] Kiểm tra TypeScript compile (`npm run build` passed 100%).
- [x] Tạo `Dockerfile` và `docker-compose.yml`.
- [x] Tạo GitHub Actions workflow (`.github/workflows/ci.yml`).
- [/] Thiết lập branch bảo mật tài liệu (`tasks-internal`) và commit lên `main`.
