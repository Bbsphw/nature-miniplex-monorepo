using System.Collections.Generic;

namespace NatureMiniPlex.Core.Application.DTOs.Auth;

public class AuthResponseDto
{
    public int UserId { get; set; }
    public string Username { get; set; } = null!;
    public string Role { get; set; } = null!;
    public List<string> Roles { get; set; } = new();
    public List<string> Permissions { get; set; } = new();
    public string AccessToken { get; set; } = null!;
}
