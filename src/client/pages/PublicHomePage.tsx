// src/client/pages/PublicHomePage.tsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import './public-home.css';

// ─── Типы ───────────────────────────────────────────────────────────────────
interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  privacyAgreement?: string;
}

// ─── Утилиты валидации ──────────────────────────────────────────────────────
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string): boolean {
  if (!phone.trim()) return true;
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10;
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 8) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
}

// ─── Inline SVG иконки ──────────────────────────────────────────────────────
// Все иконки — простые inline SVG, без внешних зависимостей.
// currentColor позволяет управлять цветом через CSS color.

const IconBars = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconTimes = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconChevronDown = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconMapMarker = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
);

const IconMapMarkedAlt = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    <path d="M17 3l2 2-2 2" opacity="0.6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconHardHat = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C7.58 2 4 5.58 4 10h16c0-4.42-3.58-8-8-8z" />
    <rect x="3" y="10" width="18" height="3" rx="1" />
    <rect x="5" y="14" width="14" height="2" rx="1" opacity="0.7" />
  </svg>
);

const IconBalanceScale = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2v18M4 20h16M12 2l-7 10h14L12 2z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="5" cy="12" r="2.5" />
    <circle cx="19" cy="12" r="2.5" />
  </svg>
);

const IconFileInvoiceDollar = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <text x="12" y="17" textAnchor="middle" fontSize="7" fontWeight="bold" fill="currentColor">$</text>
  </svg>
);

const IconFireExtinguisher = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
    <rect x="8" y="6" width="8" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <rect x="10" y="2" width="4" height="4" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 6V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M9 10h6M9 13h6M9 16h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
  </svg>
);

const IconPhone = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
  </svg>
);

const IconMobile = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
    <rect x="7" y="2" width="10" height="20" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="12" cy="18.5" r="0.8" />
  </svg>
);

const IconEnvelope = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
);

const IconClock = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
  </svg>
);

// ─── Компонент ───────────────────────────────────────────────────────────────
export function PublicHomePage() {
  // ── навигация / мобильное меню ───────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const headerRef = useRef<HTMLHeadElement>(null);

  // ── форма ────────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    privacyAgreement: false,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseMessage, setResponseMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // ── cookie consent ──────────────────────────────────────────────────────
  const [showCookie, setShowCookie] = useState(false);

  // ── инерция скрolla для header (sticky shrink) ──────────────────────────
  const [scrolled, setScrolled] = useState(false);

  // ─── эффекты ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const accepted = document.cookie
      .split(';')
      .some((c) => c.trim().startsWith('cookieConsent='));
    if (!accepted) setShowCookie(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      const sections = ['hero', 'about', 'services', 'contact'];
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && window.scrollY >= el.offsetTop - 100) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ─── обработчики навигации ───────────────────────────────────────────────
  const scrollToSection = useCallback((id: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const headerH = headerRef.current?.offsetHeight ?? 70;
      const y = el.getBoundingClientRect().top + window.scrollY - headerH;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setMenuOpen(false);
  }, []);

  // ─── валидация формы ─────────────────────────────────────────────────────
  const validate = useCallback((): FormErrors => {
    const errs: FormErrors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = 'Введите имя (не менее 2 символов)';
    }
    if (!formData.email.trim()) {
      errs.email = 'Введите email';
    } else if (!validateEmail(formData.email)) {
      errs.email = 'Некорректный формат email';
    }
    if (!validatePhone(formData.phone)) {
      errs.phone = 'Введите 10 цифр номера';
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      errs.message = 'Сообщение должно содержать не менее 10 символов';
    }
    if (formData.message.trim().length > 1000) {
      errs.message = 'Сообщение не может быть длиннее 1000 символов';
    }
    if (!formData.privacyAgreement) {
      errs.privacyAgreement = 'Необходимо дать согласие';
    }
    return errs;
  }, [formData]);

  const isFormValid = Object.keys(validate()).length === 0;

  // ─── обработчики формы ───────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, type, value } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [id]: (e.target as HTMLInputElement).checked,
      }));
    } else if (id === 'phone') {
      setFormData((prev) => ({ ...prev, phone: formatPhone(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
    setFormErrors((prev) => ({ ...prev, [id]: undefined }));
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id } = e.target;
    const allErrors = validate();
    if (allErrors[id as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [id]: allErrors[id as keyof FormErrors] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);
    setResponseMessage(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone ? `+7${formData.phone.replace(/\D/g, '')}` : '',
          message: formData.message.trim(),
        }),
      });

      if (res.ok) {
        setResponseMessage({ text: 'Сообщение успешно отправлено! Мы связаемся с вами в ближайшее время.', type: 'success' });
        setFormData({ name: '', email: '', phone: '', message: '', privacyAgreement: false });
        setFormErrors({});
      } else {
        setResponseMessage({ text: 'Ошибка отправки. Попробуйте позже или позвоните нам.', type: 'error' });
      }
    } catch {
      setResponseMessage({ text: 'Сетевая ошибка. Пожалуйста, проверьте соединение и попробуйте снова.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── cookie accept ───────────────────────────────────────────────────────
  const handleCookieAccept = () => {
    document.cookie = 'cookieConsent=1; max-age=31536000; path=/; SameSite=Lax';
    setShowCookie(false);
  };

  // ─── рендер ──────────────────────────────────────────────────────────────
  return (
    <>
      <Helmet>
        <title>Судебные экспертизы в Барнауле: строительные, землеустроительные, оценочные — ООО «ЭКСПЕРТИЗА»</title>
        <meta name="description" content="Судебные экспертизы в Барнауле ✓ Строительно-технические ✓ Землеустроительные ✓ Оценочные экспертизы. 188 экспертиз в 2024 году. Срок 20 дней. ☎️ +7 (3852) 60-88-77" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="ООО «ЭКСПЕРТИЗА»" />
        <meta name="geo.region" content="RU-22" />
        <meta name="geo.placename" content="Барнаул" />
        <meta name="geo.position" content="53.340264;83.770838" />
        <meta name="ICBM" content="53.340264, 83.770838" />
        <link rel="canonical" href="https://ooo-ekspertiza.ru/" />
        <link rel="alternate" hreflang="ru-RU" href="https://ooo-ekspertiza.ru/" />
        <link rel="icon" type="image/x-icon" href="/static/image/favicon.ico" />
        <link rel="apple-touch-icon" href="/static/image/logo.png" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="ru_RU" />
        <meta property="og:title" content="Судебные экспертизы в Барнауле — ООО «ЭКСПЕРТИЗА»" />
        <meta property="og:description" content="Землеустроительные, строительно-технические, оценочные, пожарно-технические экспертизы в Барнауле. 188 выполненных экспертиз в 2024 году." />
        <meta property="og:url" content="https://ooo-ekspertiza.ru/" />
        <meta property="og:image" content="https://ooo-ekspertiza.ru/static/image/og-image.webp" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="ООО «ЭКСПЕРТИЗА»" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@ooo_ekspertiza" />
        <meta name="twitter:title" content="Судебные экспертизы в Барнауле — ООО «ЭКСПЕРТИЗА»" />
        <meta name="twitter:description" content="Экспертизы в Барнауле: землеустроительные, строительно-технические, оценочные. 20 дней срок выполнения." />
        <meta name="twitter:image" content="https://ooo-ekspertiza.ru/static/image/og-image.webp" />
        <meta name="theme-color" content="#1a365d" />
        <meta name="format-detection" content="telephone=yes" />
        <meta name="yandex-verification" content="7785b8517199b786" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LegalService",
            "@id": "https://ooo-ekspertiza.ru/#organization",
            "name": "ООО «ЭКСПЕРТИЗА»",
            "url": "https://ooo-ekspertiza.ru/",
            "logo": "https://ooo-ekspertiza.ru/static/image/logo.png",
            "image": {
              "@type": "ImageObject",
              "url": "https://ooo-ekspertiza.ru/static/image/og-image.webp",
              "width": 1200,
              "height": 630
            },
            "description": "Судебные экспертизы в Барнауле: землеустроительные, строительно-технические, оценочные, пожарно-технические и финансово-бухгалтерские. Сертифицированное оборудование.",
            "telephone": ["+7 (3852) 60-88-77", "+7 (913) 210-88-77"],
            "email": "info@ooo-ekspertiza.ru",
            "address": {
              "@type": "PostalAddress",
              "postalCode": "656049",
              "addressLocality": "Барнаул",
              "addressRegion": "Алтайский край",
              "addressCountry": "RU",
              "streetAddress": "пр-кт Красноармейский, 77 корпус Б оф.301"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": 53.340264,
              "longitude": 83.770838
            },
            "openingHoursSpecification": [
              { "@type": "OpeningHoursSpecification", "dayOfWeek": "https://schema.org/Monday", "opens": "09:00", "closes": "18:00" },
              { "@type": "OpeningHoursSpecification", "dayOfWeek": "https://schema.org/Tuesday", "opens": "09:00", "closes": "18:00" },
              { "@type": "OpeningHoursSpecification", "dayOfWeek": "https://schema.org/Wednesday", "opens": "09:00", "closes": "18:00" },
              { "@type": "OpeningHoursSpecification", "dayOfWeek": "https://schema.org/Thursday", "opens": "09:00", "closes": "18:00" },
              { "@type": "OpeningHoursSpecification", "dayOfWeek": "https://schema.org/Friday", "opens": "09:00", "closes": "18:00" }
            ],
            "areaServed": [
              { "@type": "City", "name": "Барнаул" },
              { "@type": "State", "name": "Алтайский край" }
            ],
            "priceRange": "$$",
            "contactPoint": [
              {
                "@type": "ContactPoint",
                "telephone": "+73852608877",
                "contactType": "customer service",
                "availableLanguage": "Russian"
              }
            ],
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Виды судебных экспертиз",
              "itemListElement": [
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Землеустроительная экспертиза", "description": "Исследование объектов землеустройства в Барнауле и Алтайском крае", "serviceType": "Землеустроительная экспертиза" } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Строительно-техническая экспертиза", "description": "Техническая экспертиза строений и сооружений в Барнауле", "serviceType": "Строительно-техническая экспертиза" } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Оценочная экспертиза", "description": "Оценка недвижимого и движимого имущества в Барнауле", "serviceType": "Оценочная экспертиза" } }
              ]
            }
          })}
        </script>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Helmet>

      {/* ══════════════════════════════════════════════════════════════════════
          HEADER
      ════════════════════════════════════════════════════════════════════════ */}
      <header id="header" ref={headerRef} className={scrolled ? 'scrolled' : ''}>
        <div className="container header-container">
          <div className="logo">
            <div className="logo-text">ООО <span>«ЭКСПЕРТИЗА»</span></div>
          </div>

          <div
            className="mobile-toggle"
            id="mobile-toggle"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Открыть меню"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') setMenuOpen((p) => !p); }}
          >
            {menuOpen ? <IconTimes /> : <IconBars />}
          </div>

          <nav className={menuOpen ? 'menu-open' : ''}>
            <ul id="menu">
              {(['hero', 'about', 'services', 'contact'] as const).map((id) => {
                const labels: Record<string, string> = {
                  hero: 'Главная',
                  about: 'О компании',
                  services: 'Экспертизы',
                  contact: 'Контакты',
                };
                return (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      className={activeSection === id ? 'active' : ''}
                      onClick={(e) => scrollToSection(id, e)}
                    >
                      {labels[id]}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════════════════ */}
      <section className="hero" id="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Судебные экспертизы в Барнауле и Алтайском крае</h1>
            <p>
              ООО «ЭКСПЕРТИЗА» специализируется на проведении судебных экспертиз и экспертных исследований в различных областях. Качество и надежность с 2022 года.
            </p>
            <div className="hero-buttons">
              <a href="#services" className="btn" onClick={(e) => scrollToSection('services', e)}>Виды экспертиз</a>
              <a href="#contact" className="btn btn-outline" onClick={(e) => scrollToSection('contact', e)}>Связаться с нами</a>
            </div>
          </div>
        </div>

        {/* Декоративная геометрия справа */}
        <div className="hero-visual" aria-hidden="true">
          <svg viewBox="0 0 600 700" className="hero-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e8a838" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#d49530" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="g2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4299e1" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#63b3ed" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="g3" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e8a838" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#e8a838" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Крупный полигон фон */}
            <polygon
              points="420,80 580,200 560,420 380,480 240,360 280,180"
              fill="url(#g3)"
              className="hero-poly-bg"
            />

            {/* Центральный шестиугольник */}
            <polygon
              points="400,160 500,220 500,340 400,400 300,340 300,220"
              fill="none"
              stroke="url(#g1)"
              strokeWidth="2"
              className="hero-hex"
            />

            {/* Внутренний шестиугольник меньше */}
            <polygon
              points="400,210 460,245 460,315 400,350 340,315 340,245"
              fill="url(#g1)"
              fillOpacity="0.12"
              stroke="url(#g1)"
              strokeWidth="1"
              className="hero-hex-inner"
            />

            {/* Знак весов внутри — отсылка на экспертизу */}
            <g className="hero-scale">
              <line x1="400" y1="255" x2="400" y2="320" stroke="#e8a838" strokeWidth="2" strokeLinecap="round" />
              <line x1="370" y1="255" x2="430" y2="255" stroke="#e8a838" strokeWidth="2" strokeLinecap="round" />
              <circle cx="370" cy="255" r="3" fill="#e8a838" />
              <circle cx="430" cy="255" r="3" fill="#e8a838" />
              {/* левая чаша */}
              <line x1="370" y1="255" x2="350" y2="285" stroke="#e8a838" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
              <line x1="370" y1="255" x2="390" y2="285" stroke="#e8a838" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
              <ellipse cx="370" cy="288" rx="22" ry="5" fill="none" stroke="#e8a838" strokeWidth="1.5" opacity="0.7" />
              {/* правая чаша */}
              <line x1="430" y1="255" x2="410" y2="285" stroke="#e8a838" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
              <line x1="430" y1="255" x2="450" y2="285" stroke="#e8a838" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
              <ellipse cx="430" cy="288" rx="22" ry="5" fill="none" stroke="#e8a838" strokeWidth="1.5" opacity="0.7" />
              {/* основание */}
              <line x1="385" y1="320" x2="415" y2="320" stroke="#e8a838" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Плавающие точки — сетка */}
            <circle cx="280" cy="140" r="4" fill="#e8a838" opacity="0.6" className="hero-dot hero-dot-1" />
            <circle cx="520" cy="180" r="3" fill="#4299e1" opacity="0.5" className="hero-dot hero-dot-2" />
            <circle cx="240" cy="380" r="5" fill="#e8a838" opacity="0.4" className="hero-dot hero-dot-3" />
            <circle cx="540" cy="400" r="4" fill="#4299e1" opacity="0.4" className="hero-dot hero-dot-4" />
            <circle cx="320" cy="480" r="3" fill="#e8a838" opacity="0.3" className="hero-dot hero-dot-5" />
            <circle cx="480" cy="120" r="2.5" fill="#fff" opacity="0.3" className="hero-dot hero-dot-6" />
            <circle cx="200" cy="280" r="2" fill="#fff" opacity="0.25" className="hero-dot hero-dot-7" />
            <circle cx="500" cy="500" r="3.5" fill="#e8a838" opacity="0.25" className="hero-dot hero-dot-8" />

            {/* Линии связи между точками */}
            <line x1="280" y1="140" x2="400" y2="160" stroke="#e8a838" strokeWidth="0.8" opacity="0.3" />
            <line x1="520" y1="180" x2="400" y2="160" stroke="#4299e1" strokeWidth="0.8" opacity="0.25" />
            <line x1="240" y1="380" x2="300" y2="340" stroke="#e8a838" strokeWidth="0.8" opacity="0.2" />
            <line x1="540" y1="400" x2="500" y2="340" stroke="#4299e1" strokeWidth="0.8" opacity="0.2" />
            <line x1="280" y1="140" x2="520" y2="180" stroke="#fff" strokeWidth="0.5" opacity="0.12" />
            <line x1="240" y1="380" x2="540" y2="400" stroke="#fff" strokeWidth="0.5" opacity="0.1" />

            {/* Маленькие акцентные полигоны */}
            <polygon
              points="510,480 540,500 510,520 480,500"
              fill="none"
              stroke="#e8a838"
              strokeWidth="1.2"
              opacity="0.4"
              className="hero-diamond-1"
            />
            <polygon
              points="250,200 270,220 250,240 230,220"
              fill="none"
              stroke="#4299e1"
              strokeWidth="1"
              opacity="0.3"
              className="hero-diamond-2"
            />
            <polygon
              points="470,550 490,565 470,580 450,565"
              fill="url(#g1)"
              fillOpacity="0.2"
              stroke="#e8a838"
              strokeWidth="0.8"
              opacity="0.3"
              className="hero-diamond-3"
            />

            {/* Дуги / окружности - дополнительный акцент */}
            <circle
              cx="400"
              cy="280"
              r="110"
              fill="none"
              stroke="url(#g2)"
              strokeWidth="1"
              strokeDasharray="200 490"
              className="hero-ring-1"
            />
            <circle
              cx="400"
              cy="280"
              r="145"
              fill="none"
              stroke="#e8a838"
              strokeWidth="0.6"
              strokeDasharray="100 590"
              opacity="0.25"
              className="hero-ring-2"
            />
          </svg>
        </div>

        <a
          href="#about"
          className="scroll-down"
          onClick={(e) => scrollToSection('about', e)}
          aria-label="Прокрутить вниз"
        >
          <IconChevronDown />
        </a>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          ABOUT
      ════════════════════════════════════════════════════════════════════════ */}
      <section className="about" id="about">
        <div className="container">
          <div className="text-center">
            <h2>О нашей компании</h2>
            <p>Профессионализм, качество и надежность с 2022 года</p>
          </div>
          <div className="about-content">
            <div className="about-text">
              <p>
                ООО «Экспертиза» специализируется на проведении судебных экспертиз и экспертных исследований. Все экспертизы выполняются квалифицированными специалистами в установленный судом срок.
              </p>
              <p>
                Наши эксперты работают не только в Барнауле, но и по всему Алтайскому краю: выезжаем для проведения исследований в Бийск, Рубцовск, Новоалтайск, а также во все районы края.
              </p>

              {/* Статистика */}
              <div className="stats-container">
                <h3>Статистика выполнения экспертиз</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-year">2023</div>
                    <div className="stat-value">120</div>
                    <div className="stat-label">выполненных экспертиз</div>
                    <ul className="stat-details">
                      <li>Землеустроительные: <strong>16</strong></li>
                      <li>Строительно-технические: <strong>85</strong></li>
                      <li>Оценочные: <strong>19</strong></li>
                    </ul>
                  </div>
                  <div className="stat-card">
                    <div className="stat-year">2024</div>
                    <div className="stat-value">188</div>
                    <div className="stat-label">выполненных экспертиз</div>
                    <ul className="stat-details">
                      <li>Землеустроительные: <strong>28</strong></li>
                      <li>Строительно-технические: <strong>90</strong></li>
                      <li>Оценочные: <strong>62</strong></li>
                      <li>Пожарно-технические: <strong>3</strong></li>
                      <li>Финансово-бухгалтерские: <strong>5</strong></li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Гарантии */}
              <div className="guarantees-container">
                <h3>Наши гарантии</h3>
                <ul>
                  <li>Средний срок проведения экспертиз — <strong>20 календарных дней</strong></li>
                  <li>100% выполнение в установленные судом сроки</li>
                  <li>Использование поверенного и сертифицированного оборудования</li>
                  <li>Строгое соблюдение требований законодательства</li>
                  <li>Квалифицированные эксперты с практическим опытом</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SERVICES
      ════════════════════════════════════════════════════════════════════════ */}
      <section className="services" id="services">
        <div className="container">
          <div className="text-center">
            <h2>Виды экспертиз</h2>
            <p>Специализированные судебные экспертизы и исследования</p>
          </div>
          <div className="services-grid">
            {[
              {
                Icon: IconMapMarkedAlt,
                title: 'Землеустроительные экспертизы',
                desc: 'Исследование объектов землеустройства с определением границ на местности, соответствия назначения зданий целевому использованию земельного участка и другие землеустроительные вопросы.',
              },
              {
                Icon: IconHardHat,
                title: 'Строительно-технические экспертизы',
                desc: 'Технические экспертизы строений и сооружений, систем инженерного оборудования при узаконении самовольных строений, определении причиненного ущерба заливом/пожаром, разделе общего имущества, определении теплопотерь.',
              },
              {
                Icon: IconBalanceScale,
                title: 'Оценочные экспертизы',
                desc: 'Оценка недвижимого и движимого имущества для судебных и внесудебных целей с подготовкой профессиональных заключений.',
              },
              {
                Icon: IconFileInvoiceDollar,
                title: 'Финансово-бухгалтерские экспертизы',
                desc: 'Аудит и финансово-бухгалтерские исследования для решения спорных вопросов в судебном порядке.',
              },
              {
                Icon: IconFireExtinguisher,
                title: 'Пожарно-технические экспертизы',
                desc: 'Определение очага возгорания, характера распространения пожара, причин и обстоятельств возникновения пожаров.',
              },
            ].map((service) => (
              <div className="service-card" key={service.title}>
                <div className="service-icon">
                  <service.Icon />
                </div>
                <div className="service-content">
                  <h3>{service.title}</h3>
                  <p>{service.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="expertise-process">
            <h3>Процесс проведения экспертиз</h3>
            <ol>
              <li><strong>Сроки:</strong> Средний срок проведения экспертиз — 20 календарных дней</li>
              <li><strong>Стоимость:</strong> Определяется после ознакомления с кругом вопросов и материалами дела</li>
              <li><strong>Точность:</strong> Использование сертифицированного оборудования и инструментов</li>
              <li><strong>Эффективность:</strong> Взаимодействие с судом через электронную почту для ускорения процесса</li>
            </ol>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          CONTACT
      ════════════════════════════════════════════════════════════════════════ */}
      <section className="contact" id="contact">
        <div className="container">
          <div className="contact-container">
            {/* Левая колонка — информация */}
            <div className="contact-info">
              <h2>Контакты</h2>
              <div className="contact-details">
                <div className="contact-item">
                  <div className="contact-icon"><IconMapMarker /></div>
                  <div>
                    <h4 style={{ color: 'white' }}>Адрес</h4>
                    <p>656049, г. Барнаул,<br />пр-кт Красноармейский, 77 корпус Б оф.301</p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon"><IconPhone /></div>
                  <div>
                    <h4 style={{ color: 'white' }}>Телефоны</h4>
                    <p><a href="tel:+73852608877" style={{ color: 'inherit' }}>+7 (3852) 60-88-77</a></p>
                    <p><a href="tel:+79132108877" style={{ color: 'inherit' }}>+7 (913) 210-88-77</a></p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon"><IconEnvelope /></div>
                  <div>
                    <h4 style={{ color: 'white' }}>Email</h4>
                    <p><a href="mailto:info@ooo-ekspertiza.ru" style={{ color: 'inherit' }}>info@ooo-ekspertiza.ru</a></p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon"><IconClock /></div>
                  <div>
                    <h4 style={{ color: 'white' }}>Часы работы</h4>
                    <p>Пн–Пт: 9:00 – 18:00<br />Сб–Вс: Выходной</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Правая колонка — форма */}
            <div className="contact-form">
              <h2>Напишите нам</h2>

              {/* honeypot */}
              <input
                type="text"
                name="honeypot"
                className="honeypot-field"
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              <form id="contactForm" onSubmit={handleSubmit} noValidate>
                {/* Имя */}
                <div className="form-group">
                  <label htmlFor="name">Ваше имя *</label>
                  <input
                    type="text"
                    id="name"
                    className={`form-control${formErrors.name ? ' input-error' : ''}`}
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    minLength={2}
                    maxLength={50}
                    required
                  />
                  {formErrors.name && <div className="error" id="name-error">{formErrors.name}</div>}
                </div>

                {/* Email */}
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    className={`form-control${formErrors.email ? ' input-error' : ''}`}
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  />
                  {formErrors.email && <div className="error" id="email-error">{formErrors.email}</div>}
                </div>

                {/* Телефон */}
                <div className="form-group phone-input-group">
                  <label htmlFor="phone">Телефон</label>
                  <div className="input-with-prefix">
                    <span className="prefix">+7</span>
                    <input
                      type="tel"
                      id="phone"
                      className={`form-control phone-input${formErrors.phone ? ' input-error' : ''}`}
                      placeholder="(999) 999-99-99"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      maxLength={18}
                    />
                  </div>
                  {formErrors.phone && <div className="error" id="phone-error">{formErrors.phone}</div>}
                </div>

                {/* Сообщение */}
                <div className="form-group">
                  <label htmlFor="message">Сообщение *</label>
                  <textarea
                    id="message"
                    className={`form-control${formErrors.message ? ' input-error' : ''}`}
                    value={formData.message}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Опишите ваш вопрос или предложение..."
                    minLength={10}
                    maxLength={1000}
                    required
                  />
                  {formErrors.message && <div className="error" id="message-error">{formErrors.message}</div>}
                </div>

                {/* Согласие на обработку */}
                <div className="form-group checkbox-group">
                  <div className="checkbox-container">
                    <input
                      type="checkbox"
                      id="privacyAgreement"
                      name="privacyAgreement"
                      checked={formData.privacyAgreement}
                      onChange={handleChange}
                      required
                    />
                    <label htmlFor="privacyAgreement" className="checkbox-label">
                      Я даю согласие на обработку своих персональных данных в соответствии с{' '}
                      <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="privacy-link">
                        Политикой конфиденциальности
                      </a>{' '}*
                    </label>
                  </div>
                  {formErrors.privacyAgreement && (
                    <div className="error" id="privacyAgreement-error">{formErrors.privacyAgreement}</div>
                  )}
                </div>

                {/* Кнопка */}
                <button
                  type="submit"
                  className="btn-contact"
                  id="submitBtn"
                  disabled={!isFormValid || isSubmitting}
                >
                  {isSubmitting ? 'Отправка...' : 'Отправить сообщение'}
                </button>
              </form>

              {/* Ответ сервера */}
              {responseMessage && (
                <div
                  id="responseMessage"
                  style={{
                    marginTop: '20px',
                    padding: '15px',
                    borderRadius: '5px',
                    backgroundColor: responseMessage.type === 'success' ? '#d4edda' : '#f8d7da',
                    color: responseMessage.type === 'success' ? '#155724' : '#721c24',
                    border: `1px solid ${responseMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                  }}
                >
                  {responseMessage.text}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════════════════════ */}
      <footer>
        <div className="container">
          <div className="footer-content">
            <div className="footer-about">
              <div className="footer-logo">ООО <span>«ЭКСПЕРТИЗА»</span></div>
              <p>Специализированные судебные экспертизы и экспертные исследования. Качество и надежность с 2022 года.</p>
              <div className="requisites">
                <p><strong>ИНН:</strong> 2222896938</p>
              </div>
            </div>
            <div className="footer-links">
              <h3>Навигация</h3>
              <ul>
                {(['hero', 'about', 'services', 'contact'] as const).map((id) => {
                  const labels: Record<string, string> = {
                    hero: 'Главная',
                    about: 'О компании',
                    services: 'Экспертизы',
                    contact: 'Контакты',
                  };
                  return (
                    <li key={id}>
                      <a href={`#${id}`} onClick={(e) => scrollToSection(id, e)}>{labels[id]}</a>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="footer-contact">
              <h3>Контакты</h3>
              <p><span className="footer-icon"><IconMapMarker /></span> г. Барнаул, пр-кт Красноармейский, 77 корпус Б оф.301</p>
              <p><span className="footer-icon"><IconPhone /></span> <a href="tel:+73852603051" style={{ color: 'inherit' }}>+7 (3852) 60-30-51</a></p>
              <p><span className="footer-icon"><IconMobile /></span> <a href="tel:+79132108877" style={{ color: 'inherit' }}>+7 (913) 210-88-77</a></p>
              <p><span className="footer-icon"><IconEnvelope /></span> <a href="mailto:info@ooo-ekspertiza.ru" style={{ color: 'inherit' }}>info@ooo-ekspertiza.ru</a></p>
              <p><span className="footer-icon"><IconClock /></span> Пн–Пт: 9:00 – 18:00</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 ООО «ЭКСПЕРТИЗА»</p>
          </div>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════════════════════════
          COOKIE CONSENT
      ════════════════════════════════════════════════════════════════════════ */}
      {showCookie && (
        <div className="cookie-consent-container" id="cookieConsent">
          <div className="cookie-consent-content">
            <div className="cookie-consent-text">
              <p>
                Мы используем файлы cookie для улучшения работы сайта, анализа использования сайта. Ознакомьтесь с нашей{' '}
                <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Политикой конфиденциальности</a> для получения дополнительной информации.
              </p>
            </div>
            <div className="cookie-consent-buttons">
              <button className="cookie-btn cookie-btn-accept" id="cookieAcceptAll" onClick={handleCookieAccept}>
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}


    </>
  );
}