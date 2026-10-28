# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Spring Boot 4 app on Java 17+. Both Maven and Gradle builds exist; Maven is the primary one (CSS compile and lint checks are Maven-only).

```bash
./mvnw spring-boot:run                 # run on http://localhost:8080 (H2 in-memory)
./mvnw -B verify                       # full build as CI runs it (format check, nohttp checkstyle, tests, jacoco)
./mvnw test                            # all tests
./mvnw test -Dtest=OwnerControllerTests                      # one test class
./mvnw test -Dtest=OwnerControllerTests#processCreationFormSuccess   # one test method
./mvnw spring-javaformat:apply         # fix formatting (the build fails on unformatted code)
./mvnw package -P css                  # recompile src/main/scss -> static/resources/css/petclinic.css
./gradlew build / ./gradlew bootRun    # Gradle equivalents
```

Run against a real DB with a profile: `docker compose up mysql` (or `postgres`), then `./mvnw spring-boot:run -Dspring-boot.run.profiles=mysql` (or `postgres`).

## Build checks that commonly fail

- **spring-javaformat** runs in the `validate` phase: tabs for indentation, Spring formatting style. Run `spring-javaformat:apply` before building.
- **nohttp checkstyle** scans every file in the repo and rejects plain `http://` URLs (suppressions in `src/checkstyle/`).
- **`I18nPropertiesSyncTest`** fails if a Thymeleaf template contains literal text not using `#{...}` / `th:text`, or if a key in `messages.properties` is missing from any `messages_*.properties` file. Any new UI string needs a key added to every language file.
- `MySqlIntegrationTests` (Testcontainers) and `PostgresIntegrationTests` (Docker Compose) are skipped automatically when Docker isn't available.

## Architecture

Classic layered-by-feature Spring MVC + Thymeleaf + Spring Data JPA app under `org.springframework.samples.petclinic`:

- `model/` — JPA base classes: `BaseEntity` (id) → `NamedEntity` (name), `Person` (first/last name).
- `owner/` — the `Owner` aggregate: `Owner` → `Pet` → `Visit`, plus `PetType`. Owner/Pet use `CascadeType.ALL` + EAGER fetch, so pets and visits are saved via `OwnerRepository.save(owner)`; there are no Pet/Visit repositories. `PetController` and `VisitController` load the owner via `@ModelAttribute` methods and mutate it. `PetTypeFormatter` converts form strings to `PetType`; `PetValidator` is a custom Spring `Validator`.
- `vet/` — read-only vet listing (HTML and JSON/XML via `Vets` wrapper); `VetRepository` results are cached in the JCache `vets` cache (`system/CacheConfiguration`).
- `system/` — cross-cutting config: locale switching via `?lang=xx` stored in session (`WebConfiguration`), caching, welcome page, and `CrashController` (deliberately throws to demo the error page).

Controllers are package-private, use `@InitBinder` to disallow binding `id` fields, and paginate list pages (5 per page) with redirects back to page 1 when the requested page is out of range.

### Database

- No Hibernate DDL (`ddl-auto=none`). Schema and seed data come from `src/main/resources/db/{h2,mysql,postgres}/schema.sql` and `data.sql`, chosen by the `database` property (set by the `mysql`/`postgres` profiles).
- **Keep these three schema files and the entity validation annotations in sync.** Bean Validation `@Size` limits on entities must match column lengths in the schemas, otherwise oversized input causes HTTP 500s instead of form errors.
- Physical naming is snake_case (`PhysicalNamingStrategySnakeCaseImpl`); `open-in-view` is disabled, so lazy relations must be loaded within the repository/transaction.

### Tests

- Controller tests use `@WebMvcTest` with `@MockitoBean` repositories.
- `ClinicServiceTests` uses `@DataJpaTest` against H2.
- `PetClinicIntegrationTests`, `MysqlTestApplication`, and `PostgresIntegrationTests` have `main()` methods so they can be launched from the IDE as dev apps against each database.

## Contributing

Upstream requires a `Signed-off-by` trailer (DCO) on every commit. Editor settings are in `.editorconfig`.
