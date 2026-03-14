// =======================
// КЛАСС (из ЛР-4)
// =======================
class Student {
    constructor(name, phone, agree) {
        this.name = name;
        this.phone = phone;
        this.agree = agree;
    }

    printInfo() {
        console.log(
            `Имя: ${this.name}, Телефон: ${this.phone}, Согласие: ${this.agree}`
        );
    }
}

// =======================
// ФОРМА + ВАЛИДАЦИЯ
// =======================
const form = document.getElementById("form");

if (form) {
    const nameInput = document.getElementById("name");
    const phoneInput = document.getElementById("phone");
    const agreeInput = document.getElementById("agree");

    const nameHint = document.getElementById("nameHint");
    const phoneHint = document.getElementById("phoneHint");

    let isNameValid = false;
    let isPhoneValid = false;

    // Проверка имени
    nameInput.addEventListener("input", () => {
        if (nameInput.value.length < 3) {
            nameHint.textContent = "Имя должно быть не короче 3 символов";
            nameHint.style.color = "red";
            isNameValid = false;
        } else {
            nameHint.textContent = "Имя корректно";
            nameHint.style.color = "green";
            isNameValid = true;
        }
    });

    // Проверка телефона
    phoneInput.addEventListener("input", () => {
        const phoneRegex = /^[0-9+]{6,}$/;

        if (!phoneRegex.test(phoneInput.value)) {
            phoneHint.textContent = "Неверный формат телефона";
            phoneHint.style.color = "red";
            isPhoneValid = false;
        } else {
            phoneHint.textContent = "Телефон корректен";
            phoneHint.style.color = "green";
            isPhoneValid = true;
        }
    });

    // Отправка формы
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!isNameValid || !isPhoneValid) {
            alert("Исправьте ошибки в форме");
            return;
        }

        const student = new Student(
            nameInput.value,
            phoneInput.value,
            agreeInput.checked
        );

        student.printInfo();

        try {
            await fetch("http://localhost:3000/requests", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(student)
            });

            alert("Заявка успешно отправлена");
            form.reset();
        } catch (error) {
            alert("Ошибка отправки данных");
            console.error(error);
        }
    });
}

// =======================
// ПРОГРАММЫ (GET)
// =======================
async function loadPrograms() {
    const list = document.getElementById("programsList");
    if (!list) return;

    try {
        const response = await fetch("http://localhost:3000/programs");

        if (!response.ok) {
            throw new Error("Ошибка получения данных");
        }

        const data = await response.json();

        list.innerHTML = "";

        data.programs.forEach(item => {
            const li = document.createElement("li");
            li.textContent = `${item.name} — ${item.level}`;
            list.appendChild(li);
        });

    } catch (error) {
        list.innerHTML = "Ошибка загрузки программ";
        console.error(error.message);
    }
}

// первая загрузка
loadPrograms();

// периодическое обновление (5 минут)
setInterval(loadPrograms, 300000);
