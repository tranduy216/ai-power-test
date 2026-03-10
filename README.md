# 🚗 Car Manager – Admin Page

A simple car management admin page built with **Kotlin Spring Boot** and **Thymeleaf** (MVC pattern).

---

## Features

- 🔐 **Login required** – session-based authentication
- 📋 **Car list** – view all cars in a table
- ➕ **Add car** – create new car entries
- ✏️ **Edit car** – update existing car details
- 🗑️ **Delete car** – remove cars with confirmation
- 🔍 **Search** – filter cars by name, brand, year, or color
- 💾 **JSON storage** – no database required, data stored in JSON files

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Kotlin |
| Framework | Spring Boot 3.2 |
| Template Engine | Thymeleaf |
| Build Tool | Gradle (Kotlin DSL) |
| Storage | JSON files |

---

## Local Development

### Prerequisites

- Java 17+
- Gradle 8+

### Running

```bash
# Build and run
gradle bootRun

# Or build a JAR and run it
gradle bootJar
java -jar build/libs/car-manager-0.0.1-SNAPSHOT.jar
```

Open **http://localhost:8080** in your browser.

---

## Test Accounts

| Username | Password | Full Name |
|---|---|---|
| admin | admin123 | Administrator |
| john | john123 | John Doe |
| jane | jane123 | Jane Smith |
| mike | mike123 | Mike Johnson |
| sarah | sarah123 | Sarah Williams |

---

## Project Structure

```
.
├── build.gradle.kts
├── settings.gradle.kts
└── src/main/
    ├── kotlin/com/carmanager/
    │   ├── CarManagerApplication.kt
    │   ├── config/
    │   │   ├── AuthInterceptor.kt
    │   │   └── WebConfig.kt
    │   ├── controller/
    │   │   ├── AuthController.kt
    │   │   ├── CarController.kt
    │   │   └── HomeController.kt
    │   ├── model/
    │   │   ├── Account.kt
    │   │   └── Car.kt
    │   └── repository/
    │       ├── AccountRepository.kt
    │       └── CarRepository.kt
    └── resources/
        ├── application.properties
        ├── cars.json
        ├── accounts.json
        ├── static/css/style.css
        └── templates/
            ├── login.html
            └── cars/
                ├── list.html
                └── form.html
```

---

## License

MIT
