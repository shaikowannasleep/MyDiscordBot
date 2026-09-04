# Discord Game Alarm Bot — Task Error Encounter

Nhật ký ghi nhận toàn bộ các lỗi, cảnh báo kỹ thuật, rủi ro tương thích và xung đột phát sinh trong quá trình phát triển hệ thống Discord Game Alarm Bot.

---

## 📋 DANH MỤC LỖI GẶP PHẢI

*(Các lỗi phát sinh trong quá trình build, run, test và cài đặt thư viện sẽ được cập nhật chi tiết tại đây theo cấu trúc: Mã lỗi / Thời điểm / Mô tả / Mức độ ảnh hưởng)*

### ERR-001: Git Credential & Repository Visibility
- **Thời điểm**: 04/09/2026
- **Mô tả**: Yêu cầu đẩy các file tài liệu Task MD nhưng không muốn người ngoài xem được, hoặc đẩy vào branch riêng trên GitHub `shaikowannasleep/MyDiscordBot`.
- **Nguyên nhân gốc rễ**: GitHub áp dụng quyền xem (Public/Private) trên toàn bộ Repository, không hỗ trợ branch-level permission trên repo public.
- **Tham chiếu giải pháp**: Xem chi tiết xử lý tại `TASK_FIX_SOLUTION.md` mục SOL-001.

### ERR-002: Dependency Version Not Found (@discordjs/voice)
- **Thời điểm**: 04/09/2026
- **Mô tả**: Khi chạy `npm install`, lỗi `npm error notarget No matching version found for @discordjs/voice@^0.17.1`.
- **Nguyên nhân gốc rễ**: Phiên bản `@discordjs/voice` trên npm registry đã release lên `0.19.2`, bản `0.17.1` không tồn tại trong dải semver tương thích.
- **Tham chiếu giải pháp**: Xem chi tiết xử lý tại `TASK_FIX_SOLUTION.md` mục SOL-002.

### ERR-003: Native Compilation Issue với better-sqlite3 trên Node v24 (ABI 137)
- **Thời điểm**: 04/09/2026
- **Mô tả**: `better-sqlite3` yêu cầu biên dịch C++ native addon thông qua `node-gyp` trên Windows khi chạy trên Node v24 do chưa có prebuilt binary sẵn.
- **Nguyên nhân gốc rễ**: Node v24 có ABI 137 rất mới, các native addon chưa có binary build sẵn trên npm.
- **Tham chiếu giải pháp**: Xem chi tiết xử lý tại `TASK_FIX_SOLUTION.md` mục SOL-003.

### ERR-004: Type 'number' is not assignable to type 'WeekdayNumbers' in Luxon
- **Thời điểm**: 04/09/2026
- **Mô tả**: Khi chạy `npm run typecheck`, trình biên dịch báo lỗi `error TS2322: Type 'number' is not assignable to type 'WeekdayNumbers | undefined'` tại `DateUtils.ts(45,32)`.
- **Nguyên nhân gốc rễ**: Kiểu dữ liệu `weekday` của Luxon là union type nghiêm ngặt `1 | 2 | 3 | 4 | 5 | 6 | 7` (`WeekdayNumbers`), không chấp nhận kiểu `number` thuần túy.
- **Tham chiếu giải pháp**: Xem chi tiết xử lý tại `TASK_FIX_SOLUTION.md` mục SOL-004.

### ERR-005: Git Push HTTP 403 (Windows Credential Manager Conflict)
- **Thời điểm**: 04/09/2026
- **Mô tả**: Khi thực hiện `git push origin main`, GitHub trả về lỗi: `remote: Permission to shaikowannasleep/MyDiscordBot.git denied to namHorus123. fatal: unable to access ... 403`.
- **Nguyên nhân gốc rễ**: Windows Credential Manager đang lưu token/credential đăng nhập mặc định của tài khoản `namHorus123` thay vì `shaikowannasleep`.
- **Tham chiếu giải pháp**: Xem chi tiết xử lý tại `TASK_FIX_SOLUTION.md` mục SOL-005.

---
*(Sẽ tiếp tục bổ sung các lỗi thực tế trong quá trình implement)*
