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

### SOL-005: Khắc phục xung đột quyền Git Credential Manager
- **Mã lỗi liên quan**: ERR-005
- **Phương án xử lý**:
  - Máy tính Windows đang lưu session xác thực của `namHorus123`. Để push lên repository của `shaikowannasleep`:
    - **Cách 1 (Sử dụng GitHub Personal Access Token - PAT)**:
      Chạy lệnh gán trực tiếp URL kèm tài khoản:
      `git remote set-url origin https://shaikowannasleep:<PAT_TOKEN>@github.com/shaikowannasleep/MyDiscordBot.git`
      Sau đó thực hiện `git push origin main` và `git push origin tasks-internal`.
    - **Cách 2 (Thêm collaborator trên GitHub)**:
      Vào repository `MyDiscordBot` trên GitHub > Settings > Collaborators > Invite `namHorus123`. Khi đó token hiện có trên máy sẽ push được ngay lập tức.
    - **Cách 3 (Xóa cache credential Windows)**:
      Vào Windows Credential Manager > Windows Credentials > Tìm mục `git:https://github.com` và Remove, sau đó khi chạy `git push` trình duyệt sẽ bật lên đăng nhập tài khoản `shaikowannasleep`.
- **Trạng thái**: Đã hướng dẫn chi tiết các phương án.

---

### [SOL-006] Cơ chế thông báo "Hỏi đểu sau 2 phút" cho sự kiện Săn Boss
- **Vấn đề**: Người dùng muốn có một thông báo phụ sau 2 phút kể từ lần báo đầu tiên (chỉ phát 1 lần duy nhất) đối với các sự kiện/hẹn giờ có chứa text `"săn boss"`:
  > "😏 M đã đi săn boss chưa đấy cu? anh tau là anh đình dũng đẹp trai nói vô sau còn đúng cái nịt thôi, cầm vương thu nhi vào khạc mau còn kịp !!"
- **Giải pháp kỹ thuật**:
  - Tại `EventScheduler.ts` và `AlarmScheduler.ts`, sau khi kích hoạt alert ban đầu, hệ thống kiểm tra `name`/`title`/`customMessage` xem có chứa `săn boss` hoặc `san boss` (không phân biệt hoa thường).
  - Nếu khớp, lên lịch một timer 2 phút (`setTimeout(..., 120_000)`).
  - Thêm cờ `singleAlert: true` trong `AlertPayload` và `DiscordNotifier.ts` để thông báo hỏi đểu này chỉ phát đúng 1 lần (không lặp lại chuỗi 3 ping dồn dập như alert ban đầu).
- **Trạng thái**: Đã triển khai và hoạt động tốt trên cả Recurring Events và Boss Timers.

---

### [SOL-007] Hỗ trợ định dạng thời gian phức hợp (`9p30s`, `1d23h5p3s`) và lệnh gõ tắt trực tiếp
- **Vấn đề**: Người dùng muốn nhập thời gian dạng ghép đa đơn vị như `9p30s` (9 phút 30 giây) hoặc `1d23h5p3s` (1 ngày 23 tiếng 5 phút 3 giây), hỗ trợ cả tiếng Việt (`1 ngày 2 tiếng 30 phút`).
- **Giải pháp kỹ thuật**:
  - Viết lại `TimeParser.parseDuration`:
    - Chuẩn hóa text loại bỏ dấu tiếng Việt (`normalize('NFD')`).
    - Quét các cặp token `(\d+)\s*([a-zA-Z]+)`.
    - Hỗ trợ đầy đủ bộ đơn vị:
      - Ngày: `d`, `day`, `days`, `ngay`, `ng` (86400s).
      - Giờ: `h`, `hr`, `hrs`, `hour`, `hours`, `gio`, `tieng`, `g` (3600s).
      - Phút: `m`, `min`, `mins`, `minute`, `minutes`, `p`, `ph`, `phut` (60s).
      - Giây: `s`, `sec`, `secs`, `second`, `seconds`, `giay` (1s).
    - Tạo thuộc tính `formattedVi` hiển thị tiếng Việt tự nhiên (VD: `1 ngày 23 tiếng 5 phút 3 giây`).
  - Trong `DiscordClient.ts`: Hỗ trợ gõ tắt trực tiếp `.9p30s [tên]` hoặc `!1d23h5p3s [tên]` mà không cần gõ chữ `set`.
- **Trạng thái**: Đã hoàn thành, 7/7 unit tests passed 100%.

---
*(Sẽ tiếp tục cập nhật các giải pháp kỹ thuật trong quá trình thực thi)*

