using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Core.Application.Features.Users.Queries;

public record GetUsersQuery : IRequest<IReadOnlyList<User>>;

public class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, IReadOnlyList<User>>
{
    private readonly IRepository<User> _userRepository;

    public GetUsersQueryHandler(IRepository<User> userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<IReadOnlyList<User>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        return await _userRepository.GetAllAsync(cancellationToken);
    }
}

public record GetUserByIdQuery(int Id) : IRequest<User>;

public class GetUserByIdQueryHandler : IRequestHandler<GetUserByIdQuery, User>
{
    private readonly IRepository<User> _userRepository;

    public GetUserByIdQueryHandler(IRepository<User> userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<User> Handle(GetUserByIdQuery request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(request.Id, cancellationToken);
        if (user == null) throw new Exception("User not found.");
        return user;
    }
}
