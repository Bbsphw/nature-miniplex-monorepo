using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace NatureMiniPlex.Core.Application.Common;

/// <summary>
/// Utility สำหรับทำ Data Masking และ Redaction เพื่อป้องกัน Sensitive Data & PII Leakage
/// เป็นไปตามมาตรฐาน PDPA และ ISO 27001 (Less is More & Strict Data Scrubbing)
/// </summary>
public static class DataRedactor
{
    // รายชื่อ Sensitive Keys ที่ต้องทำการ Redact (ลบค่าทิ้งเป็น [REDACTED] 100%)
    private static readonly HashSet<string> SensitiveKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "password", "passwordhash", "confirmPassword", "oldPassword", "newPassword",
        "creditCardNumber", "cardNumber", "cvv", "cvc", "expirationDate",
        "token", "accessToken", "refreshToken", "secret", "privateKey", "authorization"
    };

    // Regex Pattern สำหรับการตรวจสอบ Email และ Phone Number
    private static readonly Regex EmailRegex = new(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled);
    private static readonly Regex PhoneRegex = new(@"^\+?\d{9,15}$", RegexOptions.Compiled);

    /// <summary>
    /// ทำ Data Masking บน JSON String
    /// </summary>
    public static string RedactJson(string jsonString)
    {
        if (string.IsNullOrWhiteSpace(jsonString))
            return jsonString;

        try
        {
            using var doc = JsonDocument.Parse(jsonString);
            var node = JsonNode.Parse(jsonString);
            if (node == null) return jsonString;

            ScrubJsonNode(node);
            return node.ToJsonString(new JsonSerializerOptions { WriteIndented = false });
        }
        catch
        {
            // หากไม่ใช่ JSON ให้ส่งคืนข้อความที่ถูกสแกนผ่าน String Redactor
            return RedactText(jsonString);
        }
    }

    /// <summary>
    /// Mask Email Address ตามมาตรฐาน PDPA (e.g., user@example.com -> u***r@example.com)
    /// </summary>
    public static string MaskEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            return email;

        var parts = email.Split('@');
        var name = parts[0];
        var domain = parts[1];

        if (name.Length <= 2)
            return $"{name[0]}***@{domain}";

        return $"{name[0]}***{name[^1]}@{domain}";
    }

    /// <summary>
    /// Mask Phone Number ตามมาตรฐาน PDPA (e.g., 0812345678 -> xxx-xxx-5678)
    /// </summary>
    public static string MaskPhoneNumber(string phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return phone;

        var cleanPhone = phone.Replace("-", "").Replace(" ", "");
        if (cleanPhone.Length < 4)
            return "xxx-xxx-xxxx";

        var lastFourDigits = cleanPhone[^4..];
        return $"xxx-xxx-{lastFourDigits}";
    }

    /// <summary>
    /// สแกนข้อความทั่วไปเพื่อ Mask Email และ Phone ที่อาจหลุดรอดมาใน Text
    /// </summary>
    public static string RedactText(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return text;

        // Scrub Emails
        text = Regex.Replace(text, @"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", m => MaskEmail(m.Value));
        // Scrub Phones (Thai standard formats)
        text = Regex.Replace(text, @"\b0\d{8,9}\b", m => MaskPhoneNumber(m.Value));

        return text;
    }

    /// <summary>
    /// Recursive function สำหรับวนลูป Scrub JsonNode ทุกระดับชั้น
    /// </summary>
    private static void ScrubJsonNode(JsonNode node)
    {
        if (node is JsonObject obj)
        {
            var keysToRedact = new List<string>();
            var propertiesToModify = new List<KeyValuePair<string, JsonNode?>>();

            foreach (var kvp in obj)
            {
                if (SensitiveKeys.Contains(kvp.Key))
                {
                    keysToRedact.Add(kvp.Key);
                }
                else if (kvp.Value is JsonValue val && val.TryGetValue<string>(out var strVal))
                {
                    if (EmailRegex.IsMatch(strVal))
                    {
                        propertiesToModify.Add(new KeyValuePair<string, JsonNode?>(kvp.Key, JsonValue.Create(MaskEmail(strVal))));
                    }
                    else if (PhoneRegex.IsMatch(strVal) || kvp.Key.Contains("phone", StringComparison.OrdinalIgnoreCase))
                    {
                        propertiesToModify.Add(new KeyValuePair<string, JsonNode?>(kvp.Key, JsonValue.Create(MaskPhoneNumber(strVal))));
                    }
                }
                else if (kvp.Value != null)
                {
                    ScrubJsonNode(kvp.Value);
                }
            }

            foreach (var key in keysToRedact)
            {
                obj[key] = JsonValue.Create("[REDACTED]");
            }

            foreach (var prop in propertiesToModify)
            {
                obj[prop.Key] = prop.Value;
            }
        }
        else if (node is JsonArray arr)
        {
            foreach (var item in arr)
            {
                if (item != null)
                {
                    ScrubJsonNode(item);
                }
            }
        }
    }
}
