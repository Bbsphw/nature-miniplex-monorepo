using Moq;
using NatureMiniPlex.Core.Application.Interfaces;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;
using System;

namespace NatureMiniPlex.Application.UnitTests.Common;

public abstract class BaseTest
{
    protected readonly Mock<IUnitOfWork> MockUnitOfWork;
    
    // Core repositories
    protected readonly Mock<IMovieRepository> MockMovieRepository;
    protected readonly Mock<IShowtimeRepository> MockShowtimeRepository;
    protected readonly Mock<IBookingRepository> MockBookingRepository;
    protected readonly Mock<IRepository<Customer>> MockCustomerRepository;
    protected readonly Mock<IRepository<User>> MockUserRepository;

    protected BaseTest()
    {
        MockUnitOfWork = new Mock<IUnitOfWork>();
        
        MockMovieRepository = new Mock<IMovieRepository>();
        MockShowtimeRepository = new Mock<IShowtimeRepository>();
        MockBookingRepository = new Mock<IBookingRepository>();
        MockCustomerRepository = new Mock<IRepository<Customer>>();
        MockUserRepository = new Mock<IRepository<User>>();


    }
}
