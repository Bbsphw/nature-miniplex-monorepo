using System.Threading;
using System.Threading.Tasks;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Core.Application.Interfaces.Repositories;

public interface ICinemaRepository : IRepository<Cinema>
{
    Task<Cinema?> GetCinemaWithSeatsAsync(int cinemaId, CancellationToken cancellationToken = default);
}
