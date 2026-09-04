# Discord Game Alarm Bot — Task Fix Solution

Tài liệu đặc tả các giải pháp kỹ thuật, biện pháp khắc phục và tối ưu hóa cho các vấn đề được ghi nhận tại `TASK_ERROR_ENCOUNTER.md`.

---

## 🛠️ CHI TIẾT GIẢI PHÁP KỸ THUẬT

### SOL-001: Chiến lược bảo mật tài liệu và phân nhánh Git
- **Mã lỗi liên quan**: ERR-001
- **Phương án xử lý**:
  1. **Tách nhánh `tasks-internal` độc lập (Orphan branch)**:
     - Nhánh `main` là nhánh mặc định của repository, chỉ chứa mã nguồn bot sạch (`src/`, `package.json`, `README.md`, `Dockerfile`...).
     - Toàn bộ thư mục `task/` và các tài liệu nội bộ sẽ được commit và quản lý trên nhánh `tasks-internal` (hoặc cấu hình git submodule / repo private).
     - Người truy cập GitHub thông thường chỉ thấy nhánh `main`.
  2. **Khuyến nghị kết hợp**: Nếu bot là dự án cá nhân, người dùng có thể đổi cài đặt repository sang `Private` trên GitHub Settings để đảm bảo 100% bảo mật cho mọi branch.
- **Trạng thái**: Đã sẵn sàng triển khai.

### SOL-002: Cập nhật dependency version tương thích trên NPM
- **Mã lỗi liên quan**: ERR-002
- **Phương án xử lý**:
  - Tra cứu version chính thức hiện hành bằng `npm view @discordjs/voice version` -> bản `0.19.2`.
  - Cập nhật `@discordjs/voice` lên `^0.19.2` và `discord.js` lên `^14.27.0` trong `package.json`.
- **Trạng thái**: Đã giải quyết.

### SOL-003: Sử dụng module chuẩn built-in `node:sqlite` của Node.js v24
- **Mã lỗi liên quan**: ERR-003
- **Phương án xử lý**:
  - Node.js từ v22.5.0+ và v24 đã tích hợp sẵn engine SQLite chuẩn C/C++ cao cấp (`node:sqlite` với `DatabaseSync`).
  - Chuyển toàn bộ database layer sang `node:sqlite`:
    - Zero external native dependencies.
    - Không cần cài `node-gyp` hay Visual Studio C++ build tools.
    - Hiệu năng cực cao, đồng bộ và tương thích 100% trên cả Windows, Linux và Docker.
- **Trạng thái**: Đã giải quyết.

### SOL-004: Import và typecast chính xác `WeekdayNumbers` từ Luxon
- **Mã lỗi liên quan**: ERR-004
- **Phương án xử lý**:
  - Import `WeekdayNumbers` từ package `luxon`.
  - Typecast `dayOfWeek as WeekdayNumbers` trong hàm `getNextWeeklyTrigger` để thỏa mãn strict typing của TypeScript.
- **Trạng thái**: Đã giải quyết.

---
*(Sẽ tiếp tục cập nhật các giải pháp kỹ thuật trong quá trình thực thi)*
