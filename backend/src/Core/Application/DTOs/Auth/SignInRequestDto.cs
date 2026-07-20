namespace NatureMiniPlex.Core.Application.DTOs.Auth;

public class SignInRequestDto
{
    public string Username { get; set; } = null!;
    public string Password { get; set; } = null!;
}
