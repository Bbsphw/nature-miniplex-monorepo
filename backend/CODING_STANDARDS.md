# มาตรฐานการเขียนโค้ด (Coding Standards)

[⬅️ กลับหน้า Backend](./README.md) | [🏠 กลับสู่หน้าหลัก](../README.md)

เพื่อรักษาคุณภาพและความสม่ำเสมอของโค้ดในโปรเจกต์ Nature MiniPlex ทีมพัฒนาทุกคนจำเป็นต้องปฏิบัติตามมาตรฐานการเขียนโค้ดดังต่อไปนี้อย่างเคร่งครัด

---

## 1. กฎการตั้งชื่อ (Naming Conventions)

- **PascalCase**: ใช้สำหรับชื่อ Classes, Interfaces (นำหน้าด้วย `I`), Methods, Properties, Records, และ Enums
  ```csharp
  public class MovieService
  public interface IBookingRepository
  public decimal CalculateTotalAmount()
  ```
- **camelCase**: ใช้สำหรับ Local variables และ Method Parameters
  ```csharp
  var ticketPrice = 250m;
  public async Task GetMovieById(int movieId)
  ```
- **_camelCase**: ใช้สำหรับ Private readonly fields ในคลาส
  ```csharp
  private readonly IApplicationDbContext _context;
  ```

---

## 2. โครงสร้าง Clean Architecture

ห้ามทำลายกฎของ Clean Architecture อย่างเด็ดขาด:
- **Domain Layer**: ห้ามอ้างอิง (Reference) โปรเจกต์อื่น ห้ามใช้ `using Microsoft.EntityFrameworkCore` หรือเทคโนโลยีภายนอกอื่นๆ
- **Application Layer**: อ้างอิงได้แค่ `Domain` เท่านั้น ที่นี่คือที่อยู่ของ Business Logic และ Interfaces (เช่น `IApplicationDbContext`) ห้ามเชื่อมต่อ Database หรือ Third-party API ตรงๆ
- **Infrastructure Layer**: อ้างอิง `Application` เพื่อนำ Interface มา Implement (เช่น `ApplicationDbContext : IApplicationDbContext`) และจัดการ EF Core, JWT, อีเมล ฯลฯ
- **API Layer**: อ้างอิง `Application` และ `Infrastructure` ทำหน้าที่เป็นเพียงทางผ่าน (Entry point) และ Controller เท่านั้น ห้ามมี Business Logic ที่นี่

---

## 3. Dependency Injection (DI)

- ห้ามสร้างคลาส (new keyword) สำหรับ Service หรือ Repository ขึ้นมาเอง ต้องรับผ่าน Constructor เสมอ (Constructor Injection)
- หลีกเลี่ยงการ Inject `IConfiguration` เข้าไปใน Application/Domain ชั้นใน ให้ใช้ Pattern แบบ `IOptions<T>` แทน

---

## 4. การจัดการฐานข้อมูล (EF Core)

- **ห้ามใช้ Data Annotations**: ห้ามใช้ `[Required]`, `[MaxLength]`, `[Table]` ใน Entity Class บนชั้น Domain ให้ใช้ **Fluent API** (`IEntityTypeConfiguration`) บนชั้น Infrastructure เท่านั้น
- **No Tracking สำหรับ Read-Only**: ถ้าทำการดึงข้อมูลเพื่อมาแสดงผลอย่างเดียว (ไม่มีการแก้ไข) ต้องต่อท้ายด้วย `.AsNoTracking()` เสมอ เพื่อประหยัด Memory
  ```csharp
  var movies = await _context.Movies.AsNoTracking().ToListAsync(cancellationToken);
  ```

---

## 5. การใช้ Async / Await

- Method ที่มีการทำ I/O (Database, Network, File) ต้องเป็น `async Task` หรือ `async Task<T>` เสมอ
- ห้ามใช้ `.Result` หรือ `.Wait()` บน Task อย่างเด็ดขาดเพราะจะทำให้เกิด Deadlock
- ให้ส่งผ่าน `CancellationToken` ไปยังฟังก์ชันปลายทางเสมอ

---

## 6. การจัดการ Exception (Error Handling)

- ไม่ต้องเขียน `try-catch` ทุกที่ใน Controllers ระบบมี `ExceptionHandlingMiddleware` จัดการให้อยู่แล้ว
- ให้ Throw Custom Exception ที่มีความหมายตรงตัว เช่น `NotFoundException`, `ValidationException`, `ConcurrencyException` แล้ว Middleware จะจับคู่เข้ากับ HTTP Status Code ตามมาตรฐาน Problem Details (RFC 7807) เอง
