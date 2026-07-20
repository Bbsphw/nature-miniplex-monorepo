using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Core.Application.Features.Customers.Queries;

public record GetCustomersQuery : IRequest<IReadOnlyList<Customer>>;

public class GetCustomersQueryHandler : IRequestHandler<GetCustomersQuery, IReadOnlyList<Customer>>
{
    private readonly IRepository<Customer> _customerRepository;

    public GetCustomersQueryHandler(IRepository<Customer> customerRepository)
    {
        _customerRepository = customerRepository;
    }

    public async Task<IReadOnlyList<Customer>> Handle(GetCustomersQuery request, CancellationToken cancellationToken)
    {
        return await _customerRepository.GetAllAsync(cancellationToken);
    }
}
