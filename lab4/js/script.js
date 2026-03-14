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

document.getElementById("form").addEventListener("submit", function (e) {
    e.preventDefault();

    const student = new Student(
        document.getElementById("name").value,
        document.getElementById("phone").value,
        document.getElementById("agree").checked
    );

    student.printInfo();
});