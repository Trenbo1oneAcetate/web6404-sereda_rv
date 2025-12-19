// Основные константы и переменные
const API_BASE = 'http://localhost:3000';
let updateInterval;
let updateTimerInterval;
let currentTheme = 'light';

// DOM элементы
const elements = {
    form: document.getElementById('registrationForm'),
    nameInput: document.getElementById('name'),
    emailInput: document.getElementById('email'),
    phoneInput: document.getElementById('phone'),
    birthdateInput: document.getElementById('birthdate'),
    passwordInput: document.getElementById('password'),
    confirmPasswordInput: document.getElementById('confirmPassword'),
    bioTextarea: document.getElementById('bio'),
    strengthBar: document.querySelector('.strength-bar'),
    charCounter: document.querySelector('.char-counter span'),
    booksContainer: document.getElementById('booksContainer'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    refreshBtn: document.getElementById('refreshBooks'),
    lastUpdate: document.getElementById('lastUpdate'),
    updateTimer: document.getElementById('updateTimer'),
    formStatus: document.getElementById('formStatus'),
    resetBtn: document.getElementById('resetBtn'),
    submitBtn: document.getElementById('submitBtn'),
    themeBtn: document.getElementById('themeBtn'),
    successModal: document.getElementById('successModal'),
    modalDetails: document.getElementById('modalDetails'),
    modalClose: document.querySelector('.modal-close'),
    modalOkBtn: document.getElementById('modalOkBtn'),
    navLinks: document.querySelectorAll('.nav-link')
};

// Валидаторы
const validators = {
    name: (value) => {
        const regex = /^[А-ЯЁ][а-яё]{2,}(?: [А-ЯЁ][а-яё]+)*$/;
        return {
            isValid: regex.test(value),
            message: 'Имя должно начинаться с заглавной буквы и содержать минимум 2 символа'
        };
    },
    
    email: (value) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
            isValid: regex.test(value),
            message: 'Введите корректный email адрес'
        };
    },
    
    phone: (value) => {
        const regex = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;
        return {
            isValid: regex.test(value),
            message: 'Формат телефона: +7 (XXX) XXX-XX-XX'
        };
    },
    
    birthdate: (value) => {
        const birthDate = new Date(value);
        const today = new Date();
        const minAgeDate = new Date();
        minAgeDate.setFullYear(today.getFullYear() - 12);
        
        return {
            isValid: birthDate <= minAgeDate,
            message: 'Вам должно быть больше 12 лет'
        };
    },
    
    password: (value) => {
        const hasMinLength = value.length >= 8;
        const hasLetters = /[a-zA-Zа-яА-Я]/.test(value);
        const hasNumbers = /\d/.test(value);
        
        let strength = 0;
        if (hasMinLength) strength++;
        if (hasLetters) strength++;
        if (hasNumbers) strength++;
        
        return {
            isValid: strength >= 3,
            strength: strength,
            message: 'Пароль должен содержать минимум 8 символов, буквы и цифры'
        };
    },
    
    confirmPassword: (value) => {
        const password = elements.passwordInput.value;
        return {
            isValid: value === password,
            message: 'Пароли не совпадают'
        };
    }
};

// Инициализация приложения
function init() {
    setupEventListeners();
    setupPhoneMask();
    loadBooks();
    startPeriodicUpdate();
    updateCharCounter();
    setTheme(localStorage.getItem('theme') || 'light');
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Навигация
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            scrollToSection(targetId);
            
            // Активный пункт меню
            elements.navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
    
    // Динамическая валидация формы
    elements.nameInput.addEventListener('input', () => validateField('name'));
    elements.emailInput.addEventListener('input', () => validateField('email'));
    elements.phoneInput.addEventListener('input', () => validateField('phone'));
    elements.birthdateInput.addEventListener('input', () => validateField('birthdate'));
    elements.passwordInput.addEventListener('input', () => {
        validateField('password');
        updatePasswordStrength();
    });
    elements.confirmPasswordInput.addEventListener('input', () => validateField('confirmPassword'));
    
    // Биография
    elements.bioTextarea.addEventListener('input', updateCharCounter);
    
    // Отправка формы
    elements.form.addEventListener('submit', handleFormSubmit);
    elements.resetBtn.addEventListener('click', resetForm);
    
    // Обновление книг
    elements.refreshBtn.addEventListener('click', () => {
        loadBooks(true);
    });
    
    // Переключение темы
    elements.themeBtn.addEventListener('click', toggleTheme);
    
    // Модальное окно
    elements.modalClose.addEventListener('click', closeModal);
    elements.modalOkBtn.addEventListener('click', closeModal);
    
    // Клик вне модального окна
    elements.successModal.addEventListener('click', (e) => {
        if (e.target === elements.successModal) {
            closeModal();
        }
    });
}

// Маска для телефона
function setupPhoneMask() {
    elements.phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.startsWith('7') || value.startsWith('8')) {
            value = value.substring(1);
        }
        
        if (value.length > 0) {
            value = '+7 (' + value;
            
            if (value.length > 7) {
                value = value.substring(0, 7) + ') ' + value.substring(7);
            }
            if (value.length > 12) {
                value = value.substring(0, 12) + '-' + value.substring(12);
            }
            if (value.length > 15) {
                value = value.substring(0, 15) + '-' + value.substring(15);
            }
            if (value.length > 18) {
                value = value.substring(0, 18);
            }
        }
        
        e.target.value = value;
    });
}

// Валидация поля
function validateField(fieldName) {
    const input = elements[`${fieldName}Input`];
    const value = input.value;
    const formGroup = input.closest('.form-group');
    const errorElement = formGroup.querySelector('.error-message');
    
    if (!value) {
        formGroup.classList.remove('valid', 'invalid');
        errorElement.textContent = '';
        return false;
    }
    
    const validator = validators[fieldName];
    const result = validator(value);
    
    if (fieldName === 'password' && result.strength !== undefined) {
        // Для пароля также обновляем силу
        return result.isValid;
    }
    
    if (result.isValid) {
        formGroup.classList.add('valid');
        formGroup.classList.remove('invalid');
        errorElement.textContent = '';
    } else {
        formGroup.classList.add('invalid');
        formGroup.classList.remove('valid');
        errorElement.textContent = result.message;
    }
    
    return result.isValid;
}

// Обновление силы пароля
function updatePasswordStrength() {
    const password = elements.passwordInput.value;
    const result = validators.password(password);
    
    let width = 0;
    let color = '#f72585';
    
    if (result.strength === 1) {
        width = 33;
        color = '#f72585';
    } else if (result.strength === 2) {
        width = 66;
        color = '#ff9e00';
    } else if (result.strength === 3) {
        width = 100;
        color = '#4cc9f0';
    }
    
    elements.strengthBar.style.width = `${width}%`;
    elements.strengthBar.style.backgroundColor = color;
}

// Обновление счетчика символов
function updateCharCounter() {
    const maxLength = 500;
    const currentLength = elements.bioTextarea.value.length;
    const remaining = maxLength - currentLength;
    
    elements.charCounter.textContent = remaining;
    
    if (remaining < 0) {
        elements.bioTextarea.value = elements.bioTextarea.value.substring(0, maxLength);
        elements.charCounter.textContent = 0;
    }
}

// Обработка отправки формы
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Валидация всех полей
    const fields = ['name', 'email', 'phone', 'birthdate', 'password', 'confirmPassword'];
    let isValid = true;
    
    fields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    if (!isValid) {
        showFormStatus('Пожалуйста, исправьте ошибки в форме', 'error');
        return;
    }
    
    // Подготовка данных
    const formData = {
        name: elements.nameInput.value,
        email: elements.emailInput.value,
        phone: elements.phoneInput.value,
        birthdate: elements.birthdateInput.value,
        preferences: Array.from(elements.form.preferences.selectedOptions).map(opt => opt.value),
        bio: elements.bioTextarea.value,
        newsletter: elements.form.newsletter.checked,
        registrationDate: new Date().toISOString()
    };
    
    // Блокировка кнопки отправки
    elements.submitBtn.disabled = true;
    elements.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
    
    try {
        // Отправка данных на сервер
        const response = await fetch(`${API_BASE}/registrations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Показ модального окна с данными
        showSuccessModal(formData);
        
        // Сброс формы
        resetForm();
        
        showFormStatus('Регистрация успешно завершена!', 'success');
        
    } catch (error) {
        console.error('Ошибка при отправке формы:', error);
        showFormStatus('Ошибка при отправке данных. Пожалуйста, попробуйте позже.', 'error');
    } finally {
        // Разблокировка кнопки
        elements.submitBtn.disabled = false;
        elements.submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Зарегистрироваться';
    }
}

// Сброс формы
function resetForm() {
    elements.form.reset();
    
    // Сброс классов валидации
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('valid', 'invalid');
        const errorElement = group.querySelector('.error-message');
        if (errorElement) errorElement.textContent = '';
    });
    
    // Сброс силы пароля
    elements.strengthBar.style.width = '0%';
    
    // Сброс счетчика символов
    updateCharCounter();
    
    // Скрыть статус
    elements.formStatus.textContent = '';
    elements.formStatus.className = 'form-status';
}

// Показать статус формы
function showFormStatus(message, type) {
    elements.formStatus.textContent = message;
    elements.formStatus.className = `form-status ${type}`;
    
    // Автоматическое скрытие
    setTimeout(() => {
        elements.formStatus.textContent = '';
        elements.formStatus.className = 'form-status';
    }, 5000);
}

// Загрузка книг
async function loadBooks(force = false) {
    if (!force) {
        elements.loadingSpinner.style.display = 'block';
        elements.booksContainer.innerHTML = '';
    }
    
    try {
        const response = await fetch(`${API_BASE}/books`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const books = await response.json();
        
        // Обновление времени последнего обновления
        const now = new Date();
        elements.lastUpdate.textContent = now.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Отрисовка книг
        renderBooks(books);
        
    } catch (error) {
        console.error('Ошибка при загрузке книг:', error);
        elements.booksContainer.innerHTML = `
            <div class="error-message full-width" style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #f72585; margin-bottom: 20px;"></i>
                <h3>Ошибка при загрузке данных</h3>
                <p>Пожалуйста, проверьте соединение с сервером</p>
                <button onclick="loadBooks(true)" class="btn btn-outline" style="margin-top: 20px;">
                    <i class="fas fa-redo"></i> Попробовать снова
                </button>
            </div>
        `;
    } finally {
        elements.loadingSpinner.style.display = 'none';
    }
}

// Отрисовка книг
function renderBooks(books) {
    elements.booksContainer.innerHTML = '';
    
    books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        
        // Случайный цвет для обложки
        const colors = [
            'linear-gradient(45deg, #4361ee, #4cc9f0)',
            'linear-gradient(45deg, #7209b7, #f72585)',
            'linear-gradient(45deg, #ff9e00, #ff0054)',
            'linear-gradient(45deg, #38b000, #70e000)',
            'linear-gradient(45deg, #5a189a, #9d4edd)'
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        bookCard.innerHTML = `
            <div class="book-cover" style="background: ${randomColor};">
                <div class="book-cover-content">
                    <i class="fas fa-book"></i>
                    <h3>${book.genre}</h3>
                </div>
            </div>
            <div class="book-details">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">${book.author}</p>
                <div class="book-meta">
                    <span class="book-price">${book.price}₽</span>
                    <div class="book-rating">
                        <i class="fas fa-star"></i>
                        <span>${book.rating}</span>
                    </div>
                </div>
                <p class="book-description">${book.description.substring(0, 100)}...</p>
                <div class="book-tags">
                    <span class="book-tag">${book.genre}</span>
                    <span class="book-tag">${book.pages} стр.</span>
                    <span class="book-tag">${book.year}</span>
                </div>
            </div>
        `;
        
        elements.booksContainer.appendChild(bookCard);
    });
}

// Периодическое обновление
function startPeriodicUpdate() {
    // Обновление каждые 5 минут (300000 мс)
    updateInterval = setInterval(() => {
        loadBooks(true);
        resetUpdateTimer();
    }, 300000);
    
    // Таймер обратного отсчета
    resetUpdateTimer();
    updateTimerInterval = setInterval(updateCountdown, 1000);
}

// Сброс таймера обновления
function resetUpdateTimer() {
    const nextUpdate = Date.now() + 300000;
    localStorage.setItem('nextUpdateTime', nextUpdate);
}

// Обновление обратного отсчета
function updateCountdown() {
    const nextUpdateTime = parseInt(localStorage.getItem('nextUpdateTime')) || Date.now() + 300000;
    const timeLeft = nextUpdateTime - Date.now();
    
    if (timeLeft <= 0) {
        elements.updateTimer.textContent = 'Обновление...';
        return;
    }
    
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    
    elements.updateTimer.textContent = `Следующее обновление через ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Показать модальное окно успеха
function showSuccessModal(formData) {
    elements.modalDetails.innerHTML = `
        <div><strong>Имя:</strong> ${formData.name}</div>
        <div><strong>Email:</strong> ${formData.email}</div>
        <div><strong>Телефон:</strong> ${formData.phone}</div>
        <div><strong>Дата рождения:</strong> ${new Date(formData.birthdate).toLocaleDateString('ru-RU')}</div>
        <div><strong>Предпочтения:</strong> ${formData.preferences.join(', ')}</div>
        <div><strong>Рассылка:</strong> ${formData.newsletter ? 'Да' : 'Нет'}</div>
        <div><strong>Дата регистрации:</strong> ${new Date(formData.registrationDate).toLocaleString('ru-RU')}</div>
    `;
    
    elements.successModal.classList.add('show');
}

// Закрыть модальное окно
function closeModal() {
    elements.successModal.classList.remove('show');
}

// Переключение темы
function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// Установка темы
function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Обновление иконки кнопки
    const icon = elements.themeBtn.querySelector('i');
    icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// Прокрутка к секции
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const sectionTop = section.offsetTop - headerHeight - 20;
        
        window.scrollTo({
            top: sectionTop,
            behavior: 'smooth'
        });
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', init);