using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Core.Application.Features.Users.Commands;

public record CreateUserCommand(
    string Username,
    string PasswordHash,
    string Role = "CUSTOMER",
    string? Email = null,
    int? CinemaId = null,
    List<int>? RoleIds = null
) : IRequest<int>;

public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, int>
{
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<Role> _roleRepository;
    private readonly IRepository<ActionLog> _actionLogRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ICurrentUserService _currentUserService;

    public CreateUserCommandHandler(
        IRepository<User> userRepository,
        IRepository<Role> roleRepository,
        IRepository<ActionLog> actionLogRepository,
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher,
        ICurrentUserService currentUserService)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _actionLogRepository = actionLogRepository;
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _currentUserService = currentUserService;
    }

    public async Task<int> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            CinemaId = request.CinemaId,
            PasswordHash = _passwordHasher.Hash(request.PasswordHash),
            IsActive = true
        };

        await _userRepository.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Assign Roles
        var roles = await _roleRepository.GetAllAsync(cancellationToken);
        
        if (request.RoleIds != null && request.RoleIds.Any())
        {
            foreach (var rId in request.RoleIds)
            {
                var role = roles.FirstOrDefault(r => r.Id == rId);
                if (role != null)
                {
                    user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
                }
            }
        }
        else
        {
            // Assign default role by string Code or "CUSTOMER"
            string targetCode = string.IsNullOrWhiteSpace(request.Role) ? "CUSTOMER" : request.Role.Trim().ToUpperInvariant();
            var targetRole = roles.FirstOrDefault(r => r.Code.Equals(targetCode, StringComparison.OrdinalIgnoreCase))
                ?? roles.FirstOrDefault(r => r.Code == "CUSTOMER");

            if (targetRole != null)
            {
                user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = targetRole.Id });
            }
        }

        // Record Audit Action Log
        await _actionLogRepository.AddAsync(new ActionLog
        {
            UserId = _currentUserService.UserId ?? 1,
            ActionType = "CREATE_USER",
            EntityName = nameof(User),
            EntityId = user.Id,
            Timestamp = DateTime.UtcNow
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return user.Id;
    }
}

public record UpdateUserRolesCommand(int UserId, List<int> RoleIds) : IRequest<bool>;

public class UpdateUserRolesCommandHandler : IRequestHandler<UpdateUserRolesCommand, bool>
{
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<UserRole> _userRoleRepository;
    private readonly IRepository<Role> _roleRepository;
    private readonly IRepository<ActionLog> _actionLogRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPermissionService _permissionService;
    private readonly ICurrentUserService _currentUserService;

    public UpdateUserRolesCommandHandler(
        IRepository<User> userRepository,
        IRepository<UserRole> userRoleRepository,
        IRepository<Role> roleRepository,
        IRepository<ActionLog> actionLogRepository,
        IUnitOfWork unitOfWork,
        IPermissionService permissionService,
        ICurrentUserService currentUserService)
    {
        _userRepository = userRepository;
        _userRoleRepository = userRoleRepository;
        _roleRepository = roleRepository;
        _actionLogRepository = actionLogRepository;
        _unitOfWork = unitOfWork;
        _permissionService = permissionService;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(UpdateUserRolesCommand request, CancellationToken cancellationToken)
    {
        var users = await _userRepository.GetAllAsync(cancellationToken);
        var user = users.FirstOrDefault(u => u.Id == request.UserId);
        
        if (user == null)
        {
            throw new KeyNotFoundException($"User with ID '{request.UserId}' was not found.");
        }

        var allRoles = await _roleRepository.GetAllAsync(cancellationToken);
        var validRoles = allRoles.Where(r => request.RoleIds.Contains(r.Id)).ToList();

        // Fetch existing UserRoles for this user and remove them
        var existingUserRoles = (await _userRoleRepository.GetAllAsync(cancellationToken))
            .Where(ur => ur.UserId == request.UserId)
            .ToList();

        if (existingUserRoles.Any())
        {
            await _userRoleRepository.DeleteRangeAsync(existingUserRoles, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        // Insert new UserRoles
        foreach (var role in validRoles)
        {
            await _userRoleRepository.AddAsync(new UserRole { UserId = user.Id, RoleId = role.Id, AssignedAt = DateTime.UtcNow }, cancellationToken);
        }

        // Record Audit Action Log
        await _actionLogRepository.AddAsync(new ActionLog
        {
            UserId = _currentUserService.UserId ?? 1,
            ActionType = "UPDATE_ROLES",
            EntityName = nameof(User),
            EntityId = user.Id,
            Timestamp = DateTime.UtcNow
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Invalidate Permission Cache so changes take effect immediately
        _permissionService.InvalidateUserPermissionsCache(user.Id);

        return true;
    }
}

public record UpdateUserProfileCommand(int UserId, string? Email, int? CinemaId, bool? IsActive) : IRequest<bool>;

public class UpdateUserProfileCommandHandler : IRequestHandler<UpdateUserProfileCommand, bool>
{
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<ActionLog> _actionLogRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public UpdateUserProfileCommandHandler(
        IRepository<User> userRepository,
        IRepository<ActionLog> actionLogRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _userRepository = userRepository;
        _actionLogRepository = actionLogRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(UpdateUserProfileCommand request, CancellationToken cancellationToken)
    {
        var users = await _userRepository.GetAllAsync(cancellationToken);
        var user = users.FirstOrDefault(u => u.Id == request.UserId);

        if (user == null)
        {
            throw new KeyNotFoundException($"User with ID '{request.UserId}' was not found.");
        }

        if (request.Email != null) user.Email = request.Email;
        user.CinemaId = (request.CinemaId == 0 || request.CinemaId == null) ? null : request.CinemaId;
        if (request.IsActive.HasValue) user.IsActive = request.IsActive.Value;

        // Record Audit Action Log
        await _actionLogRepository.AddAsync(new ActionLog
        {
            UserId = _currentUserService.UserId ?? 1,
            ActionType = "UPDATE_PROFILE",
            EntityName = nameof(User),
            EntityId = user.Id,
            Timestamp = DateTime.UtcNow
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public record UpdateUserStatusCommand(int UserId, bool IsActive) : IRequest<bool>;

public class UpdateUserStatusCommandHandler : IRequestHandler<UpdateUserStatusCommand, bool>
{
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<ActionLog> _actionLogRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public UpdateUserStatusCommandHandler(
        IRepository<User> userRepository,
        IRepository<ActionLog> actionLogRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _userRepository = userRepository;
        _actionLogRepository = actionLogRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(UpdateUserStatusCommand request, CancellationToken cancellationToken)
    {
        var users = await _userRepository.GetAllAsync(cancellationToken);
        var user = users.FirstOrDefault(u => u.Id == request.UserId);

        if (user == null)
        {
            throw new KeyNotFoundException($"User with ID '{request.UserId}' was not found.");
        }

        user.IsActive = request.IsActive;

        // Record Audit Action Log
        await _actionLogRepository.AddAsync(new ActionLog
        {
            UserId = _currentUserService.UserId ?? 1,
            ActionType = request.IsActive ? "ENABLE_USER" : "DISABLE_USER",
            EntityName = nameof(User),
            EntityId = user.Id,
            Timestamp = DateTime.UtcNow
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public record ChangePasswordCommand(int UserId, string CurrentPassword, string NewPassword) : IRequest<bool>;

public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand, bool>
{
    private readonly IRepository<User> _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IUnitOfWork _unitOfWork;

    public ChangePasswordCommandHandler(
        IRepository<User> userRepository,
        IPasswordHasher passwordHasher,
        IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        var users = await _userRepository.GetAllAsync(cancellationToken);
        var user = users.FirstOrDefault(u => u.Id == request.UserId);

        if (user == null)
        {
            throw new KeyNotFoundException($"User with ID '{request.UserId}' was not found.");
        }

        if (!_passwordHasher.Verify(request.CurrentPassword, user.PasswordHash))
        {
            throw new Exception("Current password is invalid.");
        }

        user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}




