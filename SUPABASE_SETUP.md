# Настройка Supabase для TraderCamp

## 🔧 Инструкция для разработчика

### 1. Получите данные из Supabase Dashboard

1. Зайдите в [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в **Settings → API**
4. Скопируйте:
   - **Project URL** (например: `https://abcdefgh.supabase.co`)
   - **anon public key** (длинная строка начинающаяся с `eyJ...`)

### 2. Конфигурация уже настроена ✅

Конфигурация Supabase уже настроена в `App.js`:

```javascript
const SUPABASE_CONFIG = {
  url: 'https://ncfiwejrpozzbftkkdjx.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jZml3ZWpycG96emJmdGtrZGp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMzU3MjYsImV4cCI6MjA3MTcxMTcyNn0.IQ_w-WhlK9wy3GkYmTJ7bvN6HsamVkYT6aQWlyWA5sw',
  bucket: 'public'
};
```

**Готово!** Никаких дополнительных настроек не требуется.

### 3. Выполните SQL схему

В Supabase Dashboard → SQL Editor выполните код из файла `supabase_schema.sql`

### 4. Проверьте подключение

После настройки:
- ✅ Приложение покажет "База данных подключена" в профиле
- ✅ Регистрация/вход будут работать
- ✅ Все данные будут сохраняться в Supabase

## 🔒 Безопасность

- **anon public key** безопасен для использования в клиентском коде
- Row Level Security (RLS) защищает данные пользователей
- Каждый пользователь видит только свои данные

## 📊 Структура базы данных

- `posts` - сообщения сообщества
- `workouts` - тренировки
- `events` - события
- `trades` - торговые сделки
- `finance_profiles` - финансовые профили
- `finance_debts` - долги
- `finance_emergency_tx` - транзакции подушки безопасности
- `finance_invest_tx` - инвестиционные транзакции

## 🚀 Готово!

После выполнения всех шагов приложение будет полностью готово к работе с облачной базой данных.
