using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.DTOs.Users;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;

using NatureMiniPlex.Core.Application.Interfaces;

namespace NatureMiniPlex.Core.Application.Features.Users.Queries;

public record GetUsersQuery : IRequest<IReadOnlyList<UserDto>>;

public class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, IReadOnlyList<UserDto>>
{
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<UserRole> _userRoleRepository;
    private readonly IRepository<Role> _roleRepository;
    private readonly IPermissionService _permissionService;

    public GetUsersQueryHandler(
        IRepository<User> userRepository,
        IRepository<UserRole> userRoleRepository,
        IRepository<Role> roleRepository,
        IPermissionService permissionService)
    {
        _userRepository = userRepository;
        _userRoleRepository = userRoleRepository;
        _roleRepository = roleRepository;
        _permissionService = permissionService;
    }

    public async Task<IReadOnlyList<UserDto>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        var users = await _userRepository.GetAllAsync(cancellationToken);
        if (users == null) return new List<UserDto>();
        
        var allUserRoles = await _userRoleRepository.GetAllAsync(cancellationToken);
        var allRoles = await _roleRepository.GetAllAsync(cancellationToken);

        var userDtos = new List<UserDto>();
        foreach (var u in users)
        {
            var myRoleIds = allUserRoles.Where(ur => ur.UserId == u.Id).Select(ur => ur.RoleId).ToList();
            var myRoles = allRoles.Where(r => myRoleIds.Contains(r.Id)).Select(r => r.Code).ToList();

            if (!myRoles.Any() && u.Username.Equals("admin", StringComparison.OrdinalIgnoreCase))
            {
                myRoles.Add("SYSTEM_ADMIN");
            }

            var userPerms = await _permissionService.GetUserPermissionsAsync(u.Id);

            userDtos.Add(new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                CinemaId = u.CinemaId,
                CinemaName = u.Cinema?.Name,
                IsActive = u.IsActive,
                Roles = myRoles,
                Permissions = userPerms.ToList()
            });
        }

        return userDtos;
    }
}

public record GetUserByIdQuery(int Id) : IRequest<UserDto>;

public class GetUserByIdQueryHandler : IRequestHandler<GetUserByIdQuery, UserDto>
{
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<UserRole> _userRoleRepository;
    private readonly IRepository<Role> _roleRepository;
    private readonly IPermissionService _permissionService;

    public GetUserByIdQueryHandler(
        IRepository<User> userRepository,
        IRepository<UserRole> userRoleRepository,
        IRepository<Role> roleRepository,
        IPermissionService permissionService)
    {
        _userRepository = userRepository;
        _userRoleRepository = userRoleRepository;
        _roleRepository = roleRepository;
        _permissionService = permissionService;
    }

    public async Task<UserDto> Handle(GetUserByIdQuery request, CancellationToken cancellationToken)
    {
        var u = await _userRepository.GetByIdAsync(request.Id, cancellationToken);
        if (u == null)
        {
            var allUsers = await _userRepository.GetAllAsync(cancellationToken);
            if (allUsers != null)
            {
                u = allUsers.FirstOrDefault(x => x.Id == request.Id);
            }
        }
        
        if (u == null)
        {
            throw new Exception("User not found.");
        }

        var allUserRoles = await _userRoleRepository.GetAllAsync(cancellationToken);
        var allRoles = await _roleRepository.GetAllAsync(cancellationToken);

        var myRoleIds = allUserRoles.Where(ur => ur.UserId == u.Id).Select(ur => ur.RoleId).ToList();
        var myRoles = allRoles.Where(r => myRoleIds.Contains(r.Id)).Select(r => r.Code).ToList();

        if (!myRoles.Any() && u.Username.Equals("admin", StringComparison.OrdinalIgnoreCase))
        {
            myRoles.Add("SYSTEM_ADMIN");
        }

        var userPerms = await _permissionService.GetUserPermissionsAsync(u.Id);

        return new UserDto
        {
            Id = u.Id,
            Username = u.Username,
            Email = u.Email,
            CinemaId = u.CinemaId,
            CinemaName = u.Cinema?.Name,
            IsActive = u.IsActive,
            Roles = myRoles,
            Permissions = userPerms.ToList()
        };
    }
}

