---
description: "Backend agent customization for ASP.NET Core 8 Clean Architecture. Enforces CQRS patterns, Action/Resource-based RBAC, Row-Level Security (RLS), and database concurrency safety."
tech_stack: "ASP.NET Core 8, Clean Architecture, CQRS/MediatR, Entity Framework Core 8, SQL Server 2022"
---

# 🏛️ Backend Agent Customization — ASP.NET Core 8 Clean Architecture

**See also:** [Root AGENTS.md](../AGENTS.md) for global monorepo rules.

---

## 🎯 Primary Responsibilities

When working in `/backend/`, agents MUST enforce:

1. ✅ **Clean Architecture** (4-layer isolation: Domain → Application → Infrastructure → API)
2. ✅ **CQRS Pattern** with MediatR (Commands separate from Queries)
3. ✅ **Action/Resource-based RBAC** (NOT hardcoded role strings)
4. ✅ **Row-Level Security (RLS)** for data access isolation
5. ✅ **Transaction Safety** to prevent race conditions and double-bookings
6. ✅ **Tech-Thai documentation** for all comments and generated docs

---

## 🏗️ Clean Architecture Layer Enforcement

### Layer Isolation Rules (Dependency Inversion)

```
┌─────────────────────────────────────┐
│  API Layer (Controllers, Middleware) │ ← Can reference all below
├─────────────────────────────────────┤
│  Application Layer (CQRS, DTOs)    │ ← References Domain + Infrastructure (via DIP)
├─────────────────────────────────────┤
│  Domain Layer (Entities, Exceptions)│ ← ZERO external dependencies ✅
├─────────────────────────────────────┤
│  Infrastructure Layer (EF, Auth)    │ ← Implementation details
└─────────────────────────────────────┘
```

### Enforcement Checklist

- ❌ **FORBIDDEN:** Domain entities referencing `DbContext`, `HttpClient`, `IMemoryCache`
- ✅ **REQUIRED:** Domain exceptions (`DomainException`, `ConcurrencyException`, `ValidationException`)
- ✅ **REQUIRED:** Dependency injection through Application Layer interfaces
- ✅ **REQUIRED:** Custom exception middleware converts domain exceptions → RFC 7807 Problem Details

### File Location Standards

```
backend/
├── src/
│   ├── Core/
│   │   ├── Domain/          # ← Domain Entities, Enums, Custom Exceptions (NO external refs)
│   │   └── Application/     # ← CQRS Handlers, DTOs, Validators (references Domain)
│   ├── Infrastructure/      # ← EF Core, Auth, Repositories (implements Application Interfaces)
│   └── API/                 # ← Controllers, Middleware, Exception Handlers
└── tests/
    ├── Core.Tests/          # ← Unit tests for Application & Domain logic
    └── Infrastructure.Tests/ # ← Integration tests with real/in-memory DB
```

---

## ⚙️ CQRS & MediatR Implementation

### Command Handlers (Write Operations)

**Pattern:**
```csharp
// Tech-Thai comments for all command handlers
public class CreateBookingCommandHandler : IRequestHandler<CreateBookingCommand, BookingDto>
{
    private readonly IBookingRepository _bookingRepo;
    private readonly IPermissionService _permissionService;
    private readonly ICurrentUserService _currentUserService;
    
    public async Task<BookingDto> Handle(CreateBookingCommand request, CancellationToken ct)
    {
        // 1. ตรวจสอบสิทธิ์ของผู้ใช้ (Verify user permissions)
        await _permissionService.ThrowIfUnauthorized(request, ct);
        
        // 2. ตรวจสอบ Business Rules (Validate booking constraints)
        // ❌ ห้ามจองเกิน 4 ที่นั่ง (Cannot book > 4 seats)
        if (request.Seats.Count > 4)
            throw new ValidationException("ไม่สามารถจองเกิน 4 ที่นั่งได้");
        
        // 3. ตรวจสอบ Row-Level Security (Verify RLS context)
        // - Cinema Manager: กรรม showtime.CinemaId == currentUser.CinemaId
        // - System Admin: bypass RLS
        
        // 4. บันทึกข้อมูล (Persist with transaction lock)
        return await _bookingRepo.CreateAsync(booking, ct);
    }
}
```

### Query Handlers (Read Operations)

**Pattern:**
```csharp
public class GetShowtimeSeatsQueryHandler : IRequestHandler<GetShowtimeSeatsQuery, ShowtimeSeatsDto>
{
    private readonly IShowtimeRepository _showtimeRepo;
    
    public async Task<ShowtimeSeatsDto> Handle(GetShowtimeSeatsQuery request, CancellationToken ct)
    {
        // 1. ตรวจสอบ Business Logic (Validate data access logic)
        var showtime = await _showtimeRepo.GetByIdAsync(request.ShowtimeId, ct);
        if (showtime == null)
            throw new NotFoundException("ไม่พบรอบฉายนี้ในระบบ");
        
        // 2. เรียกใช้ EF Core Repository (return cached/fresh data)
        return MapToDto(showtime);
    }
}
```

### Validation with FluentValidation

**Pattern:**
```csharp
public class CreateBookingCommandValidator : AbstractValidator<CreateBookingCommand>
{
    public CreateBookingCommandValidator()
    {
        // ตรวจสอบว่า ShowtimeId ต้องมีค่า (ShowtimeId is required)
        RuleFor(x => x.ShowtimeId).GreaterThan(0);
        
        // ตรวจสอบจำนวนที่นั่ง 1-4 ที่นั่ง (Seat count must be 1-4)
        RuleFor(x => x.Seats.Count)
            .InclusiveBetween(1, 4)
            .WithMessage("ต้องเลือกที่นั่ง 1-4 ที่นั่ง");
    }
}
```

---

## 🔐 Action/Resource-Based RBAC (NOT Hardcoded Roles)

### CRITICAL: Ban Hardcoded Role Strings

❌ **FORBIDDEN Pattern:**
```csharp
[Authorize(Roles = "CINEMA_MANAGER,SYSTEM_ADMIN")] // ❌ Hardcoded roles
public IActionResult GetBookings() { }
```

✅ **REQUIRED Pattern:**
```csharp
[HasPermission("bookings:read:assigned_cinema")] // ✅ Action/Resource-based permission
public IActionResult GetBookings() { }
```

### Permission Model Structure

**Database Schema:**
```
Users (id, username, password_hash, cinema_id)
  ↓
UserRoles (user_id → role_id) [Many-to-Many]
  ↓
Roles (id, name: "CINEMA_MANAGER", "COUNTER_STAFF")
  ↓
RolePermissions (role_id → permission_id) [Many-to-Many]
  ↓
Permissions (id, action_resource: "bookings:read:assigned_cinema")
```

### Permission Examples

| Permission String | Actor | Scope | Meaning |
| --- | --- | --- | --- |
| `bookings:read:assigned_cinema` | Cinema Manager | Limited | Read bookings for assigned cinema only |
| `bookings:read:any` | System Admin | Unlimited | Read all bookings in system |
| `bookings:cancel:assigned_cinema` | Cinema Manager | Limited | Cancel bookings in assigned cinema |
| `bookings:cancel:any` | System Admin | Unlimited | Cancel any booking (RLS check still applies) |
| `showtime:create` | Cinema Manager | Cinema-scoped | Create new showtimes |
| `movie:delete` | System Admin | System-wide | Delete movies from catalog |

### Custom Authorization Handler

**Pattern:**
```csharp
public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        // 1. ขึ้นขรัด JWT Claims (Extract JWT claims for current user)
        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
        {
            context.Fail();
            return;
        }
        
        // 2. เรียกใช้ IPermissionService เพื่อตรวจสอบสิทธิ์ (Query permission service)
        var hasPermission = await _permissionService.HasPermissionAsync(
            int.Parse(userId), 
            requirement.PermissionString
        );
        
        if (hasPermission)
            context.Succeed(requirement);
        else
            context.Fail();
    }
}
```

---

## 🛡️ Row-Level Security (RLS) — Data Access Isolation

### RLS Rule Enforcement

**For `CancelBookingCommand` (Real Example from SECURITY.md):**

| Actor Type | Authentication | Permission | RLS Check | Result |
| --- | --- | --- | --- | --- |
| **External Customer** | Phone Number | N/A | `booking.Customer.PhoneNumber == providedPhoneNumber` | ✅ Can cancel own bookings only |
| **Cinema Manager** | JWT + Staff credentials | `bookings:cancel:assigned_cinema` | `showtime.CinemaId == currentUser.CinemaId` | ✅ Can cancel bookings in assigned cinema |
| **System Admin** | JWT + Admin credentials | `bookings:cancel:any` | **(RLS bypassed)** | ✅ Can cancel any booking system-wide |

### RLS Implementation Pattern

```csharp
public class CancelBookingCommandHandler : IRequestHandler<CancelBookingCommand>
{
    private readonly ICurrentUserService _currentUserService;
    private readonly IBookingRepository _bookingRepo;
    
    public async Task Handle(CancelBookingCommand request, CancellationToken ct)
    {
        // 1. ดึงข้อมูลการจอง (Fetch booking from database)
        var booking = await _bookingRepo.GetByIdAsync(request.BookingId, ct);
        if (booking == null)
            throw new NotFoundException("ไม่พบรายการจองนี้");
        
        // 2. ตรวจสอบ RLS บน Context ของผู้ร้องขอ (Apply RLS rules based on actor type)
        if (_currentUserService.IsStaff) // Admin/Manager
        {
            // Cinema Manager: ต้องเป็นสาขาเดียวกัน (Verify cinema ownership)
            if (_currentUserService.Role == "CINEMA_MANAGER" && 
                booking.Showtime.CinemaId != _currentUserService.CinemaId)
                throw new ForbiddenException("ไม่มีสิทธิ์ยกเลิกการจองในสาขานี้");
        }
        else // External Customer
        {
            // ยืนยันเบอร์โทร (Verify phone number ownership)
            if (booking.Customer.PhoneNumber != request.CustomerPhoneNumber)
                throw new ForbiddenException("เบอร์โทรศัพท์ไม่ตรงกับรายการจอง");
        }
        
        // 3. ดำเนินการยกเลิก (Proceed with cancellation)
        await _bookingRepo.CancelAsync(booking, ct);
    }
}
```

---

## 🔒 Transaction Safety & Concurrency Protection

### SRS Requirement (Double-Booking Prevention)

**NFR2.2:** ระบบต้องป้องกัน Race Condition 100% ด้วย **Optimistic Concurrency Control** ผ่าน EF Core `RowVersion`

### Multi-Layer Concurrency Strategy

```
Layer 1: Database Unique Index (Ultimate Guardian)
├── Filtered Unique Index: [IX_BookingItem_Showtime_Seat_Active]
├── Filter Condition: [ItemStatus] = 1 (Active = 1)
└── Prevents duplicate seat bookings at DB level

Layer 2: EF Core Optimistic Concurrency
├── RowVersion column on BookingItem
├── User A reads RowVersion=1
├── User B reads RowVersion=1, writes, increments to RowVersion=2
└── User A tries to write with RowVersion=1 → DbUpdateConcurrencyException

Layer 3: Application-Level Validation
├── Validate seat availability before mutation
├── Check business rules (max 4 seats, etc.)
└── Throw ValidationException early (before DB round-trip)
```

### EF Core Configuration (Entity Configuration)

```csharp
// Infrastructure/Persistence/EntityConfigurations/BookingItemConfiguration.cs
public class BookingItemConfiguration : IEntityTypeConfiguration<BookingItem>
{
    public void Configure(EntityTypeBuilder<BookingItem> builder)
    {
        // 1. ระบุคอลัมน์ RowVersion สำหรับ Optimistic Concurrency
        builder.Property(x => x.RowVersion)
            .IsRowVersion()
            .HasColumnName("RowVersion");
        
        // 2. สร้าง Filtered Unique Index เพื่อป้องกัน Double-Booking
        // → ห้ามเลือกที่นั่งเดียวกัน ในรอบฉายเดียวกัน พร้อมสถานะ Active
        builder.HasIndex(x => new { x.ShowtimeId, x.SeatId })
            .IsUnique()
            .HasDatabaseName("IX_BookingItem_Showtime_Seat_Active")
            .HasFilter("[ItemStatus] = 1"); // ItemStatus.Active = 1
        
        // 3. กำหนด Concurrency Token (Specify concurrency token)
        builder.Property(x => x.RowVersion).IsConcurrencyToken();
    }
}
```

### Exception Handling for Concurrency

```csharp
// Application/Handlers/CreateBookingCommandHandler.cs
public async Task<BookingDto> Handle(CreateBookingCommand request, CancellationToken ct)
{
    try
    {
        var booking = new BookingItem { /* ... */ };
        await _context.BookingItems.AddAsync(booking, ct);
        await _context.SaveChangesAsync(ct); // ← May throw DbUpdateConcurrencyException
        return MapToDto(booking);
    }
    catch (DbUpdateConcurrencyException ex)
    {
        // ที่นั่งนี้ถูกจองไปแล้ว (Seat was booked by another user)
        // → ให้ Exception Middleware แปลงเป็น HTTP 409 Conflict + ProblemDetails
        throw new ConcurrencyException("ที่นั่งนี้ถูกจองไปแล้ว กรุณาเลือกที่นั่งอื่น", ex);
    }
}
```

### Transaction Isolation Level

```csharp
// Infrastructure/Persistence/DbContext.cs
protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
{
    optionsBuilder.UseSqlServer(
        _configuration.GetConnectionString("DefaultConnection"),
        options =>
        {
            // ตั้งค่า Isolation Level เป็น Read Committed (ค่าเริ่มต้นของ SQL Server)
            // ← Prevents Dirty Reads, Phantom Reads
            options.EnableRetryOnFailure(maxRetryCount: 3);
        }
    );
}
```

---

## 🌐 API Response Standards (RFC 7807 Problem Details)

### Global Exception Handling Middleware

**Pattern:**
```csharp
// API/Middleware/ExceptionHandlingMiddleware.cs
public async Task InvokeAsync(HttpContext context)
{
    try
    {
        await _next(context);
    }
    catch (Exception ex)
    {
        // แปลง Domain Exceptions เป็น ProblemDetails (Convert domain exceptions to RFC 7807)
        var response = new ProblemDetails
        {
            Title = ex switch
            {
                ConcurrencyException => "Concurrency Conflict",
                ValidationException => "Validation Failed",
                NotFoundException => "Not Found",
                ForbiddenException => "Forbidden",
                _ => "Internal Server Error"
            },
            Status = ex switch
            {
                ConcurrencyException => StatusCodes.Status409Conflict,
                ValidationException => StatusCodes.Status400BadRequest,
                NotFoundException => StatusCodes.Status404NotFound,
                ForbiddenException => StatusCodes.Status403Forbidden,
                _ => StatusCodes.Status500InternalServerError
            },
            Detail = ex.Message, // Tech-Thai message
            Instance = context.Request.Path
        };
        
        context.Response.StatusCode = response.Status ?? 500;
        context.Response.ContentType = "application/problem+json";
        await context.Response.WriteAsJsonAsync(response);
    }
}
```

### Success Response Example

```json
{
  "bookingId": 12345,
  "bookingReference": "BK-2026-07-23-001",
  "status": "CONFIRMED",
  "seats": [5, 6, 7],
  "totalPrice": 450.00,
  "message": "จองตั๋วสำเร็จ"
}
```

### Error Response Example (409 Conflict)

```json
{
  "type": "https://api.natureminiplex.local/errors/concurrency-conflict",
  "title": "Concurrency Conflict",
  "status": 409,
  "detail": "ที่นั่งนี้ถูกจองไปแล้ว กรุณาเลือกที่นั่งอื่น",
  "instance": "/api/bookings/create"
}
```

---

## 📋 Code Review Checklist

When reviewing Backend PRs, verify:

- [ ] **Architecture:** Code respects 4-layer isolation (no domain → infrastructure refs)
- [ ] **CQRS:** Commands & Queries separated properly (not mixed in same handler)
- [ ] **Permissions:** Uses `[HasPermission("...")]` NOT `[Authorize(Roles = "...")]`
- [ ] **RLS:** Data access includes actor-specific ownership checks
- [ ] **Concurrency:** `RowVersion` column configured, exception handling present
- [ ] **Validation:** FluentValidation applied, business rules checked in handlers
- [ ] **Tech-Thai:** Comments written in Thai with technical terms in English
- [ ] **Tests:** Unit & integration tests exist, concurrency scenarios covered
- [ ] **Documentation:** API documentation updated if contracts changed

---

## 🔗 Reference Documentation

- **Reference:** `backend/ARCHITECTURE.md` (Clean Architecture deep dive)
- **Reference:** `backend/SECURITY.md` (RBAC, RLS, actor model details)
- **Reference:** `backend/DATABASE.md` (Schema, entity relations, indexes)
- **Reference:** `backend/API_CONTRACTS.md` (RESTful endpoint specifications)
- **Reference:** `backend/BUSINESS_RULES.md` (SRS booking constraints)
- **Reference:** `backend/CODING_STANDARDS.md` (C#/.NET conventions)
- **Reference:** `backend/TESTING.md` (Test strategy & concurrency test patterns)

---

**Last Updated:** 2026-07-23  
**Status:** Active & Standardized
