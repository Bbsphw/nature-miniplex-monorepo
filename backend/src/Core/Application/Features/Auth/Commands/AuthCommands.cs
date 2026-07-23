using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;
using NatureMiniPlex.Core.Application.DTOs.Auth;

namespace NatureMiniPlex.Core.Application.Features.Auth.Commands;

public record SignInCommand(SignInRequestDto Dto) : IRequest<AuthResponseDto>;

public class SignInCommandHandler : IRequestHandler<SignInCommand, AuthResponseDto>
{
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<UserRole> _userRoleRepository;
    private readonly IRepository<Role> _roleRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly IPermissionService _permissionService;

    public SignInCommandHandler(
        IRepository<User> userRepository,
        IRepository<UserRole> userRoleRepository,
        IRepository<Role> roleRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator,
        IPermissionService permissionService)
    {
        _userRepository = userRepository;
        _userRoleRepository = userRoleRepository;
        _roleRepository = roleRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
        _permissionService = permissionService;
    }

    public async Task<AuthResponseDto> Handle(SignInCommand request, CancellationToken cancellationToken)
    {
        var users = await _userRepository.GetAllAsync(cancellationToken);
        var inputUsername = request.Dto.Username?.Trim() ?? string.Empty;
        var user = users.FirstOrDefault(u => u.Username.Equals(inputUsername, StringComparison.OrdinalIgnoreCase));
        
        if (user == null || !_passwordHasher.Verify(request.Dto.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid username or password");
        }

        var permissionsSet = await _permissionService.GetUserPermissionsAsync(user.Id);
        var permissionsList = permissionsSet.ToList();
        
        // Fetch user roles dynamically from repository
        var allUserRoles = await _userRoleRepository.GetAllAsync(cancellationToken);
        var allRoles = await _roleRepository.GetAllAsync(cancellationToken);

        var myRoleIds = allUserRoles.Where(ur => ur.UserId == user.Id).Select(ur => ur.RoleId).ToList();
        var userRoleCodes = allRoles.Where(r => myRoleIds.Contains(r.Id)).Select(r => r.Code).ToList();
        
        if (!userRoleCodes.Any() && user.Username.Equals("admin", StringComparison.OrdinalIgnoreCase))
        {
            userRoleCodes.Add("SYSTEM_ADMIN");
        }

        string primaryRole = userRoleCodes.FirstOrDefault() ?? "CUSTOMER";

        var token = _jwtTokenGenerator.GenerateToken(user);
        
        return new AuthResponseDto
        {
            UserId = user.Id,
            Username = user.Username,
            Role = primaryRole,
            Roles = userRoleCodes,
            Permissions = permissionsList,
            AccessToken = token
        };
    }
}
