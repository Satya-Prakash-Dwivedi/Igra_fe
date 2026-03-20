# Igra Studios — Admin Panel Frontend Developer Agent Prompt

---

## Purpose

This document defines **strict development instructions** for an AI Frontend Developer Agent to build the **Igra Studios Admin Panel Frontend** using **React + TypeScript** with enterprise-level architecture, scalability, and maintainability.

The agent must follow the steps in order and must not skip architecture or foundational setup steps.

---

# Project Context

You are building the **Admin Panel Frontend** for a video editing agency platform where company admins manage:

- Orders
- Users
- Editors
- Assets
- Messages
- Channels
- Invoices
- Support Tickets
- Analytics
- Platform Settings

This is a **high-scale production dashboard**, not a demo project.

---

# Core Technology Stack (MANDATORY)

### Framework
- React.js Latest Stable

### Language
- TypeScript (Strict Mode ON)

### Styling
- Tailwind CSS
- Dark Theme Only

### State Management
- React Query → Server State
- Zustand → Global Client State

### Forms
- React Hook Form
- Zod Validation

### Animation
- Framer Motion (Light Usage Only)

---

# Design Theme Tokens

```css
--bg-primary: #000000
--surface-primary: #0b0b0b
--text-primary: #ffffff
--text-muted: #bdbdbd
--accent-primary: #e63946
--accent-hover: #b22222
```

Absolute Code Quality Rules

The Agent MUST:

Use TypeScript strict typing everywhere

Never use any

Use reusable components only

Keep components under ~200 lines

Use feature-based architecture

Use service layer for API calls

Use custom hooks for logic reuse

Implement loading + error states everywhere

Folder Architecture (MANDATORY)
```
src/
  app/
  features/
    orders/
    users/
    editors/
    assets/
    messages/
    analytics/
    invoices/
    support/
  components/
  hooks/
  services/
  store/
  types/
  utils/
```

Step-by-Step Execution Plan (CRITICAL)

The agent must complete each phase fully before moving forward.

PHASE 1 — Project Initialization
Tasks

Create Next.js TypeScript project

Configure Tailwind

Setup ESLint + Prettier

Enable Strict TypeScript

Setup Absolute Imports

Setup Environment Config

Deliverables

Working base app

Dark theme base layout

Sidebar + Topbar base layout

PHASE 2 — Core Architecture Setup
Tasks

Create:

API Service Layer

Global State Store (Zustand)

React Query Provider Setup

Layout System

Auth Guard Components

Permission Guard Components

Deliverables

Clean architecture foundation

Global Providers configured

PHASE 3 — Shared Component Library

Build reusable components:

DataTable

StatusBadge

PageHeader

Card

Modal

Drawer

Tabs

FileUploader

SkeletonLoader

EmptyState

Toast System

PHASE 4 — Feature Modules (Build In Order)
Orders Module

Must Include:

Orders Table

Filters

Order Detail Page

Asset Viewer

Editor Assignment UI

Status Update UI

Order Timeline

Users Module

Must Include:

Users Table

User Detail Page

Channel View

Order History View

Invoice History View

Editors Module

Must Include:

Editor List

Editor Detail Page

Workload Visualization

Service Assignment UI

Assets Module

Must Include:

Asset Browser

Bulk Download UI

Email Asset Delivery UI

Messages Module

Must Include:

Chat Layout

Thread List

Message Panel

Attachment Support

Invoices Module

Must Include:

Invoice Table

Invoice Detail Modal

Export Controls

Support Module

Must Include:

Ticket Queue

Ticket Chat View

Status Controls

Analytics Module

Must Include:

KPI Cards

Chart Components

Date Filters

PHASE 5 — Performance Optimization

Implement:

Code Splitting

Lazy Routes

Memoized Components

Virtual Tables

Query Caching

PHASE 6 — Accessibility

Implement:

Keyboard Navigation

ARIA Labels

Focus States

Color Contrast Compliance

API Integration Rules

The agent must:

Use service files only

Never call API directly in components

Use React Query hooks

Example:

/services/orders.service.ts
/hooks/useOrders.ts

State Management Rules

Use:

React Query → Server Data

Zustand → UI State

Never mix responsibilities.

Error Handling Rules

Every API call must include:

Loading UI

Error UI

Retry Option

Mock Data Fallback

If backend is unavailable:

Create mock services

Simulate network delay

Maintain real API shape

Testing Requirements

Minimum:

Component Unit Tests

Hook Tests

One Integration Test per Module

Performance Targets

First Load < 2.5s

Table Render < 200ms

Page Navigation Instant (Prefetch)

Security UI Requirements

Must Include:

Auth Guards

Permission Guards

Safe Rendering of User Content

Do NOT Do

The agent must NOT:

Write giant monolithic components

Skip type definitions

Skip loading states

Mix UI + API logic

Hardcode API calls

Use inline business logic

Final Deliverables

The agent must output:

Folder Structure

Core Architecture Setup Code

Shared Components

Feature Modules Code

Mock Service Layer

Setup Instructions

Final Instruction

Build this as an enterprise SaaS admin dashboard used by a company handling thousands of monthly orders.
Prioritize scalability, maintainability, performance, and clean architecture over speed of development.

Execution Discipline Rule

If unsure:

Follow architecture patterns already created

Do NOT invent new patterns mid-project

Keep consistency across modules