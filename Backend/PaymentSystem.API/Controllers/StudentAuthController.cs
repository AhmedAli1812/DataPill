using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PaymentSystem.API.Data;
using PaymentSystem.API.DTOs;
using PaymentSystem.API.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace PaymentSystem.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class StudentAuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public StudentAuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        // Here dto.Email is actually the Phone number from the UI
        var student = await _context.Students.FirstOrDefaultAsync(s => s.Phone == dto.Email && !s.IsDeleted);
        if (student == null) return Unauthorized(new { message = "رقم الهاتف غير مسجل" });

        var hasher = new PasswordHasher<Student>();
        
        bool isPasswordValid = false;
        
        if (string.IsNullOrEmpty(student.PasswordHash))
        {
            // First time login: password must equal phone number
            if (dto.Password == student.Phone)
            {
                isPasswordValid = true;
                // Save hashed password for future
                student.PasswordHash = hasher.HashPassword(student, dto.Password);
                await _context.SaveChangesAsync();
            }
        }
        else
        {
            var result = hasher.VerifyHashedPassword(student, student.PasswordHash, dto.Password);
            isPasswordValid = (result == PasswordVerificationResult.Success || result == PasswordVerificationResult.SuccessRehashNeeded);
        }

        if (isPasswordValid)
        {
            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, student.Id.ToString()),
                new Claim(ClaimTypes.Name, student.Name),
                new Claim(ClaimTypes.MobilePhone, student.Phone),
                new Claim(ClaimTypes.Role, "Student"),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            };

            var token = GetToken(authClaims);

            return Ok(new AuthResponseDto
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                Email = student.Phone, // Using Email field for phone in response
                FullName = student.Name,
                Roles = new List<string> { "Student" }
            });
        }
        
        return Unauthorized(new { message = "كلمة المرور غير صحيحة" });
    }

    private JwtSecurityToken GetToken(List<Claim> authClaims)
    {
        var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "SecretKey"));

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            expires: DateTime.Now.AddDays(7),
            claims: authClaims,
            signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );

        return token;
    }
}
