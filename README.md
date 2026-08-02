# Portfolio Website - Krishna Devadkar

![Krishna Devadkar Portfolio](/public/images/profile.png)

A modern, production-ready, high-performance portfolio website built with **React 19**, **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, and **Nodemailer**.

Designed with a sleek glassmorphic theme inspired by **Apple**, **Stripe**, **Vercel**, and **Linear**.

---

## 🌟 Key Features

- 🎨 **Modern Glassmorphic Dark UI**: Deep Slate background (`#0F172A`), glowing cards (`#1E293B`), cyan & tech-blue accents with smooth dark/light mode toggle.
- ⚡ **Next.js 15 & React 19 Engine**: Built using App Router, Server Components, dynamic imports, and sub-second page performance.
- ✍️ **Interactive Typing Hero**: Words rotator showcasing key roles (Full Stack Developer, AI Engineer, Python Developer, React Developer, Backend Developer).
- 📊 **Categorized Skills Matrix**: Interactive skill tabs (Frontend, Backend, Database, AI, Cloud, Tools) with animated SVG circular percentage rings & skill cards.
- 🚀 **Filterable Projects Showcase**: Live search bar, category filter tabs (All, Web, AI, Mobile, Full Stack, ML), 3D hover cards, and interactive Case Study modal overlays.
- 📜 **Interactive Timelines**: Vertical timelines for Work Experience and Education with company logos, honors, and skill badges.
- 🏆 **Verified Credentials & Achievements**: Interactive grid for AWS, TensorFlow, Meta certifications, and top hackathon awards with credential verification modals.
- 🛠️ **Services & Testimonials**: Glassmorphic service cards & client reviews carousel slider.
- ✉️ **Nodemailer Contact Form**: Real-time form validation, rate-limiting, and automated email submission (`/api/contact`) with celebratory confetti.
- 🔍 **SEO & OpenGraph Optimized**: Includes JSON-LD Person schema, canonical links, `robots.txt`, and `sitemap.xml`.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons, React Icons, Canvas Confetti
- **Backend**: Next.js API Routes, Nodemailer (SMTP email dispatch with fallback dev logger)
- **Deployment**: Configured for Vercel & Netlify

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Krishna8208863439/Portfolio-Website.git
cd Portfolio-Website
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 4. Build for production
```bash
npm run build
```

---

## 📁 Folder Structure

```
Portfolio-Website/
├── app/
│   ├── api/contact/route.ts   # Nodemailer contact API
│   ├── globals.css            # Tailwind & glassmorphism custom CSS
│   ├── layout.tsx             # Root layout with fonts, SEO & Schema
│   ├── page.tsx               # Main portfolio page
│   ├── robots.ts              # Search engine crawling rules
│   └── sitemap.ts             # Dynamic sitemap generator
├── components/
│   ├── about/                 # About section & highlight counters
│   ├── certificates/          # Verified certificates grid & modal
│   ├── contact/               # Contact form & map card
│   ├── education/             # Academic qualifications timeline
│   ├── experience/            # Work experience timeline
│   ├── footer/                # Footer, social links & back to top
│   ├── hero/                  # Typing hero & avatar photo
│   ├── navbar/                # Sticky glassmorphic navbar & drawer
│   ├── projects/              # Projects grid, search & case studies
│   ├── services/              # Services grid & CTA triggers
│   ├── skills/                # Skills tabs & SVG progress rings
│   ├── testimonials/          # Client reviews carousel slider
│   └── ui/                    # Reusable components & ThemeToggle
├── context/
│   └── ThemeContext.tsx       # Dark/Light theme provider
├── lib/
│   └── constants.ts           # Comprehensive portfolio dataset
├── public/
│   └── images/                # Optimized project & profile artwork
└── types/
    └── portfolio.ts           # TypeScript interfaces
```

---

## 👤 Author

**Krishna Devadkar**
- Portfolio: [krishnadevadkar.vercel.app](https://krishnadevadkar.vercel.app)
- GitHub: [@krishna-devadkar](https://github.com/krishna-devadkar)
- LinkedIn: [Krishna Devadkar](https://linkedin.com/in/krishna-devadkar)
- Email: [krishna.devadkar.dev@gmail.com](mailto:krishna.devadkar.dev@gmail.com)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
