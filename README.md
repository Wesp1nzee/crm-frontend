# CRM Система для Экспертной Организации

Внутренняя CRM-система для управления судебными и внесудебными экспертизами.

## Технологический стек

- **Frontend**: React 18+, TypeScript (strict mode), Vite
- **UI**: Material UI (MUI)
- **State Management**: @tanstack/react-query
- **HTTP Client**: axios
- **Forms**: react-hook-form + zod
- **Mock API**: MSW (Mock Service Worker)
- **Routing**: react-router-dom

## Установка и запуск

### 1. Установка зависимостей
```bash
npm install
```

### 2. Запуск в режиме разработки

**С mock API (рекомендуется для разработки):**
```bash
npm run dev:mock
# или
VITE_MOCK=true npm run dev
```

**С реальным backend:**
```bash
npm run dev
```

### 3. Сборка для продакшена
```bash
npm run build
```

### 4. Предварительный просмотр сборки
```bash
npm run preview
```

## Конфигурация

### Переменные окружения (.env)

```env
# URL backend API
VITE_API_URL=http://localhost:8000/api

# Включение mock API (true/false)
VITE_MOCK=true
```

### Изменение baseURL для API

Отредактируйте файл `src/shared/api/axios.ts`:

```typescript
const baseURL = import.meta.env.VITE_API_URL || 'http://your-backend-url/api';
```

## Структура проекта

```
src/
├── main.tsx                    # Точка входа
├── app/                        # Конфигурация приложения
│   ├── App.tsx                 # Главный компонент
│   ├── router.tsx              # Настройка роутинга
│   └── providers.tsx           # Провайдеры (React Query, MUI Theme)
├── layout/                     # Компоненты макета
│   ├── Layout.tsx              # Основной макет
│   ├── Sidebar.tsx             # Боковая панель навигации
│   └── Topbar.tsx              # Верхняя панель
├── pages/                      # Страницы приложения
│   ├── cases/                  # Страницы дел
│   │   ├── CaseListPage.tsx    # Список дел
│   │   └── CaseDetailPage.tsx  # Детали дела
│   ├── clients/ClientListPage.tsx
│   ├── tasks/TasksPage.tsx
│   ├── documents/DocumentsPage.tsx
│   ├── finance/FinancePage.tsx
│   └── reports/ReportsPage.tsx
├── entities/                   # Бизнес-сущности
│   └── case/
│       ├── types.ts            # TypeScript типы
│       └── api.ts              # API функции
├── shared/                     # Общие компоненты и утилиты
│   ├── api/axios.ts            # Настройка HTTP клиента
│   ├── hooks/useCases.ts       # React Query хуки
│   ├── ui/                     # UI компоненты
│   └── forms/                  # Компоненты форм
├── mocks/                      # Mock API
│   ├── browser.ts              # Настройка MSW
│   └── handlers.ts             # Обработчики запросов
└── styles/theme.ts             # Тема Material UI
```

## Функциональность

### Реализованные страницы

1. **Дела** (`/cases`)
   - Список всех дел с фильтрацией
   - Подсветка просроченных дедлайнов
   - Переход к детальной странице дела

2. **Детали дела** (`/cases/:id`)
   - Просмотр информации о деле
   - Редактирование статуса дела
   - Отображение сроков и стоимости

3. **Остальные страницы** (заглушки)
   - Клиенты, Задачи, Документы, Финансы, Отчеты

### API Контракт

```typescript
// Основные эндпоинты
GET    /api/cases           # Список дел
GET    /api/cases/:id       # Детали дела
PUT    /api/cases/:id       # Обновление дела
GET    /api/clients         # Список клиентов
```

### Типы данных

```typescript
interface Case {
  id: string;
  caseNumber: string;
  authority: string;
  clientId: string;
  caseType: string;
  objectType: string;
  objectAddress: string;
  status: 'new' | 'accepted' | 'awaiting_documents' | 'inspection' | 'in_progress' | 'on_check' | 'done' | 'closed';
  assignedExpertId?: string;
  startDate: string;
  deadline: string;
  cost: number;
  createdAt: string;
}
```

## Разработка

### Скрипты

```bash
npm run dev          # Запуск с реальным API
npm run dev:mock     # Запуск с mock API
npm run build        # Сборка для продакшена
npm run preview      # Предварительный просмотр
npm run lint         # Проверка кода ESLint
npm run format       # Форматирование Prettier
npm run test         # Запуск тестов
```

### Mock API

Mock API автоматически включается при `VITE_MOCK=true`. Содержит:
- 2 тестовых дела с разными статусами
- 2 клиента
- Полная имитация CRUD операций

### Добавление новых страниц

1. Создайте компонент в `src/pages/`
2. Добавьте маршрут в `src/app/router.tsx`
3. При необходимости добавьте пункт в `src/layout/Sidebar.tsx`

## Следующие шаги

- [ ] Реализация остальных страниц
- [ ] Добавление фильтров и поиска
- [ ] Компонент загрузки файлов
- [ ] Система уведомлений
- [ ] Тесты компонентов
- [ ] Оптимизация производительности