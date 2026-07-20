using System;
using System.Threading;
using System.Threading.Tasks;

namespace NatureMiniPlex.Core.Application.Interfaces;

public interface IUnitOfWork : IDisposable
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
