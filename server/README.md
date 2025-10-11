# Web-Builder - Backend


## Quick Start

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Setup môi trường

```bash
# Copy file env template
copy .env.example .env

# Chỉnh sửa .env file với database URL thực tế của bạn
# DATABASE_URL="postgresql://username:password@localhost:5432/web_builder_dev"
```

### 3. Setup database (cần PostgreSQL)

```bash
# Tạo database migration
npx prisma migrate dev --name init

# Generate Prisma client (đã chạy rồi)
npx prisma generate
```

### 4. Chạy development server

```bash
npm run dev
```

Server sẽ chạy tại: http://localhost:4000

## API Endpoints

- `GET /` - Root endpoint (health check)
- `GET /health` - Health check with uptime
- `GET /api/example` - Example GET endpoint
- `POST /api/example` - Example POST endpoint (requires `name` in body)

## Available Scripts

- `npm run dev` - Start development server với hot reload
- `npm run build` - Build TypeScript thành JavaScript
- `npm run start` - Chạy production server từ dist/
- `npm run lint` - Check code với ESLint
- `npm run lint:fix` - Fix lint issues tự động
- `npm run format` - Format code với Prettier
- `npm run type-check` - Check TypeScript types

## Project Structure

```
src/
├── controllers/     # Request handlers
├── services/        # Business logic
├── middleware/      # Express middleware
├── routes/          # Route definitions
└── lib/            # Utilities (database, etc.)

prisma/
└── schema.prisma   # Database schema
```

## Database

Dự án sử dụng PostgreSQL với Prisma ORM:

- **User**: Người dùng hệ thống
- **Project**: Các dự án web builder

### Prisma Commands

```bash
# Xem database trong Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset

# Deploy migrations
npx prisma migrate deploy
```

## Development Notes

- Server sử dụng `ts-node-dev` để hot reload
- Error handling được setup sẵn với middleware
- ESLint + Prettier để maintain code quality
- Database schema có sẵn User và Project models

## Todo cho dev team
