# คู่มือการทดสอบระบบ (Testing Guide)

[⬅️ กลับหน้า Backend](./README.md) | [🏠 กลับสู่หน้าหลัก](../README.md)

ระบบ Nature MiniPlex ให้ความสำคัญกับคุณภาพของซอร์สโค้ด ดังนั้นทุกครั้งที่มีการเขียนฟีเจอร์ใหม่หรือแก้ไขบั๊ก จะต้องมีกระบวนการทดสอบอัตโนมัติควบคู่เสมอ

---

## 1. โครงสร้างโปรเจกต์ทดสอบ (Test Projects)

โปรเจกต์ทดสอบถูกเก็บไว้ในโฟลเดอร์ `backend/tests/` ประกอบด้วย 3 ระดับหลัก:
1. **`NatureMiniPlex.Domain.UnitTests`**:
   - หน้าที่: ทดสอบ Business Rules หรือตรรกะที่อยู่ใน Entities ล้วนๆ
   - ลักษณะ: เร็วที่สุด ไม่มี Dependencies ภายนอก
2. **`NatureMiniPlex.Application.UnitTests`**:
   - หน้าที่: ทดสอบ Use Cases, Command Handlers และ Services
   - ลักษณะ: ใช้การสร้าง **Mocks** (เช่น 라이บรารี `Moq` หรือ `NSubstitute`) แทนการต่อ Database หรือ API จริง
3. **`NatureMiniPlex.API.IntegrationTests`**:
   - หน้าที่: ทดสอบรวมตั้งแต่ Controller ทะลุลงไปถึง Database 
   - ลักษณะ: ใช้ `WebApplicationFactory` เพื่อจำลอง HTTP Server และสร้าง In-Memory Database หรือ Testcontainers เพื่อจำลองสภาพแวดล้อมเสมือนจริง

---

## 2. วิธีการรันเทสต์ (Running Tests)

สำหรับการรันชุดทดสอบทั้งหมดในโปรเจกต์ (เปิด Terminal ไปที่โฟลเดอร์ `backend/`):
```bash
# CMD / PowerShell / Bash (WSL)
dotnet test
```

หากต้องการดูรายละเอียด (Verbosity) เพิ่มเติม:
```bash
# CMD / PowerShell / Bash (WSL)
dotnet test --logger "console;verbosity=detailed"
```

รันเฉพาะ Unit Tests ชั้น Application:
```bash
# CMD / PowerShell
dotnet test tests\NatureMiniPlex.Application.UnitTests\

# Bash (WSL / Linux / macOS)
dotnet test tests/NatureMiniPlex.Application.UnitTests/
```

---

## 3. มาตรฐานการเขียน Unit Test (AAA Pattern)

การเขียนโค้ดเพื่อทดสอบต้องยึดหลัก **Arrange, Act, Assert** เพื่อความอ่านง่าย:

```csharp
[Fact]
public void CalculateTotalPrice_ShouldReturnCorrectValue()
{
    // 1. Arrange: เตรียมข้อมูลและตัวแปร
    var showtimePrice = 200m;
    var seatCount = 2;

    // 2. Act: เรียกใช้ฟังก์ชันที่ต้องการทดสอบ
    var total = BookingService.Calculate(showtimePrice, seatCount);

    // 3. Assert: ตรวจสอบผลลัพธ์
    Assert.Equal(400m, total);
}
```

---

## 4. โครงสร้าง Integration Tests (End-to-End)

สำหรับโปรเจกต์ Nature MiniPlex มีการใช้ **`xUnit`** ร่วมกับ **`Microsoft.AspNetCore.Mvc.Testing`** (`WebApplicationFactory`) เพื่อทำ Integration Testing โดยมีโครงสร้างดังนี้:

1. **CustomWebApplicationFactory**
   - ทำหน้าที่ Overrides การทำงานของ Services ต่างๆ ใน `Program.cs`
   - **Database:** ปัจจุบันมีการตั้งค่าให้ใช้ `InMemoryDatabase` แทน SQL Server หรือ Testcontainers เพื่อความรวดเร็วและแก้ปัญหาคอขวดของการจำลอง Docker ใน Environment บางประเภท (เช่น WSL)
   - มีการเขียน `ApplicationDbContext.SaveChangesAsync` Override พิเศษเพื่อเติมค่า `RowVersion` อัตโนมัติเวลาทำ In-Memory (เพื่อเลี่ยงบั๊ก Missing Properties)

2. **การจำลองสิทธิ์ผู้ใช้งาน (Mock Authentication)**
   - ระบบมีการเพิ่ม `TestAuthHandler` ເพื่อจำลอง Token แบบง่าย
   - โดยสามารถกำหนด Role ผ่าน Header ได้เลย เช่น `_client.DefaultRequestHeaders.Add("X-Test-Role", "Owner");`
   - หากไม่ต้องการจำลอง Auth สามารถงดส่ง Header `Authorization: Test` ได้เลย

3. **การล้างข้อมูล (State Isolation)**
   - ในทุกๆ คลาสของ Test จะต้องประกาศใช้ `IAsyncLifetime` และทำการสร้าง Database ใหม่ใน `InitializeAsync` (`await dbContext.Database.EnsureDeletedAsync(); await dbContext.Database.EnsureCreatedAsync();`) 
   - อย่าลืมใช้ `dbContext.ChangeTracker.Clear();` ก่อน Assert ข้อมูลที่อัปเดตผ่าน API ทุกครั้ง ป้องกันการดึงค่าจาก Cache เดิม

---

## 5. ข้อควรระวัง (Gotchas)

- **.NET Runtime**: การจะรัน `dotnet test` สำเร็จ เครื่องของคุณต้องมี **.NET 8.0 Runtime** ติดตั้งอยู่ หากมีเวอร์ชันที่สูงกว่าแต่ไม่มีเวอร์ชัน 8 อาจเกิดข้อผิดพลาด `Testhost process exited with error` ให้อัปเดตแพ็กเกจหรือรันด้วย `--roll-forward Major`
- **WSL / Docker Constraints**: เดิมที Integration Test ควรจะใช้ `Testcontainers` เพื่อยก Database จริงขึ้นมา แต่ในบาง Environment (โดยเฉพาะ WSL2 บน Windows) อาจกิน RAM สูงหรือ Port ชนกันได้ จึงเปลี่ยนมาใช้ In-Memory เป็นทางเลือกหลักแทน
