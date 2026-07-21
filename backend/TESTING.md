# 🧪 Nature MiniPlex - Testing Strategy & Quality Assurance Guide

[⬅️ กลับสู่ Backend README](./README.md) | [🏛️ Architecture Specs](./ARCHITECTURE.md) | [📚 API Documentation](./API_DOCS.md)

เอกสารฉบับนี้กำหนดมาตรฐานการทดสอบระบบ (Testing Strategy), แนวทางการเขียน Unit Tests, Integration Tests, และการวัดผล Test Coverage สำหรับโปรเจกต์ **Nature MiniPlex Backend**

---

## 1. 🏗️ โครงสร้างชุดทดสอบ (Test Project Architecture)

ชุดทดสอบในระบบแบ่งออกเป็น 3 ระดับหลักตาม Testing Pyramid:

```text
                     / \
                    /   \
                   / API \   <- Integration Tests (WebApplicationFactory)
                  /------- \
                 /   App    \  <- Unit Tests (MediatR Handlers, Moq, FluentAssertions)
                /------------\
               /    Domain    \ <- Unit Tests (Pure Entities Rules)
              /----------------\
```

1. **`tests/NatureMiniPlex.Domain.UnitTests`:**
   - **ขอบเขต:** ทดสอบ Business Logic ใน Entities ล้วนๆ (เช่น `showtime.EnsureCanBookOrCancel()`)
   - **ลักษณะ:** รันเร็วที่สุด ไม่มี External Dependencies หรือ Mocks
2. **`tests/NatureMiniPlex.Application.UnitTests`:**
   - **ขอบเขต:** ทดสอบ CQRS Handlers (`CreateBookingCommandHandler`), Validators, และ Application Services
   - **ลักษณะ:** ใช้ **Moq** ในการจำลอง Interfaces (`IBookingRepository`, `IUnitOfWork`, `IEmailService`)
3. **`tests/NatureMiniPlex.API.IntegrationTests`:**
   - **ขอบเขต:** ทดสอบ End-to-End HTTP Requests ตั้งแต่ Controller Pipeline ทะลุลงไปถึง Database Layer
   - **ลักษณะ:** ใช้ `WebApplicationFactory` และ `Microsoft.AspNetCore.Mvc.Testing` ในการจำลอง HTTP Server และใช้ In-Memory Database / Testcontainers

---

## 2. ⚡ คำสั่งรันชุดทดสอบ (Execution Commands)

```bash
# รันชุดทดสอบทั้งหมดใน Solution (42 Passed)
dotnet test

# รันชุดทดสอบพร้อมแสดงข้อมูลอย่างละเอียด (Detailed Verbosity)
dotnet test --logger "console;verbosity=detailed"

# รันเฉพาะ Domain Unit Tests
dotnet test tests/NatureMiniPlex.Domain.UnitTests/

# รันเฉพาะ Application Unit Tests
dotnet test tests/NatureMiniPlex.Application.UnitTests/

# รันเฉพาะ API Integration Tests
dotnet test tests/NatureMiniPlex.API.IntegrationTests/
```

---

## 3. 📐 มาตรฐานการเขียน Unit Test (AAA Pattern)

การเขียน Test Method ทั้งหมดต้องปฏิบัติตาม **Arrange, Act, Assert (AAA)** Pattern:

```csharp
[Fact]
public async Task Handle_ShouldThrowDomainException_WhenShowtimeNotFound()
{
    // 1. Arrange: เตรียม Mock และ Input Data
    var mockShowtimeRepo = new Mock<IShowtimeRepository>();
    mockShowtimeRepo.Setup(x => x.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
                    .ReturnsAsync((Showtime?)null);

    var handler = new CreateBookingCommandHandler(
        mockShowtimeRepo.Object, 
        Mock.Of<IBookingRepository>(), 
        Mock.Of<IRepository<Customer>>(), 
        Mock.Of<IEmailService>(), 
        Mock.Of<IUnitOfWork>());

    var command = new CreateBookingCommand(1, "0812345678", "test@example.com", new List<int> { 25 });

    // 2. Act & 3. Assert: เรียกใช้งานและตรวจสอบว่า Throw DomainException หรือไม่
    await Assert.ThrowsAsync<DomainException>(() => handler.Handle(command, CancellationToken.None));
}
```

---

## 4. 🌐 โครงสร้าง Integration Testing (WebApplicationFactory & Isolation)

```csharp
public class BookingsControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public BookingsControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateBooking_ShouldReturnCreated_WhenValidRequest()
    {
        // Act
        var response = await _client.PostAsJsonAsync("/api/bookings", new {
            showtimeId = 1,
            phoneNumber = "0812345678",
            seatIds = new[] { 10 }
        });

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }
}
```

---

## 5. 🎯 Test Coverage & Quality Gates

- **Unit Test Pass Rate Requirement:** 100% Pass ก่อนทุก Pull Request จะถูก Merge
- **Code Coverage Target:** 
  - Domain Layer: >= 90%
  - Application Layer (Handlers & Validation): >= 85%
  - API Layer (Integration Tests): >= 80%
