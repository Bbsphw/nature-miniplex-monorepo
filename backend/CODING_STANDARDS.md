# 📐 Nature MiniPlex - Coding Standards & Best Practices Specification

[⬅️ กลับสู่ Backend README](./README.md) | [🏛️ Architecture Specs](./ARCHITECTURE.md) | [📚 API Documentation](./API_DOCS.md)

เพื่อรักษาคุณภาพ ความสม่ำเสมอ และความง่ายในการบำรุงรักษาซอร์สโค้ด (Maintainability) ของระบบ **Nature MiniPlex Backend** ทีมพัฒนาทุกคนต้องปฏิบัติตามมาตรฐานการเขียนโค้ดดังต่อไปนี้อย่างเคร่งครัด

---

## 1. 🏷️ กฎการตั้งชื่อ (Naming Conventions)

- **PascalCase:** ใช้สำหรับ Classes, Interfaces (นำหน้าด้วย `I`), Methods, Properties, Records, และ Enums
  ```csharp
  public class MovieService : IMovieService { ... }
  public interface IBookingRepository { ... }
  public decimal CalculateTotalAmount() { ... }
  ```
- **camelCase:** ใช้สำหรับ Local Variables และ Method Parameters
  ```csharp
  var ticketPrice = 250m;
  public async Task<MovieDto?> GetMovieByIdAsync(int movieId, CancellationToken cancellationToken)
  ```
- **_camelCase:** ใช้สำหรับ Private Readonly Fields ใน Class (Constructor Injection)
  ```csharp
  private readonly IApplicationDbContext _context;
  private readonly ILogger<CreateBookingCommandHandler> _logger;
  ```

---

## 2. 🏛️ กฎเลเยอร์ Clean Architecture (Layer Boundary Rules)

ต้องยึดถือแนวทาง **Dependency Rule** อย่างเคร่งครัด:

```text
[ API Layer ] -> [ Infrastructure Layer ] -> [ Application Layer ] -> [ Domain Layer ]
```

1. **Domain Layer (`Core/Domain`):**
   - **ห้าม** มี Dependency ไปยังโปรเจกต์อื่นเด็ดขาด
   - **ห้าม** ใช้ `using Microsoft.EntityFrameworkCore` หรือ Third-party Libraries ที่เกี่ยวข้องกับ I/O
2. **Application Layer (`Core/Application`):**
   - อ้างอิงได้เฉพาะ `Domain` เท่านั้น
   - เก็บ Use Cases, CQRS Handlers, DTOs, และ Interfaces (`IBookingRepository`, `IUnitOfWork`)
   - **ห้าม** มีโค้ดต่อ Database หรือ HTTP Client ตรงๆ
3. **Infrastructure Layer (`Infrastructure`):**
   - อ้างอิง `Application` เพื่อนำ Interfaces มา Implement
   - จัดการ EF Core DbContext, Migrations, JWT Auth, และ External Integrations
4. **API Layer (`API`):**
   - อ้างอิง `Application` และ `Infrastructure`
   - ทำหน้าที่เป็นเพียง Presentation Entrypoint, Routing, และ Middleware Pipeline Setup

---

## 3. 💉 Dependency Injection (DI) & SOLID Principles

- **Constructor Injection Only:** ห้ามสร้าง Object ของ Service/Repository ขึ้นมาเองด้วยคีย์เวิร์ด `new` ต้องรับผ่าน Constructor เสมอ
- **Single Responsibility Principle (SRP):** 1 Handler / 1 Service ต้องทำหน้าที่เพียงอย่างเดียว
- **Modular DI Registration:** ใช้ Extension Methods ในการลงทะเบียน Services ตามแต่ละ Layer (เช่น `services.AddApplicationServices()`, `services.AddInfrastructureServices(configuration)`)

---

## 4. 🗄️ การใช้งาน Entity Framework Core 8 Best Practices

1. **Fluent API Over Data Annotations:** 
   - **ห้าม** ใช้ Data Annotations (เช่น `[Required]`, `[MaxLength]`, `[Table]`) ใน Entity Classes บน Domain Layer
   - ให้เขียน Fluent API Configuration ในคลาสที่สืบทอดจาก `IEntityTypeConfiguration<T>` บนเลเยอร์ Infrastructure เท่านั้น
2. **AsNoTracking สำหรับ Read Operations:**
   - ใน Queries ทั้งหมดที่ไม่มีการแก้ไขข้อมูล ต้องใส่ `.AsNoTracking()` เสมอ เพื่อประหยัด Memory และลด Overhead ของ Change Tracker
   ```csharp
   var movies = await _context.Movies
       .AsNoTracking()
       .Where(m => m.IsActive)
       .ToListAsync(cancellationToken);
   ```
3. **Explicit Database Indexing:** เพิ่ม Database Index บน Foreign Key Fields และ Fields ที่ใช้ค้นหาเป็นประจำ

---

## 5. ⚡ Async / Await Guidelines

- ทุก Method ที่มีการทำงานทางด้าน I/O (Database, Network, File) ต้องเป็น `async Task` หรือ `async Task<T>` เสมอ
- **ห้าม** ใช้ `.Result` หรือ `.Wait()` บน Task เด็ดขาด เพราะจะส่งผลให้เกิด Deadlock ใน Thread Pool
- ต้องส่งต่อ `CancellationToken` ไปยัง Async Methods ปลายทางเสมอ

---

## 6. ⛔ Centralized Error Handling (RFC 7807)

- **ห้าม** เขียน `try-catch` ซ้ำซ้อนใน Controllers ให้ปล่อยให้ Exception หลุดมายัง `ExceptionHandlingMiddleware`
- ใช้ Custom Domain Exceptions ที่มีความหมายชัดเจน (เช่น `DomainException`, `NotFoundException`, `ValidationException`)
- Middleware จะแปลง Exception ทั้งหมดเป็นฟอร์แมต **RFC 7807 (Problem Details)** โดยอัตโนมัติ
