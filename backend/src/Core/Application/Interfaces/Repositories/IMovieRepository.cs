using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Core.Application.Interfaces.Repositories;

public interface IMovieRepository : IRepository<Movie>
{
    Task<IReadOnlyList<Movie>> GetActiveMoviesAsync(CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken = default);
}
