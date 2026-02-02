class Navigation {
    constructor() {
        this.mobileToggle = document.getElementById('mobile-toggle');
        this.menu = document.getElementById('menu');
        this.header = document.getElementById('header');
        this.init();
    }

    init() {
        this.setupMobileMenu();
        this.setupSmoothScrolling();
        this.setupScrollHeader();
    }

    setupMobileMenu() {
        this.mobileToggle.addEventListener('click', () => {
            this.menu.classList.toggle('active');
            this.mobileToggle.innerHTML = this.menu.classList.contains('active') ? 
                '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
        });
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    window.scrollTo({
                        top: target.offsetTop - 70,
                        behavior: 'smooth'
                    });
                    
                    if (this.menu.classList.contains('active')) {
                        this.menu.classList.remove('active');
                        this.mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
                    }
                }
            });
        });
    }

    setupScrollHeader() {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                this.header.classList.add('scrolled');
            } else {
                this.header.classList.remove('scrolled');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Navigation();
});