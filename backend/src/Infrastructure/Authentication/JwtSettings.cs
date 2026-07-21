using System.ComponentModel.DataAnnotations;

namespace NatureMiniPlex.Infrastructure.Authentication;

public class JwtSettings
{
    public const string SectionName = "JwtSettings";

    [Required(ErrorMessage = "JWT Secret is required.")]
    [MinLength(32, ErrorMessage = "JWT Secret must be at least 32 characters long.")]
    public string Secret { get; set; } = null!;

    public int ExpiryMinutes { get; set; } = 120;

    [Required(ErrorMessage = "JWT Issuer is required.")]
    public string Issuer { get; set; } = null!;

    [Required(ErrorMessage = "JWT Audience is required.")]
    public string Audience { get; set; } = null!;
}
