class CookieManager {
    constructor() {
        this.cookieConsent = document.getElementById('cookieConsent');
        this.cookieAcceptAll = document.getElementById('cookieAcceptAll');
        this.init();
    }

    init() {
        this.showCookieNotice();
        this.setupEventListeners();
    }

    showCookieNotice() {
        if (!this.getCookie('cookie_notice_shown')) {
            setTimeout(() => {
                this.cookieConsent.classList.add('active');
            }, 1000);
        }
    }

    setupEventListeners() {
        this.cookieAcceptAll.addEventListener('click', () => {
            this.acceptCookies();
        });
    }

    acceptCookies() {
        this.setCookie('cookie_notice_shown', 'true', 365);
        this.cookieConsent.classList.remove('active');
    }

    setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        document.cookie = name + "=" + value + ";" + expires + ";path=/;SameSite=Lax";
    }

    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CookieManager();
});