using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PaymentSystem.API.Models;

namespace PaymentSystem.API.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Student> Students => Set<Student>();
    public DbSet<CourseGroup> CourseGroups => Set<CourseGroup>();
    public DbSet<CourseSubscription> CourseSubscriptions => Set<CourseSubscription>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<Salary> Salaries => Set<Salary>();
    public DbSet<InstructorSession> InstructorSessions => Set<InstructorSession>();

    public DbSet<CourseGroupInstructor> CourseGroupInstructors => Set<CourseGroupInstructor>();
    public DbSet<StudentEvaluation> StudentEvaluations => Set<StudentEvaluation>();
    public DbSet<StudentSession> StudentSessions => Set<StudentSession>();
    public DbSet<StudentAttendance> StudentAttendances => Set<StudentAttendance>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Salary
        modelBuilder.Entity<Salary>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.BaseSalary).HasColumnType("decimal(18,2)");
            entity.Property(s => s.Bonus).HasColumnType("decimal(18,2)");
            entity.Property(s => s.Deductions).HasColumnType("decimal(18,2)");
            entity.Property(s => s.EmployeeName).IsRequired().HasMaxLength(200);

            entity.HasOne(s => s.Recipient)
                  .WithMany()
                  .HasForeignKey(s => s.RecipientId)
                  .OnDelete(DeleteBehavior.NoAction);
        });

        // CourseGroupInstructor (Join Table)
        modelBuilder.Entity<CourseGroupInstructor>(entity =>
        {
            entity.HasKey(cgi => cgi.Id);
            
            entity.HasOne(cgi => cgi.CourseGroup)
                  .WithMany(g => g.Instructors)
                  .HasForeignKey(cgi => cgi.CourseGroupId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(cgi => cgi.Instructor)
                  .WithMany()
                  .HasForeignKey(cgi => cgi.InstructorId)
                  .OnDelete(DeleteBehavior.NoAction);
        });

        // CourseGroup
        modelBuilder.Entity<CourseGroup>(entity =>
        {
            entity.HasKey(g => g.Id);
            entity.Property(g => g.Name).IsRequired().HasMaxLength(200);
            entity.Property(g => g.Price).HasColumnType("decimal(18,2)");
            
            entity.HasOne(g => g.CreatedBy)
                  .WithMany()
                  .HasForeignKey(g => g.CreatedById)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // InstructorSession
        modelBuilder.Entity<InstructorSession>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.HoursWorked).HasColumnType("decimal(18,2)");
            entity.Property(s => s.HourlyRateAtTime).HasColumnType("decimal(18,2)");

            entity.HasOne(s => s.Instructor)
                  .WithMany()
                  .HasForeignKey(s => s.InstructorId)
                  .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(s => s.CourseGroup)
                  .WithMany()
                  .HasForeignKey(s => s.CourseGroupId)
                  .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(s => s.Salary)
                  .WithMany()
                  .HasForeignKey(s => s.SalaryId)
                  .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(s => s.CreatedBy)
                  .WithMany()
                  .HasForeignKey(s => s.CreatedById)
                  .OnDelete(DeleteBehavior.NoAction);
        });

        // Expense
        modelBuilder.Entity<Expense>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Description).IsRequired().HasMaxLength(500);
            entity.Property(e => e.PaymentMethod).HasMaxLength(100);
            entity.Property(e => e.Vendor).HasMaxLength(200);
            
            entity.HasOne(e => e.CreatedBy)
                  .WithMany()
                  .HasForeignKey(e => e.CreatedById)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Student
        modelBuilder.Entity<Student>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Name).IsRequired().HasMaxLength(200);
            entity.Property(s => s.Phone).IsRequired().HasMaxLength(20);
            entity.Property(s => s.Email).HasMaxLength(200);
            entity.HasIndex(s => s.Phone);

            entity.HasOne(s => s.CreatedBy)
                  .WithMany()
                  .HasForeignKey(s => s.CreatedById)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // CourseSubscription
        modelBuilder.Entity<CourseSubscription>(entity =>
        {
            entity.HasKey(cs => cs.Id);
            entity.Property(cs => cs.CourseName).IsRequired().HasMaxLength(300);
            entity.Property(cs => cs.TotalPrice).HasColumnType("decimal(18,2)");

            entity.HasOne(cs => cs.Student)
                  .WithMany(s => s.Subscriptions)
                  .HasForeignKey(cs => cs.StudentId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(cs => cs.CourseGroup)
                  .WithMany(g => g.Subscriptions)
                  .HasForeignKey(cs => cs.CourseGroupId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(cs => cs.CreatedBy)
                  .WithMany()
                  .HasForeignKey(cs => cs.CreatedById)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // ... existing configurations for Payment and AuditLog ...
        // Payment
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Amount).HasColumnType("decimal(18,2)");
            entity.Property(p => p.PaymentMethod).IsRequired().HasMaxLength(50);
            entity.Property(p => p.ReceiptId).IsRequired().HasMaxLength(50);
            entity.HasIndex(p => p.ReceiptId).IsUnique();

            entity.HasOne(p => p.CourseSubscription)
                  .WithMany(cs => cs.Payments)
                  .HasForeignKey(p => p.CourseSubscriptionId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(p => p.CreatedBy)
                  .WithMany()
                  .HasForeignKey(p => p.CreatedById)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // AuditLog
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.HasOne(a => a.User)
                  .WithMany()
                  .HasForeignKey(a => a.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // StudentSession
        modelBuilder.Entity<StudentSession>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.HasOne(s => s.CourseGroup)
                  .WithMany()
                  .HasForeignKey(s => s.CourseGroupId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // StudentAttendance
        modelBuilder.Entity<StudentAttendance>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.HasOne(a => a.StudentSession)
                  .WithMany(s => s.Attendances)
                  .HasForeignKey(a => a.StudentSessionId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.Student)
                  .WithMany()
                  .HasForeignKey(a => a.StudentId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
