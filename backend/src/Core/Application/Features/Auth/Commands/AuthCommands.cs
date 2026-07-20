using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;
using NatureMiniPlex.Core.Application.DTOs.Auth;
using NatureMiniPlex.Core.Domain.Enums;

namespace NatureMiniPlex.Core.Application.Features.Auth.Commands;

public record SignInCommand(SignInRequestDto Dto) : IRequest<AuthResponseDto>;

public class SignInCommandHandler : IRequestHandler<SignInCommand, AuthResponseDto>
{
    private readonly IRepository<User> _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public SignInCommandHandler(IRepository<User> userRepository, IPasswordHasher passwordHasher, IJwtTokenGenerator jwtTokenGenerator)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponseDto> Handle(SignInCommand request, CancellationToken cancellationToken)
    {
        var users = await _userRepository.GetAllAsync(cancellationToken);
        var user = users.FirstOrDefault(u => u.Username == request.Dto.Username);
        
        if (user == null || !_passwordHasher.Verify(request.Dto.Password, user.PasswordHash))
        {
            throw new Exception("Invalid username or password"); // In real app use custom exceptions
        }

        var token = _jwtTokenGenerator.GenerateToken(user);
        
        return new AuthResponseDto
        {
            UserId = user.Id,
            Username = user.Username,
            Role = user.Role.ToString(),
            AccessToken = token
        };
    }
}

