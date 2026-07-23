using NatureMiniPlex.Core.Application.Interfaces;
using BCrypt.Net;

namespace NatureMiniPlex.Infrastructure.Authentication;

/// <summary>
/// Service สำหรับการสร้างและตรวจสอบ Password Hash ตามมาตรฐานความปลอดภัยระดับสูง (OWASP & ISO 27001)
/// เลือกใช้ BCrypt Enhanced Hashing (SHA-384 Pre-hashing + BCrypt) พร้อมรองรับ Backward Compatibility สำหรับ Legacy Standard Hash
/// </summary>
public class PasswordHasher : IPasswordHasher
{
    public string Hash(string password)
    {
        // 🔒 ใช้ EnhancedHashPassword (SHA-384 + BCrypt) 
        // ข้อดี: แก้ปัญหาข้อจำกัดรหัสผ่าน 72 ตัวอักษรของ BCrypt และป้องกัน DoS Attack จาก Long Input Password
        return BCrypt.Net.BCrypt.EnhancedHashPassword(password, 11);
    }

    public bool Verify(string password, string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(passwordHash))
            return false;

        // 1. ตรวจสอบด้วย Enhanced BCrypt Verification (SHA-384 + BCrypt) สำหรับ Hash ใหม่
        try
        {
            if (BCrypt.Net.BCrypt.EnhancedVerify(password, passwordHash))
                return true;
        }
        catch { }

        // 2. Fallback ตรวจสอบด้วย Standard BCrypt Verification สำหรับ Legacy Hash ในระบบเดิม
        try
        {
            if (BCrypt.Net.BCrypt.Verify(password, passwordHash))
                return true;
        }
        catch { }

        return false;
    }
}
