# ⏰ Discord Game Alarm Bot

> **Version:** V1.0  
> **Reference UX:** Hoyo Buddy  
> **Architecture:** TypeScript + discord.js v14 + SQLite + Node Scheduler + Voice Gateway

---

## 🎮 Overview

Discord Game Alarm Bot là một **Game Schedule Assistant** chuyên nghiệp hỗ trợ nhắc giờ săn Boss, các sự kiện Game định kỳ hàng ngày / hàng tuần, và các mốc thời gian cá nhân thông qua **Discord Channel**, **Discord DM** và **Voice Channel**.

```text
                 Discord Game Assistant
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
      Alarm              Boss              Event
        │                 │                 │
     Timer              Spawn            Schedule
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                   Notification
                  ┌───────┼───────┐
                  │       │       │
                 DM    Discord   Voice
```

---

## ⚡ Tính năng nổi bật

- ⏱️ **Quick Timer**: `/set 20m`, `/set 1h`, `/set 2h30m` với giao diện đếm ngược trực quan.
- 🎯 **Specific Hour Alarm**: `/sethour 09:00` hỗ trợ múi giờ mặc định `Asia/Ho_Chi_Minh`.
- 🐉 **Boss Respawn Tracker**: `/boss 30m World Boss` hiển thị đếm ngược thời gian hồi sinh.
- 📅 **Recurring Events**: Tạo sự kiện lặp hàng ngày hoặc hàng tuần bằng Discord Modal thân thiện.
- 🔊 **Voice Mode**: Tham gia Voice Channel thông báo bằng âm thanh/giọng nói khi người dùng đang online trong phòng Voice.
- 🔄 **Persistent Storage**: Mọi sự kiện và lịch trình lặp lại được lưu trong SQLite và tự động phục hồi sau khi bot khởi động lại.
- 🛡️ **Session Lifecycle**: Lệnh `/exit` ngắt kết nối Voice, tự động hủy các timer tạm thời của phiên chơi nhưng vẫn bảo lưu các sự kiện định kỳ.

---

## 🚀 Quick Start

### 1. Cài đặt Dependencies

```bash
npm install
```

### 2. Cấu hình Biến môi trường

Sao chép file `.env.example` thành `.env`:

```env
DISCORD_TOKEN=your_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_optional
DATABASE_PATH=./data/alarm_bot.sqlite
DEFAULT_TIMEZONE=Asia/Ho_Chi_Minh
```

### 3. Build & Khởi chạy

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start
```

### 4. Docker Deployment

```bash
docker compose up -d --build
```
