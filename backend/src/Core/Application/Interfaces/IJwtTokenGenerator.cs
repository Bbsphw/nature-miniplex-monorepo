using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Core.Application.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);
}
