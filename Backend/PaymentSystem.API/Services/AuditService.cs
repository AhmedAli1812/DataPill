using Microsoft.AspNetCore.Identity;
using PaymentSystem.API.Data;
using PaymentSystem.API.Models;

namespace PaymentSystem.API.Services;

public interface IAuditService
{
    Task LogAsync(string userId, string action, string entityName, int? entityId, string details);
}

public class AuditService : IAuditService
{
    private readonly AppDbContext _context;

    public AuditService(AppDbContext context)
    {
        _context = context;
    }

    public async Task LogAsync(string userId, string action, string entityName, int? entityId, string details)
    {
        var log = new AuditLog
        {
            UserId = userId,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            Details = details,
            Timestamp = DateTime.UtcNow
        };

        _context.AuditLogs.Add(log);
        await _context.SaveChangesAsync();
    }
}
