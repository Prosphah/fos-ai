Below is a detailed UI specification written for an AI coding agent (Cursor, Claude Code, Copilot, GPT, Lovable, etc.). It focuses on layout, spacing, hierarchy, components, and visual design rather than the financial content.

---

# Modern AI Financial Dashboard UI Specification

## Overall Design Language

Design a premium, Apple-inspired SaaS dashboard with a clean, luxurious aesthetic.

Style keywords:

* Minimal
* Airy
* High-end fintech
* Soft glassmorphism
* Large whitespace
* Rounded corners
* Extremely subtle gradients
* Soft shadows
* Thin borders
* Modern typography
* Calm visual hierarchy

The dashboard should feel closer to Linear, Arc Browser, Apple, Vercel, and Stripe than a traditional banking app.

---

# Layout

Desktop layout.

Two-column structure.

```
----------------------------------------------------
| Sidebar |                Main Content            |
|         |                                        |
|         |                                        |
----------------------------------------------------
```

Sidebar width:

```
260px
```

Main content:

```
flex:1
padding:40px
```

Maximum width approximately

```
1600px
```

---

# Color Palette

Background

```
#FAFAF9
```

Sidebar

```
#050505
```

Primary Accent

```
Emerald Green

#17C964
```

Secondary Green

```
#39D98A
```

Success

```
#16A34A
```

Warning

```
#F59E0B
```

Danger

```
#EF4444
```

Text

Primary

```
#111111
```

Secondary

```
#6B7280
```

Border

```
#ECECEC
```

Cards

```
White
```

---

# Shadows

Very soft.

```
0 8px 30px rgba(0,0,0,0.04)
```

No heavy shadows.

---

# Border Radius

Cards

```
24px
```

Buttons

```
14px
```

Inputs

```
16px
```

Charts

```
24px
```

---

# Typography

Use Geist.

Hierarchy

Page title

```
40px
Bold
```

Section title

```
28px
Semibold
```

Card title

```
18px
Medium
```

Large metric

```
56px
Bold
```

Medium metric

```
36px
Bold
```

Normal text

```
16px
```

Small labels

```
14px
```

---

# Sidebar

Dark matte background.

Contains:

Logo

Navigation

Profile Card

Premium Card

Bottom utility icons

Spacing between items is generous.

Navigation buttons are pill-shaped.

Inactive:

Transparent

Active:

Dark emerald background

Soft glow

White icon

White text

Icons on the left.

Text aligned vertically.

---

# Header

Large greeting.

Example

```
Good morning, Alexander
```

Below

```
Here's your financial briefing for today.
```

Right side contains:

Date picker

Notification button

Notification has a small green status dot.

Everything vertically centered.

---

# Hero Card

Large full-width card.

Height around

```
300px
```

Contains two columns.

## Left

Small title

```
Financial Health Score
```

Large score

```
82
```

Smaller

```
/100
```

Green label

```
Strong
```

Short explanatory paragraph.

---

## Right

Very large circular progress indicator.

Approximately

```
220px
```

Behind it is a soft green line chart.

Everything fades into the background.

On the far right sits a floating badge

```
↑ 6 pts

vs last month
```

Badge has rounded pill background.

---

# Financial Snapshot Section

Title

```
Financial Snapshot
```

Below is a responsive grid.

Layout

```
2 small cards

2 small cards

1 large chart card
```

Equivalent to

```
-----------------------------------
| card | card |      chart        |
|------|------|                   |
| card | card |                   |
-----------------------------------
```

---

## Small Metric Cards

Each card

Contains

Small colored icon circle

Metric label

Large number

Small trend

Examples

Income

Expenses

Savings Rate

Net Worth

Spacing is generous.

---

## Large Chart Card

Occupies two rows.

Contains

Title

Large metric

Green trend

Line chart

Dropdown on top right

Chart has no heavy gridlines.

Very thin green line.

Soft gradient beneath.

---

# AI Insight Card

Large horizontal card.

Split layout.

Left

Headline

Large bold statement

Supporting paragraph

Primary button

```
View Full Analysis
```

Right

Floating AI illustration.

Abstract layered squares.

Glowing emerald icon.

Soft blurred gradient behind illustration.

---

# Risk Overview

Three equal cards.

Each contains

Top row

Title

Small outlined icon

Status

```
Moderate
Low
Good
```

Tiny sparkline underneath.

Short explanatory paragraph.

Cards use subtle accent colors.

Portfolio Risk

Amber

Debt

Green

Liquidity

Green

---

# Recommended Actions

Three action cards.

Each card contains

Rounded icon

Title

Description

Impact label

Primary CTA button

Examples

Increase Emergency Fund

Pay Down Debt

Diversify Investments

Buttons aligned bottom.

Cards same height.

---

# Card Style

Every card uses

White background

Very thin border

24px radius

32px padding

Soft shadow

On hover

Slight lift

Slightly brighter shadow

No dramatic animations.

---

# Charts

Use smooth bezier curves.

Thin line.

2.5px stroke.

Soft green glow.

Area gradient

```
Transparent

↓

10% Emerald
```

Minimal axis labels.

No clutter.

---

# Buttons

Primary

Emerald

White text

Rounded

Hover

Slight elevation

Slightly darker green

Secondary

White

Border

Gray text

---

# Icons

Outline icons.

2px stroke.

Consistent size

```
20px
```

Use Lucide icons.

---

# Spacing System

Use an 8px spacing scale.

```
8
16
24
32
40
48
64
```

Large breathing room.

Never feel cramped.

---

# Visual Effects

Apply very subtle radial gradients behind important sections.

Example

```
radial-gradient(
rgba(34,197,94,0.10),
transparent
)
```

Blur around

```
80px
```

Very low opacity.

---

# Interactions

Cards

Lift 2 to 4px on hover.

Buttons

Smooth 200ms transition.

Sidebar items

Fade background.

Charts

Animate on load.

Progress ring

Animated stroke.

Numbers

Count up animation.

---

# Responsive Behaviour

Desktop

Full dashboard.

Tablet

Sidebar collapses to icons.

Cards become two columns.

Mobile

Sidebar becomes drawer.

Everything stacks vertically.

Charts become full width.

Buttons become full width.

---

# Tech Stack Expectations

* React + TypeScript
* Tailwind CSS
* shadcn/ui
* Framer Motion
* Lucide React
* Recharts (or Tremor charts)
* CSS variables for theming
* Responsive CSS Grid
* Reusable card components
* Reusable metric components
* Reusable chart components
* Design tokens for spacing, radius, colors, typography, and shadows

The final result should feel like a premium AI operating system for personal finance, emphasizing elegance, whitespace, subtle motion, and polished micro-interactions rather than a dense, traditional banking dashboard.
