// src/client/pages/PublicHomePage.tsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import '../../styles/public-home.css';

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
  // допускаем пустое значение (не обязательное поле)
  if (!phone.trim()) return true;
  // убираем всё кроме цифр
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
    // cookie: показываем, если пользователь раньше не принимал
    const accepted = document.cookie
      .split(';')
      .some((c) => c.trim().startsWith('cookieConsent='));
    if (!accepted) setShowCookie(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      // определяем текущую секцию для навигации
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
    // убираем ошибку поля при изводе
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
      // ─── подставьте свой реальный endpoint ───────────────────────────
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap" as="style" onLoad={(e) => { (e.target as HTMLLinkElement).onload = null; (e.target as HTMLLinkElement).rel = 'stylesheet'; }} />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
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
        <noscript>{`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap">`}</noscript>
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
            <i className={menuOpen ? 'fas fa-times' : 'fas fa-bars'} />
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
            <h1>Судебные экспертизы в Барнауле и</h1>
            <p>
              ООО «ЭКСПЕРТИЗА» специализируется на проведении судебных экспертиз и экспертных исследований в различных областях. Качество и надежность с 2022 года.
            </p>
            <div className="hero-buttons">
              <a href="#services" className="btn" onClick={(e) => scrollToSection('services', e)}>Виды экспертиз</a>
              <a href="#contact" className="btn btn-outline" onClick={(e) => scrollToSection('contact', e)}>Связаться с нами</a>
            </div>
          </div>
        </div>
        <a
          href="#about"
          className="scroll-down"
          onClick={(e) => scrollToSection('about', e)}
          aria-label="Прокрутить вниз"
        >
          <i className="fas fa-chevron-down" />
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
                icon: 'fas fa-map-marked-alt',
                title: 'Землеустроительные экспертизы',
                desc: 'Исследование объектов землеустройства с определением границ на местности, соответствия назначения зданий целевому использованию земельного участка и другие землеустроительные вопросы.',
              },
              {
                icon: 'fas fa-hard-hat',
                title: 'Строительно-технические экспертизы',
                desc: 'Технические экспертизы строений и сооружений, систем инженерного оборудования при узаконении самовольных строений, определении причиненного ущерба заливом/пожаром, разделе общего имущества, определении теплопотерь.',
              },
              {
                icon: 'fas fa-balance-scale',
                title: 'Оценочные экспертизы',
                desc: 'Оценка недвижимого и движимого имущества для судебных и внесудебных целей с подготовкой профессиональных заключений.',
              },
              {
                icon: 'fas fa-file-invoice-dollar',
                title: 'Финансово-бухгалтерские экспертизы',
                desc: 'Аудит и финансово-бухгалтерские исследования для решения спорных вопросов в судебном порядке.',
              },
              {
                icon: 'fas fa-fire-extinguisher',
                title: 'Пожарно-технические экспертизы',
                desc: 'Определение очага возгорания, характера распространения пожара, причин и обстоятельств возникновения пожаров.',
              },
            ].map((service) => (
              <div className="service-card" key={service.title}>
                <div className="service-icon">
                  <i className={service.icon} />
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
                  <div className="contact-icon"><i className="fas fa-map-marker-alt" /></div>
                  <div>
                    <h4 style={{ color: 'white' }}>Адрес</h4>
                    <p>656049, г. Барнаул,<br />пр-кт Красноармейский, 77 корпус Б оф.301</p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon"><i className="fas fa-phone-alt" /></div>
                  <div>
                    <h4 style={{ color: 'white' }}>Телефоны</h4>
                    <p><a href="tel:+73852608877" style={{ color: 'inherit' }}>+7 (3852) 60-88-77</a></p>
                    <p><a href="tel:+79132108877" style={{ color: 'inherit' }}>+7 (913) 210-88-77</a></p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon"><i className="fas fa-envelope" /></div>
                  <div>
                    <h4 style={{ color: 'white' }}>Email</h4>
                    <p><a href="mailto:info@ooo-ekspertiza.ru" style={{ color: 'inherit' }}>info@ooo-ekspertiza.ru</a></p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon"><i className="fas fa-clock" /></div>
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

              {/* honeypot — скрытое поле-ловушка для ботов */}
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
              <p><i className="fas fa-map-marker-alt" /> г. Барнаул, пр-кт Красноармейский, 77 корпус Б оф.301</p>
              <p><i className="fas fa-phone-alt" /> <a href="tel:+73852603051" style={{ color: 'inherit' }}>+7 (3852) 60-30-51</a></p>
              <p><i className="fas fa-mobile-alt" /> <a href="tel:+79132108877" style={{ color: 'inherit' }}>+7 (913) 210-88-77</a></p>
              <p><i className="fas fa-envelope" /> <a href="mailto:info@ooo-ekspertiza.ru" style={{ color: 'inherit' }}>info@ooo-ekspertiza.ru</a></p>
              <p><i className="fas fa-clock" /> Пн–Пт: 9:00 – 18:00</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 ООО «ЭКСПЕРТИЗА». Все права защищены. ИНН 2222896938</p>
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

      {/* Developer credit */}
      <div className="developer-credit">
        <div className="container">
          <p>Сайт разработан: <a href="https://axiom-drive.ru" target="_blank" rel="noopener noreferrer">axiom-drive.ru</a></p>
        </div>
      </div>
    </>
  );
}