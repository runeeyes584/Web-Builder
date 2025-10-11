# Web-Builder

🚀 **Hệ thống xây dựng website trực tuyến với drag-and-drop interface**

Ứng dụng web builder cho phép người dùng tạo ra các website một cách trực quan thông qua giao diện kéo thả, không cần kiến thức lập trình.

## 🏗️ Kiến trúc hệ thống

```
Web-Builder/
├── client/          # Frontend - Next.js + React
├── server/          # Backend - Node.js + Express + TypeScript
└── docs/           # Documentation (coming soon)
```

### Frontend (Client)
- **Framework**: Next.js 14 với TypeScript
- **UI Library**: Radix UI + Tailwind CSS
- **Tính năng**: Drag-and-drop builder, component library, theme management
- **Port**: `3000` (development)

### Backend (Server)  
- **Framework**: Express.js với TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Tính năng**: User management, project storage, API endpoints
- **Port**: `4000` (development)

## 🚀 Quick Start

### Yêu cầu hệ thống
- Node.js 18+
- PostgreSQL 13+
- npm hoặc pnpm

### 1. Clone repository
```bash
git clone https://github.com/hungson1002/Web-Builder.git
cd Web-Builder
```

### 2. Setup Backend
```bash
cd server
npm install
copy .env.example .env
# Chỉnh sửa DATABASE_URL trong .env
npx prisma migrate dev --name init
npm run dev
```

### 3. Setup Frontend  
```bash
cd ../client
npm install  # hoặc pnpm install
npm run dev
```

### 4. Truy cập ứng dụng
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Health**: http://localhost:4000/health

## 📁 Cấu trúc dự án

### Client (Frontend)
```
client/
├── app/                 # Next.js 13+ App Router
├── components/          
│   ├── builder/        # Web builder components
│   └── ui/            # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utilities và types
└── public/             # Static assets
```

### Server (Backend)
```
server/
├── src/
│   ├── controllers/    # Request handlers
│   ├── services/       # Business logic
│   ├── middleware/     # Express middleware
│   ├── routes/         # API routes
│   └── lib/           # Database & utilities
├── prisma/            # Database schema
└── docs/              # API documentation
```

## 🛠️ Development

### Available Scripts

**Backend (server/)**
- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run lint` - Run ESLint
- `npm run format` - Format code với Prettier

**Frontend (client/)**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run Next.js linting

### Database Management
```bash
# Xem database trong browser
npx prisma studio

# Reset database
npx prisma migrate reset

# Deploy migrations
npx prisma migrate deploy
```

## 📖 API Documentation

Backend cung cấp REST API cho:
- 👤 User management
- 📁 Project management  
- 🎨 Component templates
- 💾 Export/Import projects

Chi tiết API: [server/API.md](./server/API.md)

## 🎯 Tính năng chính

### ✅ Đã hoàn thành
- [x] Project setup (FE + BE)
- [x] Database schema (User, Project)
- [x] Basic API endpoints
- [x] Development environment
- [x] Error handling & logging

### 🚧 Đang phát triển
- [ ] Authentication & Authorization
- [ ] Drag-and-drop builder interface
- [ ] Component library system
- [ ] Project templates
- [ ] Export to HTML/CSS

### 📋 Roadmap
- [ ] Real-time collaboration
- [ ] Plugin system
- [ ] Asset management
- [ ] SEO optimization tools
- [ ] Mobile responsive builder

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Tuân thủ ESLint và Prettier config
- Viết tests cho features mới
- Update documentation khi cần
- Follow conventional commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Team

- **Developer**: Nguyễn Hùng Sơn, Lê Anh Tiến, Dương Phúc Khang 
- **GitHub**: 
    **Hùng Sơn**: https://github.com/hungson1002
    **Anh Tiến**: https://github.com/runeeyes584
    **Phúc Khang**: https://github.com/Flower-unfurl

## 🐛 Bug Reports & Feature Requests

Sử dụng [GitHub Issues](https://github.com/hungson1002/Web-Builder/issues) để:
- Báo cáo bugs
- Đề xuất features mới
- Thảo luận về cải tiến

## 📞 Support

Nếu bạn có câu hỏi hoặc cần hỗ trợ:
- 📧 Email: [anhtienle428@gmail.com]
- 💬 GitHub Discussions
- 📋 GitHub Issues

---

⭐ **Nếu project này hữu ích, đừng quên star repo nhé!** ⭐
