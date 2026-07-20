using System;
using System.Threading;
using System.Threading.Tasks;

namespace NatureMiniPlex.Core.Application.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(string toEmail, string subject, string htmlMessage);
}
