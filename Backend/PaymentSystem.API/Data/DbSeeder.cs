using Microsoft.EntityFrameworkCore;
using PaymentSystem.API.Data;
using PaymentSystem.API.Models;

namespace PaymentSystem.API.Data;

public static class DbSeeder
{
    public static async Task SeedRoles(AppDbContext context)
    {
        // Existing roles: Admin, Sales, Accountant, Instructor, Mentor
        // New role: Coordinator
        var roles = new[] { "Admin", "Sales", "Accountant", "Instructor", "Mentor", "Coordinator" };
        
        // This is usually handled by RoleManager, but since I'm modifying the DB directly or via migrations,
        // I'll ensure the role exists in AspNetRoles if I can.
        // Actually, I'll just update the controllers first.
    }
}
