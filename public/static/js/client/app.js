class ContactFormHandler {
    constructor() {
        this.csrfToken = null;
        this.csrfTokenExpiry = null;
        this.API_BASE = '/api/v1';
        this.form = document.getElementById('contactForm');
        this.submitBtn = document.getElementById('submitBtn');
        this.csrfStatus = document.getElementById('csrfStatus');
        this.phoneInput = document.getElementById('phone');
        
        this.formInteractionStartTime = null;
        this.mouseMovements = 0;
        this.keystrokes = 0;
        this.focusEvents = 0;
        this.behaviorScore = 0;
        this.fingerprintData = {};
        
        this.init();
    }

    async init() {
        await this.loadCsrfToken();
        this.setupEventListeners();
        this.startTokenRefreshTimer();
        this.setupPhoneMask();
        this.initBotProtection();
        this.generateFingerprint();
    }

    initBotProtection() {
        this.formInteractionStartTime = Date.now();
        
        document.addEventListener('mousemove', () => {
            this.mouseMovements++;
            this.behaviorScore += 0.1;
        });
        
        this.form.addEventListener('keydown', () => {
            this.keystrokes++;
            this.behaviorScore += 0.2;
        });
        
        this.form.querySelectorAll('input, textarea').forEach(field => {
            field.addEventListener('focus', () => {
                this.focusEvents++;
                this.behaviorScore += 0.3;
            });
        });
        
        this.createHoneypotFields();
    }

    createHoneypotFields() {
        const honeypots = [
            { name: 'website', type: 'url' },
            { name: 'company', type: 'text' },
            { name: 'phone_backup', type: 'tel' }
        ];
        
        honeypots.forEach(hp => {
            const input = document.createElement('input');
            input.type = hp.type;
            input.name = hp.name;
            input.id = hp.name;
            input.style.display = 'none';
            input.className = 'honeypot-field';
            input.setAttribute('tabindex', '-1');
            input.setAttribute('autocomplete', 'off');
            this.form.appendChild(input);
        });
    }

    generateFingerprint() {
        this.fingerprintData = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory || 0,
            colorDepth: screen.colorDepth,
            pixelRatio: window.devicePixelRatio
        };
    }

    detectBotBehavior() {
        const currentTime = Date.now();
        const interactionTime = currentTime - this.formInteractionStartTime;
        
        const suspiciousFlags = [];
        
        if (interactionTime < 3000) {
            suspiciousFlags.push('TOO_FAST');
        }
        
        if (this.mouseMovements < 5) {
            suspiciousFlags.push('NO_MOUSE_MOVEMENT');
        }
        
        const filledFields = Array.from(this.form.querySelectorAll('input[required], textarea[required]'))
            .filter(field => field.value.trim());
        if (filledFields.length > 0 && this.keystrokes < filledFields.length * 2) {
            suspiciousFlags.push('NO_KEYSTROKES');
        }
        
        const honeypotsFilled = Array.from(this.form.querySelectorAll('.honeypot-field'))
            .some(field => field.value.trim());
        if (honeypotsFilled) {
            suspiciousFlags.push('HONEYPOT_FILLED');
        }
        
        const suspiciousUAs = ['bot', 'crawler', 'spider', 'scraper', 'automated'];
        if (suspiciousUAs.some(ua => navigator.userAgent.toLowerCase().includes(ua))) {
            suspiciousFlags.push('SUSPICIOUS_UA');
        }
        
        if (this.behaviorScore < 2) {
            suspiciousFlags.push('LOW_BEHAVIOR_SCORE');
        }
        
        return {
            isSuspicious: suspiciousFlags.length >= 2,
            flags: suspiciousFlags,
            behaviorScore: this.behaviorScore,
            interactionTime,
            mouseMovements: this.mouseMovements,
            keystrokes: this.keystrokes
        };
    }

    checkTimingPattern() {
        const fields = ['name', 'email', 'phone', 'message'];
        const timings = [];
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && field.value.trim()) {
                const fieldLength = field.value.trim().length;
                const avgTypingSpeed = fieldLength / (Date.now() - this.formInteractionStartTime) * 1000;
                timings.push(avgTypingSpeed);
            }
        });
        
        return timings.every(speed => speed > 10);
    }

    setupPhoneMask() {
        const phoneInput = this.phoneInput;
        
        phoneInput.addEventListener('input', function(e) {
            const value = phoneInput.value.replace(/\D/g, '');
            let formattedValue = '';
            
            if (value.length > 0) {
                formattedValue = '(' + value.substring(0, 3);
            }
            if (value.length > 3) {
                formattedValue += ') ' + value.substring(3, 6);
            }
            if (value.length > 6) {
                formattedValue += '-' + value.substring(6, 8);
            }
            if (value.length > 8) {
                formattedValue += '-' + value.substring(8, 10);
            }
            
            phoneInput.value = formattedValue;
        });

        phoneInput.addEventListener('keydown', function(e) {
            if ([46, 8, 9, 27, 13].includes(e.keyCode) || 
                (e.keyCode === 65 && e.ctrlKey === true) || 
                (e.keyCode === 67 && e.ctrlKey === true) ||
                (e.keyCode === 86 && e.ctrlKey === true) ||
                (e.keyCode === 88 && e.ctrlKey === true)) {
                return;
            }
        });
    }

    async loadCsrfToken() {
        try {
            const response = await fetch(`${this.API_BASE}/csrf-token`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.csrfToken = data.token;
            this.csrfTokenExpiry = Date.now() + (data.expires_in * 1000);
            
            this.updateCsrfStatus(true);
            this.submitBtn.disabled = false;
            
            
        } catch (error) {
            console.error('❌ Failed to load CSRF token:', error);
            
            const metaToken = document.querySelector('meta[name="csrf-token"]')?.content;
            if (metaToken) {
                this.csrfToken = metaToken;
                this.updateCsrfStatus(true);
                this.submitBtn.disabled = false;
                console.warn('⚠️ Using fallback CSRF token from meta tag');
            } else {
                this.updateCsrfStatus(false, error.message);
                this.submitBtn.disabled = true;
            }
        }
    }

    updateCsrfStatus(success, errorMessage = null) {
        if (!success) {
            this.csrfStatus.className = 'csrf-status csrf-error';
            this.csrfStatus.textContent = errorMessage || 'Ошибка загрузки CSRF токена';
            this.csrfStatus.style.display = 'block';
        }
    }

    startTokenRefreshTimer() {
        setInterval(async () => {
            if (this.csrfTokenExpiry && Date.now() > (this.csrfTokenExpiry - 5 * 60 * 1000)) {
                await this.loadCsrfToken();
            }
        }, 60000); 
    }

    setupEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        document.getElementById('name').addEventListener('blur', () => this.validateField('name'));
        document.getElementById('email').addEventListener('blur', () => this.validateField('email'));
        document.getElementById('phone').addEventListener('blur', () => this.validateField('phone'));
        document.getElementById('message').addEventListener('blur', () => this.validateField('message'));
        document.getElementById('privacyAgreement').addEventListener('change', () => this.validateField('privacyAgreement'));
        
        document.getElementById('name').addEventListener('input', () => this.validateField('name'));
        document.getElementById('email').addEventListener('input', () => this.validateField('email'));
        document.getElementById('message').addEventListener('input', () => this.validateField('message'));
    }

    showError(fieldId, message) {
        const errorElement = document.getElementById(`${fieldId}-error`);
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    hideError(fieldId) {
        const errorElement = document.getElementById(`${fieldId}-error`);
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }

    resetErrors() {
        document.querySelectorAll('.error').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
    }

    validateField(fieldId) {
        const field = document.getElementById(fieldId);
        let value;
        
        if (field.type === 'checkbox') {
            value = field.checked;
        } else {
            value = field.value.trim();
        }
        
        switch(fieldId) {
            case 'name':
                if (!value) {
                    this.showError(fieldId, 'Пожалуйста, укажите ваше имя');
                    return false;
                }
                if (!/^[a-zA-Zа-яА-ЯёЁ\s\-']{2,255}$/.test(value)) {
                    this.showError(fieldId, 'Имя должно содержать 2-255 буквенных символов');
                    return false;
                }
                break;
                
            case 'email':
                if (!value) {
                    this.showError(fieldId, 'Пожалуйста, укажите ваш email');
                    return false;
                }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    this.showError(fieldId, 'Введите корректный email');
                    return false;
                }
                break;
                
            case 'phone':
                if (value) {
                    const digits = value.replace(/\D/g, '');
                    
                    if (digits.length !== 10) {
                        this.showError(fieldId, 'Некорректный формат телефона. Введите 10 цифр номера. Пример: (987) 654-32-10');
                        return false;
                    }
                }
                break;
                
            case 'message':
                if (!value) {
                    this.showError(fieldId, 'Пожалуйста, введите ваше сообщение');
                    return false;
                }
                if (value.length < 10 || value.length > 1000) {
                    this.showError(fieldId, 'Сообщение должно быть 10-1000 символов');
                    return false;
                }
                break;
                
            case 'privacyAgreement':
                if (!value) {
                    this.showError(fieldId, 'Для отправки формы необходимо ваше согласие');
                    return false;
                }
                break;
        }
        
        this.hideError(fieldId);
        return true;
    }

    validateForm() {
        this.resetErrors();
        let isValid = true;

        const honeypot = document.getElementById('honeypot');
        if (honeypot && honeypot.value) {
            console.warn('🤖 Bot detected via honeypot');
            return false;
        }

        ['name', 'email', 'message', 'privacyAgreement'].forEach(fieldId => {
            if (!this.validateField(fieldId)) {
                isValid = false;
            }
        });

        const phoneValue = document.getElementById('phone').value.trim();
        if (phoneValue && !this.validateField('phone')) {
            isValid = false;
        }

        return isValid;
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            console.warn('📝 Form validation failed');
            return;
        }

        const botDetection = this.detectBotBehavior();
        if (botDetection.isSuspicious) {
            console.warn('🤖 Suspicious bot behavior detected:', botDetection.flags);
            this.showResponse('error', 
                '❌ Подозрительная активность обнаружена. Пожалуйста, попробуйте еще раз через несколько минут.'
            );
            return;
        }

        if (this.checkTimingPattern()) {
            console.warn('🤖 Suspicious typing pattern detected');
            this.showResponse('error', 
                '❌ Подозрительная активность обнаружена. Пожалуйста, заполните форму еще раз.'
            );
            return;
        }

        if (!this.csrfToken) {
            this.showResponse('error', '❌ CSRF токен недоступен. Попробуйте перезагрузить страницу.');
            return;
        }

        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim() || null,
            message: document.getElementById('message').value.trim(),
            privacy_agreement: document.getElementById('privacyAgreement').checked,
            csrf_token: this.csrfToken,
            behavior_data: {
                interaction_time: Date.now() - this.formInteractionStartTime,
                mouse_movements: this.mouseMovements,
                keystrokes: this.keystrokes,
                focus_events: this.focusEvents,
                behavior_score: this.behaviorScore,
                fingerprint: btoa(JSON.stringify(this.fingerprintData))
            }
        };

        this.setSubmitState(true);

        try {
            const response = await fetch(`${this.API_BASE}/contact-submissions`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const responseText = await response.text();
            
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (jsonError) {
                result = {
                    message: responseText || `HTTP Error: ${response.status}`,
                    code: 'INVALID_RESPONSE'
                };
            }

            if (response.ok) {
                this.showResponse('success', 
                    `✅ Сообщение успешно отправлено!<br>
                        <p>Спасибо за обращение! Мы ответим вам в течение 24 часов.</p>
                        <p>ID заявки: <strong>${result.submission_id}</strong></p>
                        <p>На ваш email <strong>${formData.email}</strong> будет отправлено подтверждение.</p>`
                );
                this.form.reset();
                this.resetErrors();
            } else {
                let fieldErrors = '';
                
                if (result.code === "VALIDATION_ERROR") {
                    if (result.message.includes("Имя")) {
                        this.showError('name', result.message);
                    } else if (result.message.includes("email")) {
                        this.showError('email', result.message);
                    } else if (result.message.includes("Сообщение")) {
                        this.showError('message', result.message);
                    } else if (result.message.includes("согласие")) {
                        this.showError('privacyAgreement', result.message);
                    }
                    fieldErrors = `<p>Проверьте правильность заполнения полей</p>`;
                }
                
                if (result.errors) {
                    result.errors.forEach(error => {
                        this.showError(error.field, error.message);
                        fieldErrors += `<p>${error.field}: ${error.message}</p>`;
                    });
                }
                
                this.showResponse('error', 
                    `❌ Ошибка: ${result.message || 'Произошла неизвестная ошибка'}<br>
                        <p>Код ошибки: ${result.code || 'UNKNOWN'}</p>
                        ${fieldErrors}`
                );
            }

        } catch (error) {
            console.error('🌐 Network error:', error);
            this.showResponse('error', 
                `❌ Сетевая ошибка<br>
                    <p>Проверьте интернет-соединение и попробуйте снова</p>
                    <p>Техническая информация: ${error.message}</p>`
            );
        } finally {
            this.setSubmitState(false);
        }
    }

    setSubmitState(isSubmitting) {
        this.submitBtn.disabled = isSubmitting;
        this.submitBtn.textContent = isSubmitting ? 'Отправка...' : 'Отправить сообщение';
        
        if (isSubmitting) {
            this.submitBtn.classList.add('loading');
        } else {
            this.submitBtn.classList.remove('loading');
        }
        
        this.form.querySelectorAll('input, textarea, button').forEach(el => {
            if (el !== this.submitBtn && !el.classList.contains('honeypot-field')) {
                el.disabled = isSubmitting;
            }
        });
    }

    showResponse(type, message) {
        const responseElement = document.getElementById('responseMessage');
        responseElement.innerHTML = '';
        
        responseElement.className = type === 'success' ? 'success' : 'error-message';
        responseElement.innerHTML = message;
        
        responseElement.style.display = 'block';
        responseElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        if (type === 'success') {
            setTimeout(() => {
                responseElement.style.display = 'none';
            }, 10000);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ContactFormHandler();
});