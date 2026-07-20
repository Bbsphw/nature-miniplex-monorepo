using MailKit.Net.Smtp;
using Microsoft.Extensions.Options;
using MimeKit;
using NatureMiniPlex.Core.Application.Interfaces;
using System.Threading.Tasks;

namespace NatureMiniPlex.Infrastructure.Services;

public class SmtpSettings
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; }
    public string SenderEmail { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public bool EnableSsl { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class EmailService : IEmailService
{
    private readonly SmtpSettings _settings;

    public EmailService(IOptions<SmtpSettings> settings)
    {
        _settings = settings.Value;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlMessage)
    {
        var email = new MimeMessage();
        email.From.Add(new MailboxAddress(_settings.SenderName, _settings.SenderEmail));
        email.To.Add(MailboxAddress.Parse(toEmail));
        email.Subject = subject;

        var bodyBuilder = new BodyBuilder { HtmlBody = htmlMessage };
        email.Body = bodyBuilder.ToMessageBody();

        using var smtp = new SmtpClient();
        
        // เชื่อมต่อไปยัง Mailpit container
        await smtp.ConnectAsync(_settings.Host, _settings.Port, _settings.EnableSsl);

        // Mailpit ในเครื่องไม่ต้องใช้ Auth (เช็คเงื่อนไขก่อนล็อกอิน)
        if (!string.IsNullOrEmpty(_settings.Username))
        {
            await smtp.AuthenticateAsync(_settings.Username, _settings.Password);
        }

        await smtp.SendAsync(email);
        await smtp.DisconnectAsync(true);
    }
}
