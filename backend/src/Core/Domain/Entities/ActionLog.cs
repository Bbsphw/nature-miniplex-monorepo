using System;
using NatureMiniPlex.Core.Domain.Common;

namespace NatureMiniPlex.Core.Domain.Entities;

/// <summary>
/// Entity สำหรับบันทึก Action Log (Audit Trail) ของระบบ Nature MiniPlex
/// ปฏิบัติตามมาตรฐาน ISO 27001 และ PDPA สำหรับการตรวจสอบย้อนหลัง (Non-repudiation)
/// </summary>
public class ActionLog : BaseEntity
{
    public int Id { get; set; }

    // 1. Log Severity Level (ระดับความสำคัญของ Log)
    public string LogLevel { get; set; } = "INFO"; // INFO, WARNING, ERROR

    // 2. Actor Details (ผู้ทำรายการ: Who)
    public int? UserId { get; set; }
    public string? ActorEmail { get; set; }
    public string? ActorRole { get; set; }
    public string? IpAddress { get; set; }

    // 3. Action Details (การกระทำ: What & How)
    public string ActionName { get; set; } = null!; // e.g. CANCEL_BOOKING, UPDATE_ROLE, CREATE_USER
    public string HttpMethod { get; set; } = null!; // e.g. GET, POST, PUT, DELETE

    // 4. Target Details (เป้าหมายของการทำรายการ: Target)
    public string? TargetId { get; set; }           // e.g. "BK-2026-001" หรือ "12"
    public string? TargetType { get; set; }         // e.g. "TABLE: bookings", "TABLE: users"

    // 5. Detail & Audit History (รายละเอียดและการเปลี่ยนแปลง: Changes Before/After)
    public string? DetailJson { get; set; }         // Standardized JSON payload { "before": {...}, "after": {...} }

    // 6. Context Details (บริบทของการทำรายการ: Where & Context)
    public string? UserAgent { get; set; }
    public string? SessionId { get; set; }         // Request Correlation ID / Session ID
    public string? Location { get; set; }          // Request URL Path / Endpoint Name
    public int StatusCode { get; set; }            // HTTP Status Code (200, 400, 403, 500)

    // 7. Timestamp (เวลาทำรายการ: When)
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Navigation Property
    public User? User { get; set; }
}
